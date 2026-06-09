const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('rag-engine.js', 'utf8');
const sandbox = { window: {}, console };
vm.runInNewContext(code, sandbox);
const Rag = sandbox.window.RagEngine;

// Simulate PDF-extracted raw content containing internal tokens
const pdfLike = `R DescendantFonts 21 0 R FontDescriptor 24 0 R TimesNewRomanPS-ItalicMT FontDescriptor 28 0 R TimesNewRomanPS-ItalicMT FontDescriptor 32 0 R TimesNewRomanPS-BoldMT DescendantFonts 36 0 R TimesNewRomanPS-BoldMT FontDescriptor 39 0 R TimesNewRomanPS-BoldMT FontDescriptor 48 0 R FontDescriptor 50 0 R CreationDate(D:20251027102514 ModDate(D:20251027102514 Title(Slide 1: Development) W5M0MpCehiHzreSzNTczkc9d)\n\nHuman readable sentence about onboarding and friction in support processes.`;

const tokenChunk = Rag.chunkText('onboarding support', 'pdfdoc')[0];
const chunk = {
  id: 'pdfdoc-1',
  source: 'pdfdoc',
  chunkNumber: 1,
  content: pdfLike,
  tokens: tokenChunk.tokens,
  documentName: 'pdfdoc'
};
const docs = [{ name: 'pdfdoc', status: 'processed', chunks: [chunk] }];
const res = Rag.answer('onboarding', docs);
console.log('=== SANITIZED ANSWER ===');
console.log(res.text);
console.log('\n=== CONTEXT ===');
console.log(res.context);
