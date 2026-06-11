(function () {
  const MODEL = window.ENV?.EMBEDDING_MODEL || "text-embedding-ada-002";

  function apiUrl(path) {
    const base = window.ENV?.RAG_BACKEND_URL || "";
    return base ? `${base.replace(/\/$/, "")}${path}` : path;
  }

  function isConfigured() {
    return window.location.protocol.startsWith("http");
  }

  async function embedText(text) {
    return embedTexts([text]).then((r) => (r?.[0] || null));
  }

  async function embedTexts(texts) {
    if (!isConfigured()) return null;
    const res = await fetch(apiUrl("/api/embed"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, model: MODEL })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Embedding backend failed: ${res.status} ${txt}`);
    }
    const data = await res.json();
    return (data.data || []).map((d) => d.embedding || d.vector || null);
  }

  window.Embeddings = { isConfigured, embedText, embedTexts };
})();
