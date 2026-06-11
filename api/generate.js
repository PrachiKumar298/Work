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

    // Build a simple prompt that instructs the model to answer using passages
    const passages = Array.isArray(body.passages) ? body.passages : [];
    let prompt = 'Answer the question using only the provided passages. Cite passage numbers in square brackets.\n\n';
    prompt += `Question: ${body.query || ''}\n\nPassages:\n`;
    passages.forEach((passage, index) => {
      prompt += `[${index + 1}] ${passage.text || ''}\nSource: ${passage.source || passage.id || 'unknown'}\n\n`;
    });
    prompt += 'Write a concise grounded answer. If the passages do not answer the question, say that clearly.';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: body.model || process.env.GENERATION_MODEL || 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are a careful RAG assistant. Ground every answer in retrieved passages.' }, { role: 'user', content: prompt }], max_tokens: 512, temperature: 0 })
    });
    const data = await response.json().catch(async () => ({ error: await response.text() }));
    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
