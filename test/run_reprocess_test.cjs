const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('rag-engine.js', 'utf8');
const sandbox = { window: {}, console };
vm.runInNewContext(code, sandbox);
const Rag = sandbox.window.RagEngine;

// Sample project with a document that contains PDF internals
const projects = [
  {
    id: 'p1',
    name: 'PDF Project',
    documents: [
      {
        id: 'd1',
        name: 'weird.pdf',
        status: 'processed',
        extractedText: 'R DescendantFonts 21 0 R FontDescriptor 24 0 R CreationDate(D:20251027102514) Some real sentence about onboarding.'
      }
    ]
  }
];

const reprocessed = Rag.reprocessProjects(projects);
console.log('=== BEFORE ===');
console.log(projects[0].documents[0].extractedText);
console.log('\n=== AFTER (extractedText preview) ===');
console.log(reprocessed[0].documents[0].extractedText);
console.log('\n=== CHUNK COUNT ===');
console.log(reprocessed[0].documents[0].chunkCount);
console.log('\n=== CHUNK SAMPLE ===');
console.log(reprocessed[0].documents[0].chunks[0]);
