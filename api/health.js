module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    return res.status(200).json({
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      pineconeConfigured: Boolean(process.env.PINECONE_HOST && process.env.PINECONE_API_KEY),
      embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
      generationModel: process.env.GENERATION_MODEL || "gpt-4o-mini"
    });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
