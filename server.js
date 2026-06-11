const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 4180);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".sql": "text/plain; charset=utf-8",
  ".zip": "application/zip"
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 10 * 1024 * 1024) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

async function proxyOpenAIEmbeddings(res, body) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return sendJson(res, 503, { error: "OPENAI_API_KEY is not configured on the server." });

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: body.texts || body.input || [],
      model: body.model || process.env.EMBEDDING_MODEL || "text-embedding-3-small"
    })
  });
  const data = await response.json().catch(async () => ({ error: await response.text() }));
  sendJson(res, response.ok ? 200 : response.status, data);
}

async function proxyOpenAIGeneration(res, body) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return sendJson(res, 503, { error: "OPENAI_API_KEY is not configured on the server." });

  const passages = Array.isArray(body.passages) ? body.passages : [];
  let prompt = "Answer the question using only the provided passages. Cite passage numbers in square brackets.\n\n";
  prompt += `Question: ${body.query || ""}\n\nPassages:\n`;
  passages.forEach((passage, index) => {
    prompt += `[${index + 1}] ${passage.text || ""}\nSource: ${passage.source || passage.id || "unknown"}\n\n`;
  });
  prompt += "Write a concise grounded answer. If the passages do not answer the question, say that clearly.";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: body.model || process.env.GENERATION_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a careful RAG assistant. Ground every answer in retrieved passages." },
        { role: "user", content: prompt }
      ],
      max_tokens: 512,
      temperature: 0
    })
  });
  const data = await response.json().catch(async () => ({ error: await response.text() }));
  sendJson(res, response.ok ? 200 : response.status, data);
}

async function proxyPinecone(res, action, body) {
  const host = process.env.PINECONE_HOST;
  const apiKey = process.env.PINECONE_API_KEY;
  if (!host || !apiKey) return sendJson(res, 503, { error: "PINECONE_HOST and PINECONE_API_KEY are not configured on the server." });

  const endpoint = action === "upsert" ? "/vectors/upsert" : "/query";
  const response = await fetch(`${host.replace(/\/$/, "")}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKey
    },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(async () => ({ error: await response.text() }));
  sendJson(res, response.ok ? 200 : response.status, data);
}

async function handleApi(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  if (req.url === "/api/health") {
    return sendJson(res, 200, {
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      pineconeConfigured: Boolean(process.env.PINECONE_HOST && process.env.PINECONE_API_KEY),
      embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
      generationModel: process.env.GENERATION_MODEL || "gpt-4o-mini"
    });
  }

  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed." });

  try {
    const body = await readJson(req);
    if (req.url === "/api/embed") return proxyOpenAIEmbeddings(res, body);
    if (req.url === "/api/generate") return proxyOpenAIGeneration(res, body);
    if (req.url === "/api/pinecone/upsert") return proxyPinecone(res, "upsert", body);
    if (req.url === "/api/pinecone/query") return proxyPinecone(res, "query", body);
    sendJson(res, 404, { error: "Unknown API endpoint." });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error." });
  }
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const safePath = path.normalize(urlPath === "/" ? "/index.html" : urlPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const type = mimeTypes[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) return handleApi(req, res);
  serveStatic(req, res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Inventive RAG running at http://127.0.0.1:${port}`);
});
