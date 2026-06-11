const getRequestBody = (req) => new Promise((resolve, reject) => {
  let raw = '';
  req.on('data', (chunk) => { raw += chunk; if (raw.length > 5 * 1024 * 1024) { reject(new Error('Request body too large')); req.destroy(); } });
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
    const host = process.env.PINECONE_HOST;
    const apiKey = process.env.PINECONE_API_KEY;
    if (!host || !apiKey) return res.status(503).json({ error: 'PINECONE_HOST and PINECONE_API_KEY are not configured on the server.' });

    const endpoint = `${host.replace(/\/$/, '')}/query`;
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey }, body: JSON.stringify(body) });
    const data = await response.json().catch(async () => ({ error: await response.text() }));
    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
