const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('rag-engine.js', 'utf8');
const sandbox = { window: {}, console };
vm.runInNewContext(code, sandbox);
const Rag = sandbox.window.RagEngine;

// Build a chunk that contains RDF fragments and repeated UUIDs
const sampleContent = `rdf:Description rdf:about uuid:B68FC688-AE42-4BA9-9A50-5F5996EFCB2F B68FC688-AE42-4BA9-9A50-5F5996EFCB2F B68FC688-AE42-4BA9-9A50-5F5996EFCB2F\n
Some useful text: onboarding friction and fragmented documents slow support answers.`;

// Create tokens that will match the test query
const tokenChunk = Rag.chunkText('onboarding friction fragmented documents', 'doc1')[0];
const chunk = {
  id: 'doc1-1',
  source: 'doc1',
  chunkNumber: 1,
  content: sampleContent,
  tokens: tokenChunk.tokens,
  documentName: 'doc1'
};

const docs = [{ name: 'doc1', status: 'processed', chunks: [chunk] }];

const res = Rag.answer('onboarding friction', docs);
console.log('=== ANSWER ===');
console.log(res.text);
console.log('\n=== CITATIONS ===');
console.log(JSON.stringify(res.citations, null, 2));
console.log('\n=== CONTEXT (truncated) ===');
console.log(res.context.slice(0, 500));
