const fs = require('fs');
const vm = require('vm');

function loadScript(path, sandbox) {
  const code = fs.readFileSync(path, 'utf8');
  vm.runInNewContext(code, sandbox);
}

const sandbox = { window: { ENV: { PINECONE_HOST: '', PINECONE_API_KEY: '', OPENAI_API_KEY: '' } }, console };

try {
  loadScript('pinecone-client.js', sandbox);
  loadScript('embeddings.js', sandbox);
  loadScript('fid-engine.js', sandbox);
  const W = sandbox.window;
  console.log('PineconeClient present:', Boolean(W.PineconeClient));
  console.log('Pinecone isConfigured():', W.PineconeClient?.isConfigured());
  console.log('Embeddings present:', Boolean(W.Embeddings));
  console.log('Embeddings isConfigured():', W.Embeddings?.isConfigured());
  console.log('FidEngine present:', Boolean(W.FidEngine));
  const test = W.FidEngine ? W.FidEngine.ingestChunksToPinecone('proj', 'doc', [{chunkNumber:1, content:'hi', source:'doc'}]) : null;
  Promise.resolve(test).then((r) => console.log('ingestChunksToPinecone result (expected dependency error):', r)).catch((e) => console.error('ingest error', e));
} catch (e) {
  console.error('Smoke test failed to load modules:', e);
}
