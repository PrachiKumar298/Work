const icons = {
  home: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>',
  logOut: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  plus: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  search: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  trash: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 16H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
  file: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  send: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
  close: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  arrowLeft: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>',
  settings: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  edit: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>',
  flag: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
  externalLink: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="m15 3 6 6m0-6v6m0-6H15"/></svg>'
};

const storageKey = "inventive-rag-ui";

const sampleDocumentText = {
  "employee-handbook.pdf":
    "Employee access must follow least privilege. Contractors and vendors receive only the systems needed for approved work. Access requests require manager approval and a named internal owner. Access is reviewed every quarter and removed immediately when the engagement ends.",
  "security-controls.docx":
    "Vendor access controls require time-bound approvals, multi-factor authentication, named ownership, and least-privilege permissions. High-risk vendors must provide evidence of security controls before production access. Privileged access is logged and reviewed monthly.",
  "vendor-risk-notes.txt":
    "Vendor identities are scoped to approved systems. Access expires automatically after the approved window. High-risk vendors require owner approval, control evidence, and quarterly recertification. Any unused access should be disabled during access reviews.",
  "q2-market-review.pdf":
    "The Q2 market review shows increased demand for knowledge automation, faster customer onboarding, and better evidence tracking. Buyers prioritize accuracy, citations, fast setup, and searchable documentation across teams.",
  "customer-interviews.docx":
    "Customer interviews repeatedly mention onboarding friction, fragmented documents, and slow support answers. The most requested product improvements are clearer citations, searchable playbooks, and faster response drafting.",
  "tier-one-macros.txt":
    "Tier one support macros should answer common setup, billing, and access questions. Each macro should include a short resolution, escalation criteria, and links to the source playbook. Complex account issues should be escalated to tier two."
};

function buildSeedDocument(id, name, status, uploadedAt) {
  const text = sampleDocumentText[name] || "";
  const chunks = status === "processed" && window.RagEngine ? window.RagEngine.chunkText(text, name) : [];
  return {
    id,
    name,
    type: name.split(".").pop().toUpperCase(),
    status,
    uploadedAt,
    extractedText: text,
    chunks,
    chunkCount: chunks.length
  };
}

const seedState = {
  user: null,
  authMode: "login",
  route: { name: "auth" },
  modal: null,
  errors: {},
  search: "",
  sort: "created-desc",
  settings: {
    ragMode: "local",
    vectorDb: "local",
    geminiApiKey: "",
    pineconeApiKey: "",
    pineconeIndexHost: "",
    geminiModel: "gemini-2.5-flash",
    supabaseUrl: "",
    supabaseAnonKey: ""
  },
  settingsTab: "mode",
  settingsTestStatus: null,
  isQuerying: false,
  projects: [
    {
      id: "project-1",
      name: "Policy Knowledge Base",
      createdAt: "2026-05-17T10:15:00.000Z",
      documents: [
        buildSeedDocument("doc-1", "employee-handbook.pdf", "processed", "2026-05-17T10:30:00.000Z"),
        buildSeedDocument("doc-2", "security-controls.docx", "processed", "2026-05-18T08:10:00.000Z"),
        buildSeedDocument("doc-3", "vendor-risk-notes.txt", "processed", "2026-05-20T12:42:00.000Z")
      ],
      conversation: [
        {
          role: "user",
          text: "What access controls are required for vendors?"
        },
        {
          role: "ai",
          text: "Vendors should receive least-privilege access, time-bound approvals, and quarterly reviews. High-risk vendors also need a named owner and evidence of security controls before production access is granted.",
          citations: ["security-controls.docx p. 4", "vendor-risk-notes.txt"],
          context: "Retrieved context: vendor identities are scoped to approved systems, access expires automatically, and high-risk vendors require owner approval plus control evidence."
        }
      ]
    },
    {
      id: "project-2",
      name: "Product Research",
      createdAt: "2026-05-23T16:05:00.000Z",
      documents: [
        buildSeedDocument("doc-4", "q2-market-review.pdf", "processed", "2026-05-23T16:20:00.000Z"),
        buildSeedDocument("doc-5", "customer-interviews.docx", "processed", "2026-05-24T09:12:00.000Z")
      ],
      conversation: []
    },
    {
      id: "project-3",
      name: "Support Playbooks",
      createdAt: "2026-06-01T11:35:00.000Z",
      documents: [
        buildSeedDocument("doc-6", "tier-one-macros.txt", "processed", "2026-06-01T11:40:00.000Z")
      ],
      conversation: []
    }
  ]
};

let state = loadState();
window.state = state;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved ? migrateState({ ...seedState, ...saved, errors: {}, modal: null, settingsTestStatus: null, isQuerying: false }) : structuredClone(seedState);
  } catch {
    return structuredClone(seedState);
  }
}

function migrateState(nextState) {
  if (!nextState.settings) {
    nextState.settings = structuredClone(seedState.settings);
  }
  return {
    ...nextState,
    projects: nextState.projects.map((project) => ({
      ...project,
      isImportant: !!project.isImportant || !!project.is_important || false,
      documents: (project.documents || []).map((doc) => {
        const sampleText = sampleDocumentText[doc.name];
        if (sampleText && (!doc.chunks || !doc.chunks.length)) {
          const chunks = window.RagEngine.chunkText(sampleText, doc.name);
          return {
            ...doc,
            status: "processed",
            extractedText: sampleText,
            chunks,
            chunkCount: chunks.length,
            extractionError: ""
          };
        }
        if (doc.status === "processed" && (!doc.chunks || !doc.chunks.length)) {
          return {
            ...doc,
            status: "pending",
            chunkCount: 0,
            extractionError: "Upload this file again to build its retrieval index."
          };
        }
        return {
          ...doc,
          chunks: doc.chunks || [],
          chunkCount: doc.chunkCount || doc.chunks?.length || 0
        };
      })
    }))
  };
}

function saveState() {
  const persistable = {
    user: state.user,
    route: state.route,
    search: state.search,
    sort: state.sort,
    projects: state.projects,
    settings: state.settings
  };
  localStorage.setItem(storageKey, JSON.stringify(persistable));
}

// ── DB helpers ────────────────────────────────────────────────────────────────
// Load all projects + their documents + chunks + messages from Supabase
// and merge into state.  Called once after login.
async function loadUserDataFromDB(userId) {
  const { data: projects, error: pErr } = await window.InventiveDB.getProjects(userId);
  if (pErr) { console.error("[DB] getProjects:", pErr); return; }

  const hydratedProjects = await Promise.all(
    projects.map(async (row) => {
      const projectId = row.id;

      const { data: docs } = await window.InventiveDB.getDocuments(projectId);
      const { data: allChunks } = await window.InventiveDB.getChunks(projectId);
      const { data: messages } = await window.InventiveDB.getMessages(projectId);

      // Map DB column names → app field names
      const documents = (docs || []).map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        status: d.status,
        uploadedAt: d.uploaded_at,
        extractedText: d.extracted_text || "",
        extractionError: d.extraction_error || "",
        chunkCount: d.chunk_count || 0,
        chunks: (allChunks || [])
          .filter((c) => c.document_id === d.id)
          .map((c) => ({
            id: c.id,
            source: c.source,
            chunkNumber: c.chunk_number,
            content: c.content,
            tokens: c.tokens || []
          }))
      }));

      const conversation = (messages || []).map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        citations: m.citations || [],
        context: m.context || ""
      }));

      return {
        id: projectId,
        name: row.name,
        createdAt: row.created_at,
        isImportant: !!row.is_important,
        documents,
        conversation
      };
    })
  );

  setState({ projects: hydratedProjects });
}

function setState(next) {
  state = { ...state, ...next };
  window.state = state;
  saveState();
  render();
}

function navigate(route) {
  setState({ route, errors: {}, modal: null });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function getProject(projectId) {
  return state.projects.find((project) => project.id === projectId);
}

function passwordChecks(password) {
  return {
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    alphanumeric: /[A-Za-z]/.test(password) && /\d/.test(password)
  };
}

function isPasswordValid(password) {
  return Object.values(passwordChecks(password)).every(Boolean);
}

function render() {
  const activeElementId = document.activeElement ? document.activeElement.id : null;
  const selectionStart = document.activeElement ? document.activeElement.selectionStart : null;
  const selectionEnd = document.activeElement ? document.activeElement.selectionEnd : null;

  const app = document.querySelector("#app");
  const routeName = state.user ? state.route.name : "auth";
  if (routeName === "auth") {
    app.innerHTML = renderAuth();
  } else {
    app.innerHTML = `
      <div class="app-shell">
        ${renderHeader()}
        ${routeName === "project" ? renderProjectPage() : renderDashboard()}
        ${state.modal === "new-project" ? renderNewProjectModal() : ""}
        ${state.modal === "rename-project" ? renderRenameProjectModal() : ""}
        ${state.modal === "settings" ? renderSettingsModal() : ""}
      </div>
    `;
  }
  bindEvents();

  if (activeElementId) {
    const el = document.getElementById(activeElementId);
    if (el) {
      el.focus();
      if (typeof el.setSelectionRange === "function" && selectionStart !== null && selectionEnd !== null) {
        try {
          el.setSelectionRange(selectionStart, selectionEnd);
        } catch (e) {
          // ignore
        }
      }
    }
  }
}

function renderHeader() {
  return `
    <header class="header">
      <div class="brand" aria-label="Inventive brand"><span class="brand-mark"></span><span>Inventive</span></div>
      <div class="header-actions">
        <button class="secondary-button" data-action="open-settings" style="margin-right: 8px;">${icons.settings} Settings</button>
        <button class="danger-button" data-action="logout" title="Log out">${icons.logOut} Logout</button>
      </div>
    </header>
  `;
}

function renderAuth() {
  const mode = state.authMode;
  const err = state.errors.auth;
  return `
    <main class="auth-layout">
      <section class="auth-panel">
        <div class="brand"><span class="brand-mark"></span><span>Inventive</span></div>
        <div class="auth-statement">
          <h1>Search your knowledge. Cite every answer.</h1>
          <p>A clean RAG workspace for organizing document collections, asking precise questions, and tracing responses back to their source material.</p>
          <div class="auth-accent"></div>
        </div>
      </section>
      <section class="auth-card-wrap">
        <div class="auth-card">
          <div class="auth-tabs" role="tablist" aria-label="Authentication">
            <button class="auth-tab ${mode === "login" ? "active" : ""}" data-action="auth-mode" data-mode="login" type="button">Login</button>
            <button class="auth-tab ${mode === "signup" ? "active" : ""}" data-action="auth-mode" data-mode="signup" type="button">Sign up</button>
          </div>
          <h2 class="form-title">${mode === "login" ? "Welcome back" : "Create account"}</h2>
          <p class="form-subtitle">${mode === "login" ? "Use your email and password to enter the workspace." : "Set up access for a new document workspace."}</p>
          ${err ? `<div class="error-box">${escapeHtml(err)}</div>` : ""}
          <form class="form-grid" data-form="${mode}">
            ${mode === "signup" ? `
              <div class="field">
                <label for="username">Username</label>
                <input id="username" name="username" autocomplete="username" required />
              </div>
            ` : ""}
            <div class="field">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" autocomplete="email" required />
            </div>
            <div class="field">
              <label for="password">Password</label>
              <input id="password" name="password" type="password" autocomplete="${mode === "login" ? "current-password" : "new-password"}" required />
            </div>
            ${mode === "signup" ? `
              <div class="field">
                <label for="confirmPassword">Confirm password</label>
                <input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" required />
              </div>
              ${renderPasswordRules("")}
            ` : ""}
            <button class="primary-button" type="submit">${mode === "login" ? "Login" : "Create account"}</button>
          </form>
        </div>
      </section>
    </main>
  `;
}

function renderPasswordRules(password) {
  const checks = passwordChecks(password);
  return `
    <ul class="password-rules" aria-label="Password constraints">
      <li class="${checks.upper ? "pass" : ""}" data-rule="upper">Uppercase</li>
      <li class="${checks.lower ? "pass" : ""}" data-rule="lower">Lowercase</li>
      <li class="${checks.special ? "pass" : ""}" data-rule="special">Special character</li>
      <li class="${checks.alphanumeric ? "pass" : ""}" data-rule="alphanumeric">Letters and numbers</li>
    </ul>
  `;
}

function renderDashboard() {
  const projects = filteredProjects();
  return `
    <main class="page">
      <div class="section-head">
        <div>
          <p class="eyebrow">Home</p>
          <h1>Projects</h1>
          <p>Manage document collections, track ingestion status, and open a project to ask cited questions.</p>
        </div>
        <button class="primary-button" data-action="open-new-project">${icons.plus} New project</button>
      </div>
      <section class="toolbar" aria-label="Project controls">
        <div class="field">
          <label for="projectSearch">Search projects</label>
          <div class="search-input-wrapper">
            ${icons.search}
            <input id="projectSearch" value="${escapeHtml(state.search)}" placeholder="Find by project name" />
          </div>
        </div>
        <div class="field">
          <label for="projectSort">Sort by</label>
          <select id="projectSort">
            <option value="created-desc" ${state.sort === "created-desc" ? "selected" : ""}>Newest first</option>
            <option value="name-asc" ${state.sort === "name-asc" ? "selected" : ""}>Name A to Z</option>
            <option value="docs-desc" ${state.sort === "docs-desc" ? "selected" : ""}>Most documents</option>
            <option value="flagged-only" ${state.sort === "flagged-only" ? "selected" : ""}>Important only</option>
          </select>
        </div>
      </section>
      ${projects.length ? `
        <section class="project-grid" aria-label="Project list">
          ${projects.map(renderProjectCard).join("")}
        </section>
      ` : `
        <section class="empty-state">
          <div>
            <h2>No projects found</h2>
            <p>Adjust the search or create a new project.</p>
          </div>
        </section>
      `}
    </main>
  `;
}

function filteredProjects() {
  const needle = state.search.trim().toLowerCase();
  let list = state.projects.filter((project) => project.name.toLowerCase().includes(needle));
  if (state.sort === "flagged-only") {
    list = list.filter((project) => project.isImportant || project.is_important);
  }
  return list.sort((a, b) => {
    if (state.sort === "name-asc") return a.name.localeCompare(b.name);
    if (state.sort === "docs-desc") return b.documents.length - a.documents.length;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function renderProjectCard(project) {
  return `
    <div class="project-card" data-project-id="${project.id}">
      <button class="project-card-body" data-action="open-project" data-project-id="${project.id}">
        <span>
          <h2>${escapeHtml(project.name)}</h2>
          <p>Created ${formatDate(project.createdAt)}</p>
        </span>
        <span class="card-meta">
          <span>${project.documents.filter((doc) => doc.status === "processed").length} processed</span>
          <span class="count-pill">${project.documents.length} docs</span>
        </span>
      </button>
      <div class="project-card-actions">
        <button class="action-btn flag-btn ${project.isImportant ? "flagged" : ""}" data-action="toggle-flag" data-project-id="${project.id}" title="Mark as important">
          ${icons.flag}
        </button>
        <button class="action-btn rename-btn" data-action="rename-project" data-project-id="${project.id}" title="Rename project">
          ${icons.edit}
        </button>
        <button class="action-btn delete-btn" data-action="delete-project" data-project-id="${project.id}" title="Delete project">
          ${icons.trash}
        </button>
      </div>
    </div>
  `;
}

function renderNewProjectModal() {
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="newProjectTitle">
        <div class="modal-head">
          <div>
            <h2 id="newProjectTitle">New project</h2>
            <p>Create a workspace for a related set of documents.</p>
          </div>
          <button class="icon-button" data-action="close-modal" title="Close">${icons.close}</button>
        </div>
        <form class="form-grid" data-form="new-project">
          <div class="field">
            <label for="projectName">Project name</label>
            <input id="projectName" name="projectName" required placeholder="e.g. Contract Library" />
          </div>
          ${state.errors.project ? `<div class="error-box">${escapeHtml(state.errors.project)}</div>` : ""}
          <div class="modal-actions">
            <button class="secondary-button" data-action="close-modal" type="button">Cancel</button>
            <button class="primary-button" type="submit">${icons.plus} Create project</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function renderRenameProjectModal() {
  const project = getProject(state.renameProjectId);
  if (!project) return "";
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="renameProjectTitle">
        <div class="modal-head">
          <div>
            <h2 id="renameProjectTitle">Rename project</h2>
            <p>Choose a new name for your document collection.</p>
          </div>
          <button class="icon-button" data-action="close-modal" title="Close">${icons.close}</button>
        </div>
        <form class="form-grid" data-form="rename-project">
          <div class="field">
            <label for="renameProjectName">Project name</label>
            <input id="renameProjectName" name="name" value="${escapeHtml(project.name)}" required placeholder="e.g. Sales Playbook" />
          </div>
          ${state.errors.rename ? `<div class="error-box">${escapeHtml(state.errors.rename)}</div>` : ""}
          <div class="modal-actions">
            <button class="secondary-button" data-action="close-modal" type="button">Cancel</button>
            <button class="primary-button" type="submit">${icons.edit} Save</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

async function runConnectionTest() {
  setState({ settingsTestStatus: { running: true } });
  
  const geminiApiKeyInput = document.querySelector("#geminiApiKey");
  const pineconeApiKeyInput = document.querySelector("#pineconeApiKey");
  const pineconeIndexHostInput = document.querySelector("#pineconeIndexHost");
  
  const testSettings = {
    ...state.settings,
    geminiApiKey: geminiApiKeyInput ? geminiApiKeyInput.value.trim() : state.settings.geminiApiKey,
    pineconeApiKey: pineconeApiKeyInput ? pineconeApiKeyInput.value.trim() : state.settings.pineconeApiKey,
    pineconeIndexHost: pineconeIndexHostInput ? pineconeIndexHostInput.value.trim() : state.settings.pineconeIndexHost
  };
  
  const results = await window.RagEngine.testCredentials(testSettings);
  setState({
    settingsTestStatus: {
      running: false,
      gemini: results.gemini,
      pinecone: results.pinecone,
      geminiErr: results.geminiErr,
      pineconeErr: results.pineconeErr
    }
  });
}

function renderSettingsModal() {
  const settings = state.settings;
  const activeTab = state.settingsTab || "mode";
  const testStatus = state.settingsTestStatus;

  let testStatusHtml = "";
  if (testStatus) {
    if (testStatus.running) {
      testStatusHtml = `<div class="test-status-box info"><span class="spinner inline"></span> Testing API connectivity...</div>`;
    } else {
      const geminiStatus = settings.ragMode === "gemini" 
        ? (testStatus.gemini ? `<span class="badge success">Gemini: OK</span>` : `<span class="badge error" title="${escapeHtml(testStatus.geminiErr)}">Gemini: Failed</span>`) 
        : "";
      const pineconeStatus = settings.vectorDb === "pinecone" 
        ? (testStatus.pinecone ? `<span class="badge success">Pinecone: OK</span>` : `<span class="badge error" title="${escapeHtml(testStatus.pineconeErr)}">Pinecone: Failed</span>`) 
        : "";
      testStatusHtml = `
        <div class="test-results">
          ${geminiStatus}
          ${pineconeStatus}
          ${testStatus.geminiErr ? `<p class="error-msg"><small>Gemini: ${escapeHtml(testStatus.geminiErr)}</small></p>` : ""}
          ${testStatus.pineconeErr ? `<p class="error-msg"><small>Pinecone: ${escapeHtml(testStatus.pineconeErr)}</small></p>` : ""}
        </div>
      `;
    }
  }

  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
        <div class="modal-head">
          <div>
            <h2 id="settingsTitle">RAG Configurations</h2>
            <p>Select your RAG engine, storage option, and configure API credentials.</p>
          </div>
          <button class="icon-button" data-action="close-modal" title="Close">${icons.close}</button>
        </div>
        
        <div class="settings-tabs" role="tablist" aria-label="Settings categories">
          <button class="settings-tab ${activeTab === "mode" ? "active" : ""}" data-action="set-settings-tab" data-tab="mode" type="button">1. Engine & Database</button>
          <button class="settings-tab ${activeTab === "credentials" ? "active" : ""}" data-action="set-settings-tab" data-tab="credentials" type="button">2. API Credentials</button>
        </div>

        <form class="form-grid settings-form" data-form="settings-save">
          
          ${activeTab === "mode" ? `
            <div class="settings-section">
              <label class="section-label">RAG answering engine</label>
              <div class="radio-cards">
                <label class="radio-card ${settings.ragMode === "local" ? "selected" : ""}">
                  <input type="radio" name="ragMode" value="local" ${settings.ragMode === "local" ? "checked" : ""} />
                  <span class="card-title">Local TF-IDF (No API Keys)</span>
                  <span class="card-desc">Runs 100% locally in your browser. Extracts direct sentences from documents. Basic accuracy.</span>
                </label>
                <label class="radio-card ${settings.ragMode === "gemini" ? "selected" : ""}">
                  <input type="radio" name="ragMode" value="gemini" ${settings.ragMode === "gemini" ? "checked" : ""} />
                  <span class="card-title">Gemini AI Engine</span>
                  <span class="card-desc">Uses Gemini <b>text-embedding-004</b> for search and generative LLM models to write professional, cited answers.</span>
                </label>
              </div>
            </div>

            <div class="settings-section ${settings.ragMode === "gemini" ? "" : "disabled"}">
              <label class="section-label">Generative model</label>
              <select name="geminiModel" ${settings.ragMode === "gemini" ? "" : "disabled"}>
                <option value="gemini-2.5-flash" ${settings.geminiModel === "gemini-2.5-flash" ? "selected" : ""}>Gemini 2.5 Flash (Recommended - Fastest)</option>
                <option value="gemini-1.5-flash" ${settings.geminiModel === "gemini-1.5-flash" ? "selected" : ""}>Gemini 1.5 Flash</option>
                <option value="gemini-2.5-pro" ${settings.geminiModel === "gemini-2.5-pro" ? "selected" : ""}>Gemini 2.5 Pro (Most Powerful)</option>
              </select>
            </div>

            <div class="settings-section ${settings.ragMode === "gemini" ? "" : "disabled"}">
              <label class="section-label">Vector storage / search database</label>
              <div class="radio-cards">
                <label class="radio-card ${settings.vectorDb === "local" ? "selected" : ""} ${settings.ragMode === "gemini" ? "" : "disabled"}">
                  <input type="radio" name="vectorDb" value="local" ${settings.vectorDb === "local" ? "checked" : ""} ${settings.ragMode === "gemini" ? "" : "disabled"} />
                  <span class="card-title">In-Memory Semantic Search</span>
                  <span class="card-desc">Stores Gemini embeddings in local state / Supabase. Calculates cosine similarity instantly in the browser. (No DB signup needed).</span>
                </label>
                <label class="radio-card ${settings.vectorDb === "pinecone" ? "selected" : ""} ${settings.ragMode === "gemini" ? "" : "disabled"}">
                  <input type="radio" name="vectorDb" value="pinecone" ${settings.vectorDb === "pinecone" ? "checked" : ""} ${settings.ragMode === "gemini" ? "" : "disabled"} />
                  <span class="card-title">Pinecone Vector Database</span>
                  <span class="card-desc">Saves and queries embeddings in your Pinecone index. Ideal for large scaling documents.</span>
                </label>
              </div>
            </div>
          ` : `
            <div class="settings-section">
              <div class="field">
                <label for="geminiApiKey">Gemini API Key</label>
                <input id="geminiApiKey" name="geminiApiKey" type="password" value="${escapeHtml(settings.geminiApiKey)}" placeholder="AIzaSy..." />
                <span class="field-help">Get your API key from the <a href="https://aistudio.google.com/" target="_blank" rel="noopener">Google AI Studio ${icons.externalLink}</a>.</span>
              </div>
            </div>

            <div class="settings-section ${settings.vectorDb === "pinecone" && settings.ragMode === "gemini" ? "" : "disabled-fields"}">
              <div class="field">
                <label for="pineconeApiKey">Pinecone API Key</label>
                <input id="pineconeApiKey" name="pineconeApiKey" type="password" value="${escapeHtml(settings.pineconeApiKey)}" placeholder="pcsk_..." ${settings.vectorDb === "pinecone" && settings.ragMode === "gemini" ? "" : "disabled"} />
              </div>
              <div class="field" style="margin-top: 10px;">
                <label for="pineconeIndexHost">Pinecone Index Host</label>
                <input id="pineconeIndexHost" name="pineconeIndexHost" type="text" value="${escapeHtml(settings.pineconeIndexHost)}" placeholder="https://your-index-xxxx.svc.pinecone.io" ${settings.vectorDb === "pinecone" && settings.ragMode === "gemini" ? "" : "disabled"} />
                <span class="field-help">Must be created with <b>768 dimensions</b> (matching Google embeddings).</span>
              </div>
            </div>

            <div class="settings-section">
              <div class="field">
                <label for="supabaseUrl">Supabase URL</label>
                <input id="supabaseUrl" name="supabaseUrl" type="text" value="${escapeHtml(settings.supabaseUrl || "")}" placeholder="https://your-project.supabase.co" />
              </div>
              <div class="field" style="margin-top: 10px;">
                <label for="supabaseAnonKey">Supabase Anon Key</label>
                <input id="supabaseAnonKey" name="supabaseAnonKey" type="password" value="${escapeHtml(settings.supabaseAnonKey || "")}" placeholder="eyJhbG..." />
                <span class="field-help">Find these in your Supabase Dashboard under Project Settings &rarr; API.</span>
              </div>
            </div>
          `}
          
          ${state.errors.settings ? `<div class="error-box">${escapeHtml(state.errors.settings)}</div>` : ""}
          ${testStatusHtml}

          <div class="modal-actions settings-actions">
            ${settings.ragMode === "gemini" ? `
              <button class="secondary-button" type="button" data-action="test-connection">Test Connection</button>
            ` : ""}
            <div style="flex-grow: 1;"></div>
            <button class="secondary-button" data-action="close-modal" type="button">Cancel</button>
            <button class="primary-button" type="submit">Save settings</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function renderProjectPage() {
  const project = getProject(state.route.projectId) || state.projects[0];
  if (!project) return renderDashboard();
  return `
    <main class="page">
      <div class="back-row">
        <button class="secondary-button" data-action="home">${icons.arrowLeft} Dashboard</button>
      </div>
      <section class="project-title">
        <p class="eyebrow">Project query</p>
        <h1>${escapeHtml(project.name)}</h1>
        <p>${project.documents.length} uploaded documents. The local RAG engine indexes processed sources for retrieval and citation.</p>
      </section>
      <section class="project-layout">
        <div class="panel">
          <div class="panel-head">
            <h2>Documents</h2>
            <p>Upload PDF, DOCX, or TXT files to extract text, create chunks, and build the retrieval index.</p>
          </div>
          <div class="panel-body">
            <div class="upload-zone">
              <input class="file-input-hidden" id="documentUpload-${project.id}" data-project-id="${project.id}" name="documents" type="file" accept=".pdf,.docx,.txt" multiple />
              <label class="secondary-button upload-button" for="documentUpload-${project.id}">${icons.plus} Add to project</label>
              ${state.errors.upload ? `<div class="error-box">${escapeHtml(state.errors.upload)}</div>` : ""}
            </div>
          </div>
          <div class="table-wrap">
            <table aria-label="Uploaded documents">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                ${project.documents.length ? project.documents.map((doc) => renderDocumentRow(project.id, doc)).join("") : `
                  <tr><td colspan="4">No documents uploaded yet.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
        <div class="query-stack">
          <div class="panel">
            <div class="panel-head">
              <h2>Ask a question</h2>
              <p>Responses include retrieved citations and expandable context.</p>
            </div>
            <div class="panel-body">
              <form class="form-grid" data-form="query" data-project-id="${project.id}">
                <div class="field">
                  <label for="queryText">Question</label>
                  <textarea id="queryText" name="queryText" placeholder="Ask about the uploaded documents"></textarea>
                </div>
                <div class="query-actions">
                  <span></span>
                  <button class="primary-button" type="submit">${icons.send} Ask</button>
                </div>
                ${state.errors.query ? `<div class="error-box">${escapeHtml(state.errors.query)}</div>` : ""}
              </form>
            </div>
          </div>
          <section class="conversation" aria-label="Conversation">
            ${project.conversation.length ? renderConversationTurns(project) : `
              ${state.isQuerying ? `
                <article class="message ai loading-skeleton" aria-live="polite">
                  <div class="message-role"><span>AI is thinking...</span></div>
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line short"></div>
                </article>
              ` : `
                <div class="empty-state">
                  <div>
                    <h2>No questions yet</h2>
                    <p>Ask a question to generate a sourced answer.</p>
                  </div>
                </div>
              `}
            `}
          </section>
        </div>
      </section>
    </main>
  `;
}

function renderDocumentRow(projectId, doc) {
  return `
    <tr>
      <td>
        <span class="doc-name">
          ${icons.file}
          <span>
            <span title="${escapeHtml(doc.name)}">${escapeHtml(doc.name)}</span>
            <small class="doc-detail">${doc.status === "processed" ? `${doc.chunkCount || 0} indexed chunks` : escapeHtml(doc.extractionError || "Waiting for processing")}</small>
          </span>
        </span>
      </td>
      <td><span class="status-pill ${doc.status}">${doc.status}</span></td>
      <td>${formatDate(doc.uploadedAt)}</td>
      <td><button class="icon-button" data-action="delete-doc" data-project-id="${projectId}" data-doc-id="${doc.id}" title="Delete document">${icons.trash}</button></td>
    </tr>
  `;
}

function renderMessage(message, project) {
  if (message.role === "user") {
    return `
      <article class="message user">
        <div class="message-role"><span>User query</span></div>
        <p>${escapeHtml(message.text)}</p>
      </article>
    `;
  }
  const citations = message.citations || [];
  return `
    <article class="message ai">
      <div class="message-role"><span>AI answer</span></div>
      <p>${escapeHtml(message.text)}</p>
      <div class="citations">
        ${citations.map((citation) => `<span class="citation-pill">${escapeHtml(citation)}</span>`).join("")}
      </div>
      <details class="context-box">
        <summary>Retrieved context</summary>
        <p>${escapeHtml(message.context || buildContext(project))}</p>
      </details>
    </article>
  `;
}

function renderConversationTurns(project) {
  const turns = [];
  let currentTurn = null;
  project.conversation.forEach((msg) => {
    if (msg.role === "user") {
      if (currentTurn) {
        turns.push(currentTurn);
      }
      currentTurn = { user: msg, ai: null };
    } else if (msg.role === "ai") {
      if (currentTurn) {
        currentTurn.ai = msg;
      } else {
        turns.push({ user: null, ai: msg });
      }
    }
  });
  if (currentTurn) {
    turns.push(currentTurn);
  }

  const reversed = [...turns].reverse();
  return reversed.map((turn, index) => {
    let html = "";
    if (turn.user) {
      html += renderMessage(turn.user, project);
    }
    if (turn.ai) {
      html += renderMessage(turn.ai, project);
    } else if (index === 0 && state.isQuerying) {
      html += `
        <article class="message ai loading-skeleton" aria-live="polite">
          <div class="message-role"><span>AI is thinking...</span></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </article>
      `;
    }
    return html;
  }).join("");
}

function fallbackCitations(project) {
  const processedDocs = project.documents.filter((doc) => doc.status === "processed").slice(0, 2);
  return processedDocs.length ? processedDocs.map((doc) => doc.name) : ["No processed source available"];
}

function buildContext(project) {
  const processed = project.documents.filter((doc) => doc.status === "processed");
  if (!processed.length) return "No processed documents are available for retrieval yet.";
  return `Indexed sources: ${processed.map((doc) => `${doc.name} (${doc.chunkCount || 0} chunks)`).join(", ")}.`;
}

function bindEvents() {
  document.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", handleAction);
  });
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", handleSubmit);
  });

  const projectSearch = document.querySelector("#projectSearch");
  if (projectSearch) {
    projectSearch.addEventListener("input", (event) => setState({ search: event.target.value }));
  }

  const projectSort = document.querySelector("#projectSort");
  if (projectSort) {
    projectSort.addEventListener("change", (event) => setState({ sort: event.target.value }));
  }

  document.querySelectorAll(".file-input-hidden").forEach((input) => {
    input.addEventListener("change", (event) => {
      uploadDocuments(event.target.dataset.projectId, Array.from(event.target.files || []));
    });
  });

  const password = document.querySelector("#password");
  if (password && state.authMode === "signup") {
    password.addEventListener("input", (event) => {
      const rules = document.querySelector(".password-rules");
      rules.outerHTML = renderPasswordRules(event.target.value);
    });
  }

  const backdrop = document.querySelector(".modal-backdrop");
  if (backdrop) {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) setState({ modal: null, errors: {}, settingsTestStatus: null });
    });
  }

  const settingsForm = document.querySelector(".settings-form");
  if (settingsForm) {
    settingsForm.querySelectorAll("input, select").forEach(input => {
      input.addEventListener("change", (e) => {
        const name = e.target.name;
        const value = e.target.value;
        const newSettings = { ...state.settings, [name]: value };
        if (name === "ragMode" && value === "local") {
          newSettings.vectorDb = "local";
        }
        setState({ settings: newSettings });
      });
    });
  }
}

async function handleAction(event) {
  const target = event.currentTarget;
  const action = target.dataset.action;
  if (action === "auth-mode") {
    setState({ authMode: target.dataset.mode, errors: {} });
  }
  if (action === "home") {
    navigate({ name: "dashboard" });
  }
  if (action === "logout") {
    await window.InventiveDB.signOut();
    const isOnline = window.InventiveDB.isConfigured;
    setState({
      user: null,
      route: { name: "auth" },
      authMode: "login",
      errors: {},
      projects: isOnline ? structuredClone(seedState.projects) : state.projects
    });
  }
  if (action === "open-new-project") {
    setState({ modal: "new-project", errors: {} });
  }
  if (action === "open-settings") {
    setState({ modal: "settings", errors: {}, settingsTab: "mode", settingsTestStatus: null });
  }
  if (action === "set-settings-tab") {
    setState({ settingsTab: target.dataset.tab });
  }
  if (action === "test-connection") {
    runConnectionTest();
  }
  if (action === "close-modal") {
    setState({ modal: null, errors: {}, settingsTestStatus: null, renameProjectId: null });
  }
  if (action === "toggle-flag") {
    event.stopPropagation();
    toggleFlag(target.dataset.projectId);
  }
  if (action === "rename-project") {
    event.stopPropagation();
    setState({ modal: "rename-project", renameProjectId: target.dataset.projectId, errors: {} });
  }
  if (action === "delete-project") {
    event.stopPropagation();
    deleteProject(target.dataset.projectId);
  }
  if (action === "open-project") {
    navigate({ name: "project", projectId: target.dataset.projectId });
  }
  if (action === "delete-doc") {
    deleteDocument(target.dataset.projectId, target.dataset.docId);
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const formType = form.dataset.form;

  if (formType === "login") {
    const email = data.get("email")?.trim();
    const password = data.get("password")?.trim();
    if (!email || !password) {
      return setState({ errors: { auth: "Enter both email and password." } });
    }
    setState({ errors: { auth: "Signing in…" } });
    const { data: authData, error } = await window.InventiveDB.signIn(email, password);
    if (error) return setState({ errors: { auth: error } });
    const user = { id: authData.user.id, email: authData.user.email, username: authData.user.user_metadata?.username || email };
    setState({ user, route: { name: "dashboard" }, errors: {} });
    if (window.InventiveDB.isConfigured) {
      await loadUserDataFromDB(user.id);
    }
    return;
  }

  if (formType === "signup") {
    const username = data.get("username")?.trim();
    const email = data.get("email")?.trim();
    const password = data.get("password") || "";
    const confirmPassword = data.get("confirmPassword") || "";
    if (!username || !email || !password || !confirmPassword) {
      return setState({ errors: { auth: "Complete every sign-up field." } });
    }
    if (!isPasswordValid(password)) {
      return setState({ errors: { auth: "Password must include uppercase, lowercase, special character, and letters with numbers." } });
    }
    if (password !== confirmPassword) {
      return setState({ errors: { auth: "Passwords do not match." } });
    }
    setState({ errors: { auth: "Creating account…" } });
    const { data: authData, error } = await window.InventiveDB.signUp(email, password, username);
    if (error) return setState({ errors: { auth: error } });
    const user = { id: authData.user.id, email, username };
    setState({ user, route: { name: "dashboard" }, errors: {} });
    // Seed demo projects for brand-new users
    await window.InventiveDB.seedUserData(user.id, state.projects);
    return;
  }

  if (formType === "new-project") {
    const projectName = data.get("projectName")?.trim();
    if (!projectName) return setState({ errors: { project: "Enter a project name." } });
    const userId = state.user?.id;
    const { data: row, error } = await window.InventiveDB.createProject(userId, projectName);
    if (error) return setState({ errors: { project: error } });
    const project = {
      id: row.id,
      name: row.name,
      createdAt: row.created_at || new Date().toISOString(),
      isImportant: !!row.is_important || false,
      documents: [],
      conversation: []
    };
    return setState({
      projects: [project, ...state.projects],
      route: { name: "project", projectId: project.id },
      modal: null,
      errors: {}
    });
  }

  if (formType === "rename-project") {
    const newName = data.get("name")?.trim();
    if (!newName) return setState({ errors: { rename: "Enter a project name." } });
    
    const projectId = state.renameProjectId;
    if (state.user) {
      const { error } = await window.InventiveDB.updateProject(projectId, { name: newName });
      if (error) return setState({ errors: { rename: error } });
    }
    
    const nextProjects = state.projects.map((p) => {
      if (p.id !== projectId) return p;
      return { ...p, name: newName };
    });
    
    return setState({
      projects: nextProjects,
      modal: null,
      renameProjectId: null,
      errors: {}
    });
  }

  if (formType === "query") {
    return submitQuery(form.dataset.projectId, data.get("queryText")?.trim());
  }

  if (formType === "settings-save") {
    const ragMode = data.get("ragMode");
    const vectorDb = data.get("vectorDb") || "local";
    const geminiModel = data.get("geminiModel") || "gemini-2.5-flash";
    const geminiApiKey = data.get("geminiApiKey")?.trim() || "";
    const pineconeApiKey = data.get("pineconeApiKey")?.trim() || "";
    const pineconeIndexHost = data.get("pineconeIndexHost")?.trim() || "";
    const supabaseUrl = data.get("supabaseUrl")?.trim() || "";
    const supabaseAnonKey = data.get("supabaseAnonKey")?.trim() || "";

    if (ragMode === "gemini" && !geminiApiKey) {
      return setState({ errors: { settings: "Please provide a Gemini API Key to use Gemini mode." } });
    }
    if (ragMode === "gemini" && vectorDb === "pinecone") {
      if (!pineconeApiKey || !pineconeIndexHost) {
        return setState({ errors: { settings: "Please provide both Pinecone API Key and Index Host for Pinecone mode." } });
      }
    }

    const updatedSettings = {
      ragMode,
      vectorDb,
      geminiModel,
      geminiApiKey,
      pineconeApiKey,
      pineconeIndexHost,
      supabaseUrl,
      supabaseAnonKey
    };

    window.InventiveDB.init(supabaseUrl, supabaseAnonKey);

    setState({
      settings: updatedSettings,
      modal: null,
      errors: {},
      settingsTestStatus: null
    });
    return;
  }
}

async function uploadDocuments(projectId, files) {
  const accepted = ["pdf", "docx", "txt"];
  const validFiles = files.filter((file) => file && file.name);
  if (!validFiles.length) return setState({ errors: { upload: "Choose at least one PDF, DOCX, or TXT file." } });

  const invalid = validFiles.find((file) => !accepted.includes(file.name.split(".").pop().toLowerCase()));
  if (invalid) return setState({ errors: { upload: "Only PDF, DOCX, and TXT files are supported." } });

  const userId = state.user?.id;

  // 1. Insert pending rows in DB and get back real IDs
  const pendingDocs = await Promise.all(
    validFiles.map(async (file) => {
      const type = file.name.split(".").pop().toUpperCase();
      const { data: row, error } = await window.InventiveDB.createDocument(projectId, userId, file.name, type);
      if (error) console.error("[DB] createDocument:", error);
      return {
        id: row?.id || crypto.randomUUID(),
        name: file.name,
        type,
        status: "pending",
        uploadedAt: row?.uploaded_at || new Date().toISOString(),
        chunks: [],
        chunkCount: 0,
        extractedText: "",
        extractionError: ""
      };
    })
  );

  // 2. Show pending state immediately
  setState({
    projects: state.projects.map((project) => {
      if (project.id !== projectId) return project;
      return { ...project, documents: [...pendingDocs, ...project.documents] };
    }),
    errors: {}
  });

  // 3. Process each file
  const processedDocs = await Promise.all(
    validFiles.map(async (file, index) => {
      const baseDoc = pendingDocs[index];
      try {
        const processed = await window.RagEngine.processFile(file);
        let chunks = processed.chunks;

        if (state.settings.ragMode === "gemini") {
          try {
            // Update UI status to show vector embedding is running
            setState({
              projects: state.projects.map((project) => {
                if (project.id !== projectId) return project;
                return {
                  ...project,
                  documents: project.documents.map((d) => d.id === baseDoc.id ? { ...d, extractionError: "Generating vector embeddings..." } : d)
                };
              })
            });

            const embeddings = await window.RagEngine.embedChunks(chunks, state.settings.geminiApiKey);
            chunks = chunks.map((chunk, idx) => ({
              ...chunk,
              documentId: baseDoc.id,
              embedding: embeddings[idx]
            }));

            if (state.settings.vectorDb === "pinecone") {
              // Update UI status to show Pinecone syncing
              setState({
                projects: state.projects.map((project) => {
                  if (project.id !== projectId) return project;
                  return {
                    ...project,
                    documents: project.documents.map((d) => d.id === baseDoc.id ? { ...d, extractionError: "Syncing with Pinecone..." } : d)
                  };
                })
              });
              await window.RagEngine.upsertToPinecone(chunks, projectId, state.settings);
            }
          } catch (embedErr) {
            console.error("Vector indexing error:", embedErr);
            throw new Error(`Vector indexing failed: ${embedErr.message}`);
          }
        }

        const finalDoc = {
          ...baseDoc,
          status: "processed",
          extractedText: processed.extractedText,
          chunks: chunks,
          chunkCount: chunks.length
        };
        // 4. Persist processed state + chunks to DB
        await window.InventiveDB.updateDocument(baseDoc.id, {
          status: "processed",
          extracted_text: processed.extractedText,
          chunk_count: chunks.length,
          extraction_error: ""
        });
        await window.InventiveDB.saveChunks(baseDoc.id, projectId, chunks);
        return finalDoc;
      } catch (err) {
        const finalDoc = {
          ...baseDoc,
          status: "failed",
          extractionError: err.message || "Could not extract readable text from this file."
        };
        await window.InventiveDB.updateDocument(baseDoc.id, {
          status: "failed",
          extraction_error: finalDoc.extractionError
        });
        return finalDoc;
      }
    })
  );

  // 5. Merge processed docs back into state
  const nextProjects = state.projects.map((project) => {
    if (project.id !== projectId) return project;
    return {
      ...project,
      documents: project.documents.map((doc) => processedDocs.find((p) => p.id === doc.id) || doc)
    };
  });
  setState({ projects: nextProjects, errors: {} });
}

async function deleteDocument(projectId, docId) {
  const { error } = await window.InventiveDB.deleteDocument(docId);
  if (error) { console.error("[DB] deleteDocument:", error); }

  if (state.settings.ragMode === "gemini" && state.settings.vectorDb === "pinecone") {
    try {
      await window.RagEngine.deleteFromPinecone(docId, projectId, state.settings);
    } catch (pineErr) {
      console.error("Failed to delete vectors from Pinecone:", pineErr);
    }
  }

  const nextProjects = state.projects.map((project) => {
    if (project.id !== projectId) return project;
    return { ...project, documents: project.documents.filter((doc) => doc.id !== docId) };
  });
  setState({ projects: nextProjects, errors: {} });
}

async function toggleFlag(projectId) {
  const project = getProject(projectId);
  if (!project) return;
  const nextFlag = !project.isImportant;

  if (state.user) {
    const { error } = await window.InventiveDB.updateProject(projectId, { is_important: nextFlag });
    if (error) {
      console.error("[DB] updateProject (flag):", error);
      alert("Failed to update project flag: " + error);
      return;
    }
  }

  const nextProjects = state.projects.map((p) => {
    if (p.id !== projectId) return p;
    return { ...p, isImportant: nextFlag };
  });
  setState({ projects: nextProjects });
}

async function deleteProject(projectId) {
  if (!confirm("Are you sure you want to delete this project? This will permanently delete all associated documents and conversation history.")) {
    return;
  }

  if (state.user) {
    const { error } = await window.InventiveDB.deleteProject(projectId);
    if (error) {
      console.error("[DB] deleteProject:", error);
      alert("Failed to delete project: " + error);
      return;
    }
  }

  const nextProjects = state.projects.filter((p) => p.id !== projectId);
  if (state.route.name === "project" && state.route.projectId === projectId) {
    setState({ projects: nextProjects, route: { name: "dashboard" } });
  } else {
    setState({ projects: nextProjects });
  }
}

async function submitQuery(projectId, text) {
  if (!text) return setState({ errors: { query: "Enter a question before asking." } });
  const userId = state.user?.id;
  const project = getProject(projectId);

  const userMsg = { role: "user", text, citations: [], context: "" };

  if (state.settings.ragMode === "local") {
    const ragAnswer = window.RagEngine.answer(text, project.documents);
    const aiMsg = { role: "ai", text: ragAnswer.text, citations: ragAnswer.citations, context: ragAnswer.context };

    const nextProjects = state.projects.map((p) => {
      if (p.id !== projectId) return p;
      return { ...p, conversation: [...p.conversation, userMsg, aiMsg] };
    });
    setState({ projects: nextProjects, errors: {} });

    await window.InventiveDB.addMessage(projectId, userId, "user", text, [], "");
    await window.InventiveDB.addMessage(projectId, userId, "ai", ragAnswer.text, ragAnswer.citations, ragAnswer.context);
  } else {
    setState({
      isQuerying: true,
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, conversation: [...p.conversation, userMsg] };
      }),
      errors: {}
    });

    try {
      let retrieved = [];
      const isSummary = window.RagEngine.isSummaryOrAboutQuery(text);
      if (isSummary) {
        retrieved = window.RagEngine.getSummaryChunks(project.documents);
      } else {
        const queryEmbedding = await window.RagEngine.embedQuery(text, state.settings.geminiApiKey);

        if (state.settings.vectorDb === "pinecone") {
          retrieved = await window.RagEngine.queryPinecone(queryEmbedding, 4, projectId, state.settings);
        } else {
          const chunks = project.documents
            .filter((doc) => doc.status === "processed")
            .flatMap((doc) => (doc.chunks || []).map((chunk) => ({ ...chunk, documentName: doc.name })));
          
          const chunksWithEmbeddings = chunks.filter((c) => c.embedding && c.embedding.length > 0);
          if (chunksWithEmbeddings.length > 0) {
            retrieved = chunksWithEmbeddings
              .map((chunk) => ({
                ...chunk,
                score: window.RagEngine.cosineSimilarityVectors(queryEmbedding, chunk.embedding)
              }))
              .filter((chunk) => chunk.score > 0.1)
              .sort((a, b) => b.score - a.score)
              .slice(0, 4);
          }
        }
      }

      const ragAnswer = await window.RagEngine.generateGeminiAnswer(text, retrieved, state.settings);
      const aiMsg = { role: "ai", text: ragAnswer.text, citations: ragAnswer.citations, context: ragAnswer.context };

      setState({
        isQuerying: false,
        projects: state.projects.map((p) => {
          if (p.id !== projectId) return p;
          return { ...p, conversation: [...p.conversation, aiMsg] };
        })
      });

      await window.InventiveDB.addMessage(projectId, userId, "user", text, [], "");
      await window.InventiveDB.addMessage(projectId, userId, "ai", ragAnswer.text, ragAnswer.citations, ragAnswer.context);
    } catch (err) {
      console.error("Gemini RAG Query error:", err);
      setState({
        isQuerying: false,
        errors: { query: err.message || "Failed to generate answer. Check API keys and network." }
      });
    }
  }
}

async function loadEnvFile() {
  try {
    const response = await fetch("./.env");
    if (!response.ok) return null;
    const text = await response.text();
    const env = {};
    text.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf("=");
      if (idx === -1) return;
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      env[key] = val;
    });
    return env;
  } catch (err) {
    console.warn("[Inventive RAG] Could not read local .env file:", err.message);
    return null;
  }
}

async function initApp() {
  render();
  const env = await loadEnvFile();
  let envSettings = {};
  if (env) {
    let changed = false;
    const nextSettings = { ...state.settings };
    
    if (env.GEMINI_API_KEY && state.settings.geminiApiKey !== env.GEMINI_API_KEY) {
      nextSettings.geminiApiKey = env.GEMINI_API_KEY;
      nextSettings.ragMode = "gemini";
      changed = true;
    }
    if (env.PINECONE_API_KEY && state.settings.pineconeApiKey !== env.PINECONE_API_KEY) {
      nextSettings.pineconeApiKey = env.PINECONE_API_KEY;
      changed = true;
    }
    if (env.PINECONE_INDEX_HOST && state.settings.pineconeIndexHost !== env.PINECONE_INDEX_HOST) {
      nextSettings.pineconeIndexHost = env.PINECONE_INDEX_HOST;
      nextSettings.vectorDb = "pinecone";
      changed = true;
    }
    if (env.SUPABASE_URL && state.settings.supabaseUrl !== env.SUPABASE_URL) {
      nextSettings.supabaseUrl = env.SUPABASE_URL;
      changed = true;
    }
    const supAnon = env.SUPABASE_ANON_KEY || env.SUPABASE_ANON || env.SUPABASE_ANON_PUBLIC_KEY;
    if (supAnon && state.settings.supabaseAnonKey !== supAnon) {
      nextSettings.supabaseAnonKey = supAnon;
      changed = true;
    }
    
    if (changed) {
      console.info("[Inventive RAG] Auto-loaded credentials from local .env");
      setState({ settings: nextSettings });
    }
    envSettings = env;
  }

  // Initialize Supabase client
  const finalSupabaseUrl = state.settings.supabaseUrl || envSettings.SUPABASE_URL || window.ENV?.SUPABASE_URL;
  const finalSupabaseAnon = state.settings.supabaseAnonKey || envSettings.SUPABASE_ANON_KEY || envSettings.SUPABASE_ANON || envSettings.SUPABASE_ANON_PUBLIC_KEY || window.ENV?.SUPABASE_ANON;
  window.InventiveDB.init(finalSupabaseUrl, finalSupabaseAnon);

  // Sync user data if online and logged in
  if (state.user && window.InventiveDB.isConfigured) {
    if (!state.user.id.startsWith("local-")) {
      await loadUserDataFromDB(state.user.id);
    }
  }
}

initApp();
