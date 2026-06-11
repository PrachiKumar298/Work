const getRequestBody = (req) => new Promise((resolve, reject) => {
  let raw = '';
  req.on('data', (chunk) => { raw += chunk; if (raw.length > 10 * 1024 * 1024) { reject(new Error('Request body too large')); req.destroy(); } });
  req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(new Error('Invalid JSON body')); } });
  req.on('error', reject);
});

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  try {
    const body = await getRequestBody(req);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'OPENAI_API_KEY is not configured on the server.' });

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ input: body.texts || body.input || [], model: body.model || process.env.EMBEDDING_MODEL || 'text-embedding-3-small' })
    });
    const data = await response.json().catch(async () => ({ error: await response.text() }));
    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
