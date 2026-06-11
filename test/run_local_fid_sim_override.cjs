const fs = require('fs');
const vm = require('vm');

function loadScript(path, sandbox) {
  const code = fs.readFileSync(path, 'utf8');
  vm.runInNewContext(code, sandbox);
}

const sandbox = { window: { ENV: {} }, console };

// Mock fetch so fid-engine health() reports OpenAI + Pinecone configured
sandbox.fetch = async function (url, opts) {
  if (typeof url === 'string' && url.includes('/api/generate')) {
    return {
      ok: true,
      json: async () => ({ choices: [ { message: { content: 'Simulated generated answer from backend.' } } ] })
    };
  }
  // Default health response
  return {
    ok: true,
    json: async () => ({ openaiConfigured: true, pineconeConfigured: true })
  };
};

// Load required modules into the sandbox
loadScript('rag-engine.js', sandbox);
loadScript('pinecone-client.js', sandbox);
loadScript('embeddings.js', sandbox);
loadScript('fid-engine.js', sandbox);

const W = sandbox.window;

// Mock embeddings to return deterministic vectors (no external API)
W.Embeddings = W.Embeddings || {};
W.Embeddings.isConfigured = () => true;
W.Embeddings.embedText = async (t) => Array.isArray(t) ? t.map(() => Array(8).fill(0.1)) : Array(8).fill(0.1);
W.Embeddings.embedTexts = async (texts) => texts.map(() => Array(8).fill(0.1));

// Mock Pinecone query to return topK passages from local chunks passed below
W.PineconeClient = W.PineconeClient || {};
W.PineconeClient.isConfigured = () => true;
W.PineconeClient.query = async (vector, topK = 5, namespace) => {
  const store = W.__LOCAL_STORE || [];
  const matches = store.slice(0, topK).map((c, i) => ({ id: `${c.id}`, score: 1.0 - i * 0.01, metadata: { content: c.content, document_id: c.source, chunk_number: c.chunkNumber } }));
  return { data: { matches } };
};

// Replace FiD generator with a local deterministic combiner (no OpenAI calls)
W.FidEngine = W.FidEngine || {};
W.FidEngine.generateWithFiD = async (query, passages) => {
  const fused = passages.map((p, i) => `(${i + 1}) ${p.text.slice(0, 200)}`).join(' \n\n ');
  return { text: `Simulated FiD answer for: "${query}"\n\n${fused}\n\nCitations: ${passages.map((p, i) => `[${i + 1}] ${p.source || p.id}`).join(', ')}` };
};

// Force remoteAvailable to true so queryFiD proceeds
W.FidEngine.remoteAvailable = async () => true;

// Prepare a sample document and chunks using RagEngine chunker
const sampleText = `Customer interviews repeatedly mention onboarding friction, fragmented documents, and slow support answers. Improve citations and searchable playbooks.`;
const chunks = sandbox.window.RagEngine.chunkText(sampleText, 'sample-doc');

// Store chunks in a local in-memory store that our mocked Pinecone will read
W.__LOCAL_STORE = chunks.map((c, idx) => ({ id: `sample-doc-${idx + 1}`, source: 'sample-doc', chunkNumber: idx + 1, content: c.content }));

(async () => {
  try {
    const projectId = 'local-project';
    const query = 'What problems do customers report about onboarding?';
    const resp = await sandbox.window.FidEngine.queryFiD(projectId, query, 4);
    console.log('=== SIMULATED FiD RESPONSE ===');
    console.log(resp.answer.text);
    console.log('\n=== MATCHES ===');
    console.log(JSON.stringify(resp.matches, null, 2));
  } catch (e) {
    console.error('Local FiD simulation failed:', e);
  }
})();
