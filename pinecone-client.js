(function () {
  let healthCache = null;

  function apiUrl(path) {
    const base = window.ENV?.RAG_BACKEND_URL || "";
    return base ? `${base.replace(/\/$/, "")}${path}` : path;
  }

  function isConfigured() {
    return window.location.protocol.startsWith("http");
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

  async function upsert(vectors, namespace) {
    if (!isConfigured()) return { data: null, skipped: true, error: "RAG backend not available from file://." };
    const body = { vectors, namespace };
    const res = await fetch(apiUrl("/api/pinecone/upsert"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) return { data: null, skipped: res.status === 503, error: `Pinecone upsert failed: ${res.status}` };
    const data = await res.json();
    return { data, error: null };
  }

  async function query(vector, topK = 5, namespace) {
    if (!isConfigured()) return { data: null, skipped: true, error: "RAG backend not available from file://." };
    const body = {
      vector,
      topK,
      includeMetadata: true,
      includeValues: false,
      namespace
    };
    const res = await fetch(apiUrl("/api/pinecone/query"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) return { data: null, skipped: res.status === 503, error: `Pinecone query failed: ${res.status}` };
    const data = await res.json();
    return { data, error: null };
  }

  window.PineconeClient = { health, isConfigured, upsert, query };
})();
