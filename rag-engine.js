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

    const sentences = cleaned.match(/[^.!?]+[.!?]?(?:\s+|$)/g) || [cleaned];
    
    const chunks = [];
    const targetWords = 110; 
    const overlapSentences = 1; 
    
    let currentSentences = [];
    let currentWordCount = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;

      const sentenceWords = sentence.split(/\s+/).length;
      
      if (currentWordCount + sentenceWords > targetWords && currentSentences.length > 0) {
        const content = currentSentences.join(" ");
        chunks.push({
          id: `${sourceName}-${chunks.length + 1}`,
          source: sourceName,
          chunkNumber: chunks.length + 1,
          content,
          tokens: tokenize(content)
        });

        const overlapCount = Math.min(overlapSentences, currentSentences.length);
        currentSentences = currentSentences.slice(currentSentences.length - overlapCount);
        currentWordCount = currentSentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0);
      }

      currentSentences.push(sentence);
      currentWordCount += sentenceWords;
    }

    if (currentSentences.length > 0) {
      const content = currentSentences.join(" ");
      chunks.push({
        id: `${sourceName}-${chunks.length + 1}`,
        source: sourceName,
        chunkNumber: chunks.length + 1,
        content,
        tokens: tokenize(content)
      });
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
    const text = await extractTextFromFile(file);
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

  function extractPdfText(buffer) {
    const raw = new TextDecoder("latin1").decode(buffer);
    const textRuns = [];

    // Parse balanced PDF string parentheses and TJ bracket arrays
    let i = 0;
    while (i < raw.length) {
      if (raw[i] === '(') {
        let depth = 1;
        let str = "";
        i++;
        while (i < raw.length && depth > 0) {
          const char = raw[i];
          if (char === '\\') {
            str += raw.slice(i, i + 2);
            i += 2;
          } else if (char === '(') {
            depth++;
            str += '(';
            i++;
          } else if (char === ')') {
            depth--;
            if (depth > 0) {
              str += ')';
            }
            i++;
          } else {
            str += char;
            i++;
          }
        }
        textRuns.push(decodePdfString(str));
      } else if (raw[i] === '[') {
        i++;
        let depth = 1;
        while (i < raw.length && depth > 0) {
          const char = raw[i];
          if (char === ']') {
            depth--;
            i++;
          } else if (char === '(') {
            let str = "";
            let sDepth = 1;
            i++;
            while (i < raw.length && sDepth > 0) {
              const sChar = raw[i];
              if (sChar === '\\') {
                str += raw.slice(i, i + 2);
                i += 2;
              } else if (sChar === '(') {
                sDepth++;
                str += '(';
                i++;
              } else if (sChar === ')') {
                sDepth--;
                if (sDepth > 0) {
                  str += ')';
                }
                i++;
              } else {
                str += sChar;
                i++;
              }
            }
            textRuns.push(decodePdfString(str));
          } else {
            i++;
          }
        }
      } else {
        i++;
      }
    }

    if (textRuns.join(" ").trim().length < 30) {
      const fallback = raw.match(/[A-Za-z][A-Za-z0-9,.;:'"!?()\- ]{20,}/g) || [];
      textRuns.push(...fallback.slice(0, 120));
    }

    let text = normalizeText(textRuns.join(" "));
    if (!text) {
      throw new Error("No readable text was found in this PDF. Try a text-based PDF or TXT file.");
    }

    // Clean up PDF-specific object reference garbage (e.g. "FontDescriptor 28 0 R", "5 0 R", "R 5 0")
    text = text
      .replace(/FontDescriptor\s+\d+\s+\d+\s+R/gi, "")
      .replace(/\b\d+\s+\d+\s+R\b/gi, "")
      .replace(/\bR\s+\d+\s+\d+/g, "")
      .replace(/\bFontDescriptor\b/gi, "")
      .replace(/\bR\b/g, "")
      .replace(/\bTj\b/gi, "")
      .replace(/\bTJ\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

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
    const findings = [];

    retrieved.forEach((chunk) => {
      const sentences = chunk.content.match(/[^.!?]+[.!?]?/g) || [chunk.content];
      const best = sentences
        .map((sentence) => ({
          sentence: sentence.trim(),
          score: tokenize(sentence).filter((token) => queryTerms.has(token)).length
        }))
        .sort((a, b) => b.score - a.score)[0];
      
      if (best?.sentence) {
        let cleaned = best.sentence
          .replace(/\[[a-zA-Z0-9_-]+-id\]/gi, "")
          .replace(/\s+/g, " ")
          .trim();
        
        if (cleaned) {
          findings.push({
            documentName: chunk.documentName,
            chunkNumber: chunk.chunkNumber,
            sentence: cleaned
          });
        }
      }
    });

    const findingsText = [
      "Based on a local search of your documents, here are the most relevant findings:\n",
      ...findings.map(f => `* **${f.documentName} (chunk ${f.chunkNumber})**: "${f.sentence}"`)
    ].join("\n");

    const citations = retrieved.map((chunk) => `${chunk.documentName} chunk ${chunk.chunkNumber}`);
    return {
      text: findingsText || "No readable content could be extracted from matches.",
      citations: [...new Set(citations)],
      context: retrieved
        .map((chunk) => `[${chunk.documentName} chunk ${chunk.chunkNumber}] ${chunk.content}`)
        .join("\n\n"),
      retrieved
    };
  }

  function cosineSimilarityVectors(a, b) {
    let dot = 0;
    let aMag = 0;
    let bMag = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      aMag += a[i] * a[i];
      bMag += b[i] * b[i];
    }
    if (!aMag || !bMag) return 0;
    return dot / (Math.sqrt(aMag) * Math.sqrt(bMag));
  }

  async function embedQuery(text, apiKey) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: {
          parts: [{ text }]
        }
      })
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini Embedding error: ${err || response.statusText}`);
    }
    const data = await response.json();
    return data.embedding?.values || [];
  }

  async function embedChunks(chunks, apiKey) {
    if (!chunks || !chunks.length) return [];
    const BATCH = 50;
    const results = [];
    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH);
      const requests = batch.map(chunk => ({
        model: "models/gemini-embedding-001",
        content: {
          parts: [{ text: chunk.content }]
        }
      }));
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests })
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini Batch Embedding error: ${err || response.statusText}`);
      }
      const data = await response.json();
      if (!data.embeddings) {
        throw new Error("Invalid response from Gemini Batch Embedding API");
      }
      results.push(...data.embeddings.map(e => e.values));
    }
    return results;
  }

  async function generateGeminiAnswer(query, retrievedChunks, settings) {
    if (!retrievedChunks || !retrievedChunks.length) {
      return {
        text: "I could not find any relevant text in the processed documents to answer your question.",
        citations: [],
        context: "No chunks were retrieved.",
        retrieved: []
      };
    }
    const contextText = retrievedChunks
      .map((chunk, idx) => `[Source ${idx + 1}: ${chunk.source || chunk.documentName} chunk ${chunk.chunkNumber}]\n${chunk.content}`)
      .join("\n\n");

    const systemPrompt = `You are a professional research AI assistant answering questions based on the user's document collections.
Your goal is to write a highly polished, coherent, and grammatically perfect synthesis that directly answers the question using the context below.

Guidelines:
1. Ground your answer strictly in the provided Context Documents. If the context does not contain the answer or is not relevant, reply exactly with: "I could not find a strong match in the processed documents."
2. Write in a continuous, fluent, and well-structured narrative style. Avoid copying sentences verbatim or stitching disconnected quotes together. Ensure smooth logical transitions between sentences.
3. Handle placeholders: The source text might contain placeholders like "[source-id]" (which represent missing words like "representations", "embeddings", "hierarchical", "compositionality", or citations). When writing your answer, replace or omit these placeholders to produce natural, grammatically correct sentences. Reconstruct the missing words using the surrounding context and your general knowledge.
4. Cite the sources in your answer text using the exact bracket format at the end of relevant statements (e.g., [Source 1], [Source 2]). Do NOT combine them as [Source 1, 2], write them as [Source 1][Source 2].
5. Keep the response concise, clear, and professional.`;

    const modelName = settings.geminiModel || "gemini-2.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${settings.geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nContext Documents:\n${contextText}\n\nQuestion: ${query}` }]
          }
        ],
        generationConfig: {
          temperature: 0.2
        }
      })
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini Answer generation error: ${err || response.statusText}`);
    }
    const data = await response.json();
    const answerText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated by model.";

    const citations = [];
    retrievedChunks.forEach((chunk, idx) => {
      const tag = `[Source ${idx + 1}]`;
      if (answerText.includes(tag)) {
        citations.push(`${chunk.source || chunk.documentName} chunk ${chunk.chunkNumber}`);
      }
    });

    if (citations.length === 0 && retrievedChunks.length > 0 && !answerText.startsWith("I could not find")) {
      citations.push(`${retrievedChunks[0].source || retrievedChunks[0].documentName} chunk ${retrievedChunks[0].chunkNumber}`);
    }

    return {
      text: answerText,
      citations: [...new Set(citations)],
      context: contextText,
      retrieved: retrievedChunks
    };
  }

  async function queryPinecone(queryEmbedding, topK, projectId, settings) {
    const cleanHost = settings.pineconeIndexHost.replace(/\/$/, "");
    const response = await fetch(`${cleanHost}/query`, {
      method: "POST",
      headers: {
        "Api-Key": settings.pineconeApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        vector: queryEmbedding,
        topK: topK,
        includeMetadata: true,
        namespace: projectId
      })
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Pinecone Query error: ${err || response.statusText}`);
    }
    const data = await response.json();
    const matches = data.matches || [];
    return matches.map(match => ({
      id: match.id,
      score: match.score,
      source: match.metadata?.source || "",
      documentName: match.metadata?.source || "",
      chunkNumber: match.metadata?.chunkNumber || 1,
      content: match.metadata?.content || "",
      documentId: match.metadata?.documentId || ""
    }));
  }

  async function upsertToPinecone(chunks, projectId, settings) {
    if (!chunks || !chunks.length) return;
    const cleanHost = settings.pineconeIndexHost.replace(/\/$/, "");
    const vectors = chunks.map(chunk => ({
      id: chunk.id || `${projectId}-${chunk.source}-${chunk.chunkNumber}`,
      values: chunk.embedding,
      metadata: {
        documentId: chunk.documentId || "",
        projectId: projectId,
        source: chunk.source,
        chunkNumber: chunk.chunkNumber,
        content: chunk.content
      }
    }));
    
    const BATCH = 100;
    for (let i = 0; i < vectors.length; i += BATCH) {
      const batch = vectors.slice(i, i + BATCH);
      const response = await fetch(`${cleanHost}/vectors/upsert`, {
        method: "POST",
        headers: {
          "Api-Key": settings.pineconeApiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vectors: batch,
          namespace: projectId
        })
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Pinecone Upsert error: ${err || response.statusText}`);
      }
    }
  }

  async function deleteFromPinecone(docId, projectId, settings) {
    const cleanHost = settings.pineconeIndexHost.replace(/\/$/, "");
    const response = await fetch(`${cleanHost}/vectors/delete`, {
      method: "POST",
      headers: {
        "Api-Key": settings.pineconeApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        filter: {
          documentId: docId
        },
        namespace: projectId
      })
    });
    if (!response.ok) {
      const err = await response.text();
      console.error(`Pinecone Delete error: ${err || response.statusText}`);
    }
  }

  async function deleteProjectFromPinecone(projectId, settings) {
    const cleanHost = settings.pineconeIndexHost.replace(/\/$/, "");
    const response = await fetch(`${cleanHost}/vectors/delete`, {
      method: "POST",
      headers: {
        "Api-Key": settings.pineconeApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        deleteAll: true,
        namespace: projectId
      })
    });
    if (!response.ok) {
      const err = await response.text();
      console.error(`Pinecone Delete Project Namespace error: ${err || response.statusText}`);
    }
  }

  async function testCredentials(settings) {
    const results = { gemini: false, pinecone: false, geminiErr: "", pineconeErr: "" };
    if (settings.geminiApiKey) {
      try {
        await embedQuery("test connection", settings.geminiApiKey);
        results.gemini = true;
      } catch (err) {
        results.geminiErr = err.message;
      }
    } else {
      results.geminiErr = "No Gemini API key supplied.";
    }

    if (settings.pineconeApiKey && settings.pineconeIndexHost) {
      try {
        const cleanHost = settings.pineconeIndexHost.replace(/\/$/, "");
        const response = await fetch(`${cleanHost}/query`, {
          method: "POST",
          headers: {
            "Api-Key": settings.pineconeApiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            vector: new Array(768).fill(0),
            topK: 1,
            namespace: "test-connection-namespace"
          })
        });
        if (response.ok) {
          results.pinecone = true;
        } else {
          const body = await response.text();
          results.pineconeErr = `Pinecone replied with code ${response.status}: ${body}`;
        }
      } catch (err) {
        results.pineconeErr = err.message;
      }
    } else if (settings.vectorDb === "pinecone") {
      results.pineconeErr = "Pinecone API key or index host missing.";
    }
    return results;
  }

  window.RagEngine = {
    answer,
    chunkText,
    processFile,
    retrieve,
    cosineSimilarityVectors,
    embedQuery,
    embedChunks,
    generateGeminiAnswer,
    queryPinecone,
    upsertToPinecone,
    deleteFromPinecone,
    deleteProjectFromPinecone,
    testCredentials
  };
})();
