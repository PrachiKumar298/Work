(function () {
  const stopWords = new Set([
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "do", "for",
    "from", "has", "have", "how", "if", "in", "is", "it", "of", "on", "or", "that",
    "the", "this", "to", "was", "what", "when", "where", "who", "why", "with"
  ]);

  function tokenize(text) {
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !stopWords.has(token));
  }

  function normalizeText(text) {
    return String(text)
      .replace(/\u0000/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function chunkText(text, sourceName) {
    const cleaned = normalizeText(text);
    if (!cleaned) return [];

    const words = cleaned.split(/\s+/);
    const chunkSize = 95;
    const overlap = 24;
    const chunks = [];

    for (let start = 0; start < words.length; start += chunkSize - overlap) {
      const chunkWords = words.slice(start, start + chunkSize);
      if (chunkWords.length < 8 && chunks.length) break;
      const content = chunkWords.join(" ");
      chunks.push({
        id: `${sourceName}-${chunks.length + 1}`,
        source: sourceName,
        chunkNumber: chunks.length + 1,
        content,
        tokens: tokenize(content)
      });
      if (start + chunkSize >= words.length) break;
    }

    return chunks;
  }

  async function extractTextFromFile(file) {
    const extension = file.name.split(".").pop().toLowerCase();
    if (extension === "txt") {
      return normalizeText(await file.text());
    }
    if (extension === "docx") {
      return extractDocxText(await file.arrayBuffer());
    }
    if (extension === "pdf") {
      return extractPdfText(await file.arrayBuffer());
    }
    throw new Error("Unsupported file type.");
  }

  async function processFile(file) {
    const raw = await extractTextFromFile(file);
    const text = sanitizeText(raw);
    const chunks = chunkText(text, file.name);
    if (!chunks.length) {
      throw new Error("No readable text was found in this file.");
    }
    return {
      extractedText: text.slice(0, 6000),
      chunks,
      chunkCount: chunks.length
    };
  }

  async function extractDocxText(buffer) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const eocdOffset = findEndOfCentralDirectory(bytes);
    if (eocdOffset < 0) throw new Error("Could not read DOCX structure.");

    const entryCount = view.getUint16(eocdOffset + 10, true);
    let directoryOffset = view.getUint32(eocdOffset + 16, true);

    for (let index = 0; index < entryCount; index += 1) {
      if (view.getUint32(directoryOffset, true) !== 0x02014b50) break;
      const compression = view.getUint16(directoryOffset + 10, true);
      const compressedSize = view.getUint32(directoryOffset + 20, true);
      const nameLength = view.getUint16(directoryOffset + 28, true);
      const extraLength = view.getUint16(directoryOffset + 30, true);
      const commentLength = view.getUint16(directoryOffset + 32, true);
      const localHeaderOffset = view.getUint32(directoryOffset + 42, true);
      const name = new TextDecoder().decode(bytes.slice(directoryOffset + 46, directoryOffset + 46 + nameLength));

      if (name === "word/document.xml") {
        const localNameLength = view.getUint16(localHeaderOffset + 26, true);
        const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
        const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
        const data = bytes.slice(dataStart, dataStart + compressedSize);
        const xml = compression === 0 ? new TextDecoder().decode(data) : await inflateRaw(data);
        return normalizeText(xmlToText(xml));
      }

      directoryOffset += 46 + nameLength + extraLength + commentLength;
    }

    throw new Error("DOCX did not contain readable document text.");
  }

  function findEndOfCentralDirectory(bytes) {
    for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 66000); offset -= 1) {
      if (
        bytes[offset] === 0x50 &&
        bytes[offset + 1] === 0x4b &&
        bytes[offset + 2] === 0x05 &&
        bytes[offset + 3] === 0x06
      ) {
        return offset;
      }
    }
    return -1;
  }

  async function inflateRaw(data) {
    if (!("DecompressionStream" in window)) {
      throw new Error("DOCX decompression is not available in this browser.");
    }
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new TextDecoder().decode(await new Response(stream).arrayBuffer());
  }

  function xmlToText(xml) {
    return xml
      .replace(/<\/w:p>/g, "\n")
      .replace(/<w:tab\/>/g, "\t")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  function sanitizeText(text) {
    if (!text) return text;
    let out = String(text);
    out = out.replace(/<\/?rdf:[^>]*>/gi, "");
    out = out.replace(/\brdf:(?:Description|about|resource)\b/gi, "");
    out = out.replace(/xmlns:[a-zA-Z0-9_-]+=(?:"[^"]*"|'[^']*')/gi, "");
    out = out.replace(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?:\s+\1)+/g, "$1");
    out = out.replace(/[<>]/g, "");
    out = out.replace(/\s{2,}/g, " ").trim();
    return out;
  }

  function extractPdfText(buffer) {
    const raw = new TextDecoder("latin1").decode(buffer);
    const textRuns = [];
    const stringPattern = /\((?:\\.|[^\\)])*\)\s*Tj|\[(?:.|\n|\r)*?\]\s*TJ/g;
    const matches = raw.match(stringPattern) || [];

    matches.forEach((match) => {
      const strings = match.match(/\((?:\\.|[^\\)])*\)/g) || [];
      strings.forEach((value) => textRuns.push(decodePdfString(value.slice(1, -1))));
    });

    if (textRuns.join(" ").trim().length < 30) {
      const fallback = raw.match(/[A-Za-z][A-Za-z0-9,.;:'"!?()\- ]{20,}/g) || [];
      textRuns.push(...fallback.slice(0, 120));
    }

    const text = normalizeText(textRuns.join(" "));
    if (!text) {
      throw new Error("No readable text was found in this PDF. Try a text-based PDF or TXT file.");
    }
    return text;
  }

  function decodePdfString(value) {
    return value
      .replace(/\\([nrtbf()\\])/g, (_, code) => {
        const map = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", "(": "(", ")": ")", "\\": "\\" };
        return map[code] || code;
      })
      .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
  }

  function retrieve(query, documents, limit = 4) {
    const queryTokens = tokenize(query);
    if (!queryTokens.length) return [];

    const chunks = documents
      .filter((doc) => doc.status === "processed")
      .flatMap((doc) => (doc.chunks || []).map((chunk) => ({ ...chunk, documentName: doc.name })));

    const docFrequency = new Map();
    chunks.forEach((chunk) => {
      new Set(chunk.tokens).forEach((token) => docFrequency.set(token, (docFrequency.get(token) || 0) + 1));
    });

    const queryVector = termVector(queryTokens, docFrequency, chunks.length);

    return chunks
      .map((chunk) => {
        const chunkVector = termVector(chunk.tokens, docFrequency, chunks.length);
        return {
          ...chunk,
          score: cosineSimilarity(queryVector, chunkVector)
        };
      })
      .filter((chunk) => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  function termVector(tokens, docFrequency, totalDocs) {
    const counts = new Map();
    tokens.forEach((token) => counts.set(token, (counts.get(token) || 0) + 1));
    const vector = new Map();
    counts.forEach((count, token) => {
      const idf = Math.log((1 + totalDocs) / (1 + (docFrequency.get(token) || 0))) + 1;
      vector.set(token, count * idf);
    });
    return vector;
  }

  function cosineSimilarity(a, b) {
    let dot = 0;
    let aMagnitude = 0;
    let bMagnitude = 0;

    a.forEach((value, token) => {
      aMagnitude += value * value;
      dot += value * (b.get(token) || 0);
    });
    b.forEach((value) => {
      bMagnitude += value * value;
    });

    if (!aMagnitude || !bMagnitude) return 0;
    return dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude));
  }

  function answer(query, documents) {
    const retrieved = retrieve(query, documents);
    if (!retrieved.length) {
      return {
        text: "I could not find a strong match in the processed documents. Add more source material or ask with terms that appear in the documents.",
        citations: ["No matching source"],
        context: "No chunks passed the retrieval threshold for this query.",
        retrieved: []
      };
    }

    const queryTerms = new Set(tokenize(query));
    const selectedSentences = [];

    retrieved.forEach((chunk) => {
      const sentences = chunk.content.match(/[^.!?]+[.!?]?/g) || [chunk.content];
      const best = sentences
        .map((sentence) => ({
          sentence: sentence.trim(),
          score: tokenize(sentence).filter((token) => queryTerms.has(token)).length
        }))
        .sort((a, b) => b.score - a.score)[0];
      if (best?.sentence) {
        const clean = sanitizeText(best.sentence);
        if (!selectedSentences.includes(clean)) selectedSentences.push(clean);
      }
    });

    const citations = retrieved.map((chunk) => `${chunk.documentName} chunk ${chunk.chunkNumber}`);
    return {
      text: selectedSentences.slice(0, 3).join(" ") || sanitizeText(retrieved[0].content),
      citations: [...new Set(citations)],
      context: retrieved
        .map((chunk) => `[${chunk.documentName} chunk ${chunk.chunkNumber}] ${sanitizeText(chunk.content)}`)
        .join("\n\n"),
      retrieved
    };
  }

  window.RagEngine = {
    answer,
    chunkText,
    processFile,
    retrieve
  };
})();
