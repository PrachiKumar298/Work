(function () {
  const MODEL = window.ENV?.GENERATION_MODEL || "gpt-4";

  let healthCache = null;

  function apiUrl(path) {
    const base = window.ENV?.RAG_BACKEND_URL || "";
    return base ? `${base.replace(/\/$/, "")}${path}` : path;
  }

  async function health() {
    if (healthCache) return healthCache;
    try {
      const res = await fetch(apiUrl("/api/health"));
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      healthCache = await res.json();
      return healthCache;
    } catch (error) {
      return { openaiConfigured: false, pineconeConfigured: false, error: error.message };
    }
  }

  async function remoteAvailable() {
    const status = await health();
    return Boolean(status.openaiConfigured && status.pineconeConfigured);
  }

  async function ingestChunksToPinecone(projectId, documentId, chunks) {
    if (!window.PineconeClient || !window.Embeddings) return { error: "Dependencies missing" };
    if (!(await remoteAvailable())) return { skipped: true, error: "Advanced RAG backend is not configured." };
    const texts = chunks.map((c) => c.content);
    const embeddings = await window.Embeddings.embedTexts(texts);
    if (!embeddings || !Array.isArray(embeddings)) {
      return { error: "Embeddings not available (check OPENAI_API_KEY)" };
    }
    const vectors = embeddings.map((vec, i) => ({
      id: `${documentId}-${i + 1}`,
      values: vec,
      metadata: {
        document_id: documentId,
        project_id: projectId,
        chunk_number: chunks[i].chunkNumber,
        source: chunks[i].source,
        content: chunks[i].content
      }
    }));
    const resp = await window.PineconeClient.upsert(vectors, projectId);
    return resp;
  }

  async function queryFiD(projectId, query, topK = 5) {
    if (!window.PineconeClient || !window.Embeddings) return { error: "Dependencies missing" };
    if (!(await remoteAvailable())) return { error: "Advanced RAG backend is not configured.", skipped: true };
    const qVec = await window.Embeddings.embedText(query);
    const { data, error } = await window.PineconeClient.query(qVec, topK, projectId);
    if (error) return { error };
    const matches = (data?.matches || []).map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
    if (!matches.length) return { error: "No vector matches found.", matches: [] };

    // Build FiD-style prompt: present each passage separately so the model can attend
    const passages = matches.map((m, idx) => ({
      id: m.id,
      text: m.metadata?.content || "",
      source: m.metadata?.document_id || m.metadata?.source || ""
    }));

    const answer = await generateWithFiD(query, passages);
    return { answer, matches };
  }

  async function generateWithFiD(query, passages) {
    const res = await fetch(apiUrl("/api/generate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, passages, model: MODEL })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Generation backend failed: ${res.status} ${txt}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    return { text, raw: data };
  }

  // Check whether only OpenAI generation is available (no Pinecone required)
  async function openAIAvailable() {
    try {
      const s = await health();
      return Boolean(s.openaiConfigured);
    } catch (e) {
      return false;
    }
  }

  // Generate a readable answer from an array of chunks using the server-side generator.
  // chunks: array of { id, source, chunkNumber, content }
  async function generateFromChunks(query, chunks) {
    const passages = (chunks || []).map((c) => ({ id: c.id || `${c.source}-${c.chunkNumber}`, text: c.content || "", source: c.source || c.document_id || "" }));
    const res = await fetch(apiUrl("/api/generate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, passages, model: MODEL })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Generation backend failed: ${res.status} ${txt}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    return { text, raw: data };
  }

  window.FidEngine = { generateWithFiD, generateFromChunks, openAIAvailable, health, ingestChunksToPinecone, queryFiD, remoteAvailable };
})();
