/**
 * supabase-client.js
 * ------------------
 * Thin wrapper around the Supabase JS SDK (loaded via CDN in index.html).
 * All functions are async and return { data, error } objects so callers
 * can handle failures gracefully.
 *
 * SETUP
 * -----
 * 1. Create a project at https://supabase.com
 * 2. Run supabase-schema.sql in the SQL editor
 * 3. Replace the two constants below with your project URL and anon key
 *    (find them at: Project Settings → API)
 */

(function () {
  // ── Configuration ─────────────────────────────────────────────────────────
  const SUPABASE_URL  = "https://YOUR_PROJECT_ID.supabase.co";  // ← replace
  const SUPABASE_ANON = "YOUR_ANON_PUBLIC_KEY";                  // ← replace

  const isConfigured =
    SUPABASE_URL !== "https://YOUR_PROJECT_ID.supabase.co" &&
    SUPABASE_ANON !== "YOUR_ANON_PUBLIC_KEY";

  let supabase = null;

  function init() {
    if (!isConfigured) {
      console.warn(
        "[InventiveDB] Supabase credentials not set. " +
        "Running in localStorage-only mode. " +
        "Edit supabase-client.js to connect a real database."
      );
      return;
    }
    if (typeof window.supabase === "undefined") {
      console.error("[InventiveDB] Supabase JS SDK not found. Add the CDN script to index.html.");
      return;
    }
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    console.info("[InventiveDB] Connected to Supabase.");
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  /**
   * Sign up with email + password.
   * The `handle_new_user` DB trigger creates the matching profiles row.
   */
  async function signUp(email, password, username) {
    if (!supabase) return localAuthFallback(email, username);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
    if (error) return { data: null, error: error.message };
    return { data: { user: data.user }, error: null };
  }

  /**
   * Sign in with email + password.
   */
  async function signIn(email, password) {
    if (!supabase) return localAuthFallback(email, null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { data: null, error: error.message };
    return { data: { user: data.user, session: data.session }, error: null };
  }

  /**
   * Sign out the current user.
   */
  async function signOut() {
    if (!supabase) return { data: null, error: null };
    const { error } = await supabase.auth.signOut();
    return { data: null, error: error?.message || null };
  }

  /**
   * Retrieve the currently authenticated user (null if logged out).
   */
  async function getUser() {
    if (!supabase) return { data: null, error: null };
    const { data: { user }, error } = await supabase.auth.getUser();
    return { data: user, error: error?.message || null };
  }

  /**
   * Subscribe to auth state changes.
   * callback(event, session) is called on login / logout / token refresh.
   */
  function onAuthStateChange(callback) {
    if (!supabase) return;
    supabase.auth.onAuthStateChange(callback);
  }

  function localAuthFallback(email, username) {
    return {
      data: { user: { id: "local-" + Date.now(), email, user_metadata: { username } } },
      error: null
    };
  }

  // ── Projects ──────────────────────────────────────────────────────────────

  /**
   * Fetch all projects belonging to the logged-in user,
   * ordered newest first.
   */
  async function getProjects(userId) {
    if (!supabase) return { data: [], error: null };
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return { data: data || [], error: error?.message || null };
  }

  /**
   * Create a new project row.
   * Returns the inserted row.
   */
  async function createProject(userId, name) {
    if (!supabase) return { data: { id: crypto.randomUUID(), user_id: userId, name, created_at: new Date().toISOString() }, error: null };
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: userId, name })
      .select()
      .single();
    return { data, error: error?.message || null };
  }

  /**
   * Rename a project.
   */
  async function updateProject(projectId, name) {
    if (!supabase) return { data: null, error: null };
    const { data, error } = await supabase
      .from("projects")
      .update({ name })
      .eq("id", projectId)
      .select()
      .single();
    return { data, error: error?.message || null };
  }

  /**
   * Delete a project and cascade-delete its documents, chunks, and messages.
   */
  async function deleteProject(projectId) {
    if (!supabase) return { data: null, error: null };
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);
    return { data: null, error: error?.message || null };
  }

  // ── Documents ─────────────────────────────────────────────────────────────

  /**
   * Fetch all documents for a project, ordered newest first.
   * Chunks are NOT included here — call getChunks() for that.
   */
  async function getDocuments(projectId) {
    if (!supabase) return { data: [], error: null };
    const { data, error } = await supabase
      .from("documents")
      .select("id, name, type, status, extracted_text, extraction_error, chunk_count, uploaded_at")
      .eq("project_id", projectId)
      .order("uploaded_at", { ascending: false });
    return { data: data || [], error: error?.message || null };
  }

  /**
   * Insert a document record in "pending" state.
   * Returns the new row with its generated id.
   */
  async function createDocument(projectId, userId, name, type) {
    if (!supabase) {
      return {
        data: { id: crypto.randomUUID(), project_id: projectId, user_id: userId, name, type, status: "pending", uploaded_at: new Date().toISOString(), chunk_count: 0 },
        error: null
      };
    }
    const { data, error } = await supabase
      .from("documents")
      .insert({ project_id: projectId, user_id: userId, name, type, status: "pending" })
      .select()
      .single();
    return { data, error: error?.message || null };
  }

  /**
   * Update a document after processing (set status, extracted text, chunk count).
   */
  async function updateDocument(docId, fields) {
    if (!supabase) return { data: null, error: null };
    const { data, error } = await supabase
      .from("documents")
      .update(fields)
      .eq("id", docId)
      .select()
      .single();
    return { data, error: error?.message || null };
  }

  /**
   * Delete a document (chunks cascade automatically via FK).
   */
  async function deleteDocument(docId) {
    if (!supabase) return { data: null, error: null };
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", docId);
    return { data: null, error: error?.message || null };
  }

  // ── Chunks ────────────────────────────────────────────────────────────────

  /**
   * Bulk-insert the chunk array produced by RagEngine.chunkText().
   * Existing chunks for the document are deleted first to stay idempotent.
   */
  async function saveChunks(documentId, projectId, chunks) {
    if (!supabase) return { data: null, error: null };

    // Clear old chunks in case this is a re-process
    await supabase.from("chunks").delete().eq("document_id", documentId);

    if (!chunks.length) return { data: null, error: null };

    const rows = chunks.map((chunk) => {
      const row = {
        document_id:  documentId,
        project_id:   projectId,
        source:       chunk.source,
        chunk_number: chunk.chunkNumber,
        content:      chunk.content,
        tokens:       chunk.tokens
      };
      if (chunk.embedding) {
        row.embedding = chunk.embedding;
      }
      return row;
    });

    // Supabase has a default max payload of ~1 MB.  Batch in groups of 200.
    const BATCH = 200;
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error } = await supabase.from("chunks").insert(rows.slice(i, i + BATCH));
      if (error) return { data: null, error: error.message };
    }
    return { data: null, error: null };
  }

  /**
   * Fetch all chunks for a project (used to rebuild the in-memory RAG index).
   */
  async function getChunks(projectId) {
    if (!supabase) return { data: [], error: null };
    const { data, error } = await supabase
      .from("chunks")
      .select("id, document_id, source, chunk_number, content, tokens, embedding")
      .eq("project_id", projectId)
      .order("chunk_number", { ascending: true });
    return { data: data || [], error: error?.message || null };
  }

  // ── Conversation Messages ─────────────────────────────────────────────────

  /**
   * Fetch the full conversation history for a project, ordered chronologically.
   */
  async function getMessages(projectId) {
    if (!supabase) return { data: [], error: null };
    const { data, error } = await supabase
      .from("conversation_messages")
      .select("id, role, text, citations, context, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    return { data: data || [], error: error?.message || null };
  }

  /**
   * Append a single message to the conversation.
   * role: "user" | "ai"
   */
  async function addMessage(projectId, userId, role, text, citations = [], context = "") {
    if (!supabase) {
      return {
        data: { id: crypto.randomUUID(), project_id: projectId, role, text, citations, context, created_at: new Date().toISOString() },
        error: null
      };
    }
    const { data, error } = await supabase
      .from("conversation_messages")
      .insert({ project_id: projectId, user_id: userId, role, text, citations, context })
      .select()
      .single();
    return { data, error: error?.message || null };
  }

  /**
   * Delete all messages in a project (clear conversation).
   */
  async function clearMessages(projectId) {
    if (!supabase) return { data: null, error: null };
    const { error } = await supabase
      .from("conversation_messages")
      .delete()
      .eq("project_id", projectId);
    return { data: null, error: error?.message || null };
  }

  // ── Seed helper ───────────────────────────────────────────────────────────

  /**
   * Seed the database with the built-in demo projects for a freshly
   * signed-up user.  Should be called once after account creation.
   *
   * @param {string} userId  - Supabase auth user id
   * @param {Array}  projects - The seedState.projects array from app.js
   */
  async function seedUserData(userId, projects) {
    if (!supabase) return;

    for (const project of projects) {
      // Create project
      const { data: projectRow, error: pErr } = await supabase
        .from("projects")
        .insert({ id: project.id, user_id: userId, name: project.name, created_at: project.createdAt })
        .select()
        .single();

      if (pErr) { console.error("[InventiveDB] Seed project error:", pErr); continue; }

      for (const doc of project.documents) {
        // Create document
        const { data: docRow, error: dErr } = await supabase
          .from("documents")
          .insert({
            id:             doc.id,
            project_id:     projectRow.id,
            user_id:        userId,
            name:           doc.name,
            type:           doc.type,
            status:         doc.status,
            extracted_text: doc.extractedText,
            chunk_count:    doc.chunkCount,
            uploaded_at:    doc.uploadedAt
          })
          .select()
          .single();

        if (dErr) { console.error("[InventiveDB] Seed document error:", dErr); continue; }

        // Save chunks
        if (doc.chunks?.length) {
          await saveChunks(docRow.id, projectRow.id, doc.chunks);
        }
      }

      // Seed conversation messages
      for (const message of (project.conversation || [])) {
        await supabase.from("conversation_messages").insert({
          project_id: projectRow.id,
          user_id:    userId,
          role:       message.role,
          text:       message.text,
          citations:  message.citations || [],
          context:    message.context   || ""
        });
      }
    }
    console.info("[InventiveDB] Demo data seeded for user:", userId);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.InventiveDB = {
    // Setup
    init,
    get isConfigured() { return isConfigured; },
    // Auth
    signUp,
    signIn,
    signOut,
    getUser,
    onAuthStateChange,
    // Projects
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    // Documents
    getDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    // Chunks
    saveChunks,
    getChunks,
    // Messages
    getMessages,
    addMessage,
    clearMessages,
    // Seed
    seedUserData
  };

  // Auto-initialize when the script loads
  init();
})();
