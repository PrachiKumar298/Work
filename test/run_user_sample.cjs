const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('rag-engine.js', 'utf8');
const sandbox = { window: {}, console };
vm.runInNewContext(code, sandbox);
const Rag = sandbox.window.RagEngine;

const sample = `rdf:Description rdf:about rdf:Description rdf:about rdf:Description rdf:about rdf:Description rdf:about uuid:B68FC688-AE42-4BA9-9A50-5F5996EFCB2F uuid:B68FC688-AE42-4BA9-9A50-5F5996EFCB2F C68FB642AEA94B9A505F5996EFCB2F C68FB642AEA94B9A505F5996EFCB2F C68FB642AEA94B9A505F5996EFCB2F C68FB642AEA94B9A505F5996EFCB2F C68FB642AEA94B9A505F5996EFCB2F C68FB642AEA94B9A505F5996EFCB2F\n\nSome normal content follows about onboarding.`;

const tokenChunk = Rag.chunkText('onboarding', 'doc2')[0];
const chunk = {
  id: 'doc2-1',
  source: 'doc2',
  chunkNumber: 1,
  content: sample,
  tokens: tokenChunk.tokens,
  documentName: 'doc2'
};
const docs = [{ name: 'doc2', status: 'processed', chunks: [chunk] }];
const res = Rag.answer('onboarding', docs);
console.log('=== RAW CONTENT ===');
console.log(sample);
console.log('\n=== SANITIZED ANSWER ===');
console.log(res.text);
console.log('\n=== SANITIZED CONTEXT ===');
console.log(res.context);
