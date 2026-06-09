const icons = {
  home: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>',
  logOut: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  plus: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  search: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  trash: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 16H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
  file: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  send: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
  close: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  arrowLeft: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>'
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

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved ? migrateState({ ...seedState, ...saved, errors: {}, modal: null }) : structuredClone(seedState);
  } catch {
    return structuredClone(seedState);
  }
}

function migrateState(nextState) {
  return {
    ...nextState,
    projects: nextState.projects.map((project) => ({
      ...project,
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
    projects: state.projects
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
        documents,
        conversation
      };
    })
  );

  setState({ projects: hydratedProjects });
}

function setState(next) {
  state = { ...state, ...next };
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
      </div>
    `;
  }
  bindEvents();
}

function renderHeader() {
  return `
    <header class="header">
      <div class="brand" aria-label="Inventive brand"><span class="brand-mark"></span><span>Inventive</span></div>
      <button class="nav-button" data-action="home" title="Home">${icons.home} Home</button>
      <div class="header-actions">
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
        <div class="field search-field">
          <label for="projectSearch">Search projects</label>
          ${icons.search}
          <input id="projectSearch" value="${escapeHtml(state.search)}" placeholder="Find by project name" />
        </div>
        <div class="field">
          <label for="projectSort">Sort by</label>
          <select id="projectSort">
            <option value="created-desc" ${state.sort === "created-desc" ? "selected" : ""}>Newest first</option>
            <option value="name-asc" ${state.sort === "name-asc" ? "selected" : ""}>Name A to Z</option>
            <option value="docs-desc" ${state.sort === "docs-desc" ? "selected" : ""}>Most documents</option>
          </select>
        </div>
        <button class="secondary-button" data-action="open-new-project">${icons.plus} Create</button>
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
  return state.projects
    .filter((project) => project.name.toLowerCase().includes(needle))
    .sort((a, b) => {
      if (state.sort === "name-asc") return a.name.localeCompare(b.name);
      if (state.sort === "docs-desc") return b.documents.length - a.documents.length;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

function renderProjectCard(project) {
  return `
    <button class="project-card" data-action="open-project" data-project-id="${project.id}">
      <span>
        <h2>${escapeHtml(project.name)}</h2>
        <p>Created ${formatDate(project.createdAt)}</p>
      </span>
      <span class="card-meta">
        <span>${project.documents.filter((doc) => doc.status === "processed").length} processed</span>
        <span class="count-pill">${project.documents.length} docs</span>
      </span>
    </button>
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
            ${project.conversation.length ? project.conversation.map((message) => renderMessage(message, project)).join("") : `
              <div class="empty-state">
                <div>
                  <h2>No questions yet</h2>
                  <p>Ask a question to generate a sourced answer.</p>
                </div>
              </div>
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
      if (event.target === backdrop) setState({ modal: null, errors: {} });
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
    setState({ user: null, route: { name: "auth" }, authMode: "login", errors: {}, projects: structuredClone(seedState.projects) });
    localStorage.removeItem(storageKey);
  }
  if (action === "open-new-project") {
    setState({ modal: "new-project", errors: {} });
  }
  if (action === "close-modal") {
    setState({ modal: null, errors: {} });
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
    await loadUserDataFromDB(user.id);
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

  if (formType === "query") {
    return submitQuery(form.dataset.projectId, data.get("queryText")?.trim());
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
        const finalDoc = {
          ...baseDoc,
          status: "processed",
          extractedText: processed.extractedText,
          chunks: processed.chunks,
          chunkCount: processed.chunkCount
        };
        // 4. Persist processed state + chunks to DB
        await window.InventiveDB.updateDocument(baseDoc.id, {
          status: "processed",
          extracted_text: processed.extractedText,
          chunk_count: processed.chunkCount,
          extraction_error: ""
        });
        await window.InventiveDB.saveChunks(baseDoc.id, projectId, processed.chunks);
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
  const nextProjects = state.projects.map((project) => {
    if (project.id !== projectId) return project;
    return { ...project, documents: project.documents.filter((doc) => doc.id !== docId) };
  });
  setState({ projects: nextProjects, errors: {} });
}

async function submitQuery(projectId, text) {
  if (!text) return setState({ errors: { query: "Enter a question before asking." } });
  const userId = state.user?.id;
  const project = getProject(projectId);
  const ragAnswer = window.RagEngine.answer(text, project.documents);

  const userMsg = { role: "user", text, citations: [], context: "" };
  const aiMsg   = { role: "ai", text: ragAnswer.text, citations: ragAnswer.citations, context: ragAnswer.context };

  // Optimistic UI update
  const nextProjects = state.projects.map((p) => {
    if (p.id !== projectId) return p;
    return { ...p, conversation: [...p.conversation, userMsg, aiMsg] };
  });
  setState({ projects: nextProjects, errors: {} });

  // Persist both turns to DB
  await window.InventiveDB.addMessage(projectId, userId, "user", text, [], "");
  await window.InventiveDB.addMessage(projectId, userId, "ai", ragAnswer.text, ragAnswer.citations, ragAnswer.context);
}

render();
