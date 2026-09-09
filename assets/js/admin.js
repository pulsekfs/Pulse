// ════════════════════════════════════════════════════════════
// PULSE ADMIN
// A lightweight, no-build admin dashboard that publishes straight
// to the GitHub repo behind the site (Contents API). No server,
// no database — the repo *is* the database.
//
// SECURITY MODEL:
//  - The passphrase below is only a casual deterrent (it's checked
//    client-side, so treat it like a "keep honest people honest" lock).
//  - The REAL access control is the GitHub token: only someone who
//    generates a token with write access to this repo can actually
//    publish anything. Use a fine-grained token scoped to ONLY this
//    repo, with "Contents: Read and write" permission, nothing else.
//  - Change ADMIN_PASSPHRASE_HASH below if you want a different
//    passphrase (see README.md for how to generate the hash).
// ════════════════════════════════════════════════════════════

// Default password — CHANGE THIS. Since this file ships to the browser,
// treat it as a light deterrent only — the GitHub token is the real gate.
const ADMIN_PASSWORD = "ImTheAdmin";

// Your repo details — filled in once so the admin only has to paste a token.
// Edit these three to match your actual GitHub repo.
const REPO_OWNER = "pulsekfs";
const REPO_NAME = "Pulse";
const REPO_BRANCH = "main";

const LS_KEY = "pulse_admin_gh_config";
function toast(msg, type) {
  const el = document.getElementById("admin-toast");
  el.textContent = msg;
  el.className = "admin-toast show" + (type ? " " + type : "");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 4000);
}
function slugify(str) {
  return (str || "").toLowerCase().trim()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p1) => String.fromCharCode("0x" + p1)));
}
function b64DecodeUnicode(str) {
  return decodeURIComponent(atob(str).split("").map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""));
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// ── GitHub config ──
function getConfig() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch (e) { return null; }
}
function setConfig(cfg) { localStorage.setItem(LS_KEY, JSON.stringify(cfg)); }
function clearConfig() { localStorage.removeItem(LS_KEY); }

// ── GitHub Contents API ──
async function ghApi(path, opts = {}) {
  const cfg = getConfig();
  const url = path
    ? `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/${path}`
    : `https://api.github.com/repos/${cfg.owner}/${cfg.repo}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Authorization": `Bearer ${cfg.token}`,
      "Accept": "application/vnd.github+json",
      ...(opts.headers || {})
    }
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function getFile(path) {
  const cfg = getConfig();
  try {
    const data = await ghApi(`contents/${path}?ref=${cfg.branch}`);
    return { content: b64DecodeUnicode(data.content.replace(/\n/g, "")), sha: data.sha };
  } catch (e) {
    return { content: null, sha: null }; // file may not exist yet
  }
}

async function putFile(path, contentStr, message, sha) {
  const cfg = getConfig();
  const body = {
    message,
    content: b64EncodeUnicode(contentStr),
    branch: cfg.branch
  };
  if (sha) body.sha = sha;
  return ghApi(`contents/${path}`, { method: "PUT", body: JSON.stringify(body) });
}

async function putImageFile(path, base64Content, message, sha) {
  const cfg = getConfig();
  const body = { message, content: base64Content, branch: cfg.branch };
  if (sha) body.sha = sha;
  return ghApi(`contents/${path}`, { method: "PUT", body: JSON.stringify(body) });
}

async function uploadImage(file, folder) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
  const path = `images/${folder}/${Date.now()}-${base}.${ext}`;
  const b64 = await fileToBase64(file);
  await putImageFile(path, b64, `Admin: upload image ${path}`);
  return path;
}

// ════════════════════════════════════════════════════════════
// GATE
// ════════════════════════════════════════════════════════════
document.getElementById("gh-connect").addEventListener("click", async () => {
  const password = document.getElementById("password-input").value;
  const token = document.getElementById("gh-token").value.trim();
  const errorEl = document.getElementById("gh-error");
  errorEl.classList.add("hidden");

  if (password !== ADMIN_PASSWORD) {
    errorEl.textContent = "Incorrect password.";
    errorEl.classList.remove("hidden");
    return;
  }
  if (!token) {
    errorEl.textContent = "Please paste your GitHub token.";
    errorEl.classList.remove("hidden");
    return;
  }

  setConfig({ owner: REPO_OWNER, repo: REPO_NAME, branch: REPO_BRANCH, token });

  try {
    await ghApi(""); // basic auth/repo check
    document.getElementById("repo-badge").textContent = `${REPO_OWNER}/${REPO_NAME} · ${REPO_BRANCH}`;
    document.getElementById("gate").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    loadNews();
    loadMembers();
    loadSettings();
  } catch (e) {
    clearConfig();
    errorEl.textContent = "Couldn't connect — check your token has Contents read/write access to " + REPO_OWNER + "/" + REPO_NAME + ".";
    errorEl.classList.remove("hidden");
  }
});

document.getElementById("password-input").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("gh-connect").click();
});
document.getElementById("gh-token").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("gh-connect").click();
});

document.getElementById("logout-btn").addEventListener("click", () => {
  clearConfig();
  location.reload();
});

// Auto-resume if already connected in this browser
(async function tryAutoResume() {
  const cfg = getConfig();
  if (!cfg) return;
  // Still require passphrase this session — do nothing automatically.
})();

// ════════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════════
document.querySelectorAll(".admin-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("tab-news").classList.toggle("hidden", tab.dataset.tab !== "news");
    document.getElementById("tab-members").classList.toggle("hidden", tab.dataset.tab !== "members");
    document.getElementById("tab-settings").classList.toggle("hidden", tab.dataset.tab !== "settings");
  });
});

// ════════════════════════════════════════════════════════════
// NEWS
// ════════════════════════════════════════════════════════════
let newsCache = { articles: [], sha: null };

async function loadNews() {
  const el = document.getElementById("news-list");
  el.innerHTML = `<div class="p-6 text-center text-slate-400 text-sm">Loading…</div>`;
  const { content, sha } = await getFile("assets/data/news.json");
  newsCache.sha = sha;
  newsCache.articles = content ? JSON.parse(content) : [];
  renderNewsList();
}

function renderNewsList() {
  const el = document.getElementById("news-list");
  if (newsCache.articles.length === 0) {
    el.innerHTML = `<div class="p-6 text-center text-slate-400 text-sm">No articles yet. Click "New Article" to publish your first story.</div>`;
    return;
  }
  const sorted = [...newsCache.articles].sort((a,b) => (b.date||"").localeCompare(a.date||""));
  el.innerHTML = sorted.map(a => `
    <div class="admin-row flex items-center justify-between gap-4 px-3">
      <div class="min-w-0">
        <div class="font-display font-bold text-sm truncate">${a.title} ${a.pinned ? '<span class="text-yellow-deep">📌</span>' : ''} ${a.featured ? '<span class="text-yellow-deep">★</span>' : ''}</div>
        <div class="text-xs text-slate-400 font-body">${a.category || 'News'} · ${a.date}</div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button class="admin-btn admin-btn-ghost !py-1.5 !px-3 text-xs" data-edit="${a.id}">Edit</button>
        <button class="admin-btn admin-btn-danger !py-1.5 !px-3 text-xs" data-del="${a.id}">Delete</button>
      </div>
    </div>
  `).join("");

  el.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => openNewsModal(b.dataset.edit)));
  el.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => deleteArticle(b.dataset.del)));
}

function openNewsModal(id) {
  const modal = document.getElementById("news-modal");
  modal.classList.remove("hidden");
  const a = id ? newsCache.articles.find(x => x.id === id) : null;
  document.getElementById("news-modal-title").textContent = a ? "Edit Article" : "New Article";
  document.getElementById("news-form-id").value = a ? a.id : "";
  document.getElementById("news-title").value = a ? a.title : "";
  document.getElementById("news-excerpt").value = a ? a.excerpt : "";
  document.getElementById("news-body").value = a ? a.body : "";
  document.getElementById("news-category").value = a ? a.category : "";
  document.getElementById("news-date").value = a ? a.date : new Date().toISOString().slice(0,10);
  document.getElementById("news-tags").value = a && a.tags ? a.tags.join(", ") : "";
  document.getElementById("news-image-file").value = "";
  document.getElementById("news-image-url").value = a ? a.image || "" : "";
  document.getElementById("news-featured").checked = a ? !!a.featured : false;
  document.getElementById("news-pinned").checked = a ? !!a.pinned : false;
}
function closeNewsModal() { document.getElementById("news-modal").classList.add("hidden"); }
document.querySelectorAll(".news-modal-close").forEach(b => b.addEventListener("click", closeNewsModal));
document.getElementById("news-new-btn").addEventListener("click", () => openNewsModal(null));

document.getElementById("news-save-btn").addEventListener("click", async () => {
  const btn = document.getElementById("news-save-btn");
  const title = document.getElementById("news-title").value.trim();
  if (!title) { toast("Title is required", "error"); return; }

  btn.disabled = true;
  btn.innerHTML = `<span class="admin-spinner"></span> Publishing…`;

  try {
    const editId = document.getElementById("news-form-id").value;
    let imagePath = document.getElementById("news-image-url").value.trim();
    const file = document.getElementById("news-image-file").files[0];
    if (file) imagePath = await uploadImage(file, "news");

    const existing = editId ? newsCache.articles.find(x => x.id === editId) : null;
    const slug = existing ? existing.slug : uniqueSlug(slugify(title), newsCache.articles.map(a => a.slug));

    const article = {
      id: existing ? existing.id : (Date.now().toString(36) + Math.random().toString(36).slice(2,6)),
      slug,
      title,
      excerpt: document.getElementById("news-excerpt").value.trim(),
      body: document.getElementById("news-body").value.trim(),
      image: imagePath || (existing ? existing.image : ""),
      category: document.getElementById("news-category").value.trim() || "News",
      tags: document.getElementById("news-tags").value.split(",").map(t => t.trim()).filter(Boolean),
      date: document.getElementById("news-date").value || new Date().toISOString().slice(0,10),
      author: existing ? existing.author : "Pulse Media Team",
      featured: document.getElementById("news-featured").checked,
      pinned: document.getElementById("news-pinned").checked
    };

    if (existing) {
      newsCache.articles = newsCache.articles.map(a => a.id === existing.id ? article : a);
    } else {
      newsCache.articles.push(article);
    }

    const result = await putFile(
      "assets/data/news.json",
      JSON.stringify(newsCache.articles, null, 2),
      `Admin: ${existing ? "update" : "publish"} article "${title}"`,
      newsCache.sha
    );
    newsCache.sha = result.content.sha;

    toast("Published! Live in a minute or two.", "success");
    closeNewsModal();
    renderNewsList();
  } catch (e) {
    console.error(e);
    toast("Failed to publish: " + e.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Publish";
  }
});

async function deleteArticle(id) {
  if (!confirm("Delete this article? This publishes immediately.")) return;
  const a = newsCache.articles.find(x => x.id === id);
  newsCache.articles = newsCache.articles.filter(x => x.id !== id);
  try {
    const result = await putFile(
      "assets/data/news.json",
      JSON.stringify(newsCache.articles, null, 2),
      `Admin: delete article "${a ? a.title : id}"`,
      newsCache.sha
    );
    newsCache.sha = result.content.sha;
    toast("Article deleted.", "success");
    renderNewsList();
  } catch (e) {
    toast("Failed to delete: " + e.message, "error");
  }
}

function uniqueSlug(base, existing) {
  let slug = base, i = 2;
  while (existing.includes(slug)) { slug = `${base}-${i++}`; }
  return slug;
}

// ════════════════════════════════════════════════════════════
// NEW MEMBERS
// ════════════════════════════════════════════════════════════
let membersCache = { members: [], sha: null };

async function loadMembers() {
  const el = document.getElementById("members-list");
  el.innerHTML = `<div class="p-6 text-center text-slate-400 text-sm">Loading…</div>`;
  const { content, sha } = await getFile("assets/data/new-members.json");
  membersCache.sha = sha;
  membersCache.members = content ? JSON.parse(content) : [];
  renderMembersList();
}

function renderMembersList() {
  const el = document.getElementById("members-list");
  if (membersCache.members.length === 0) {
    el.innerHTML = `<div class="p-6 text-center text-slate-400 text-sm">No new members yet. Click "Add Member" to welcome someone to the team page.</div>`;
    return;
  }
  el.innerHTML = membersCache.members.map(m => `
    <div class="admin-row flex items-center justify-between gap-4 px-3">
      <div class="min-w-0">
        <div class="font-display font-bold text-sm truncate">${m.englishName}</div>
        <div class="text-xs text-slate-400 font-body">${m.committee || ''} ${m.role ? '· ' + m.role : ''} · ${m.verificationId || ''}</div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button class="admin-btn admin-btn-ghost !py-1.5 !px-3 text-xs" data-edit="${m.id}">Edit</button>
        <button class="admin-btn admin-btn-danger !py-1.5 !px-3 text-xs" data-del="${m.id}">Delete</button>
      </div>
    </div>
  `).join("");

  el.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => openMemberModal(b.dataset.edit)));
  el.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => deleteMember(b.dataset.del)));
}

function openMemberModal(id) {
  const modal = document.getElementById("member-modal");
  modal.classList.remove("hidden");
  const m = id ? membersCache.members.find(x => x.id === id) : null;
  document.getElementById("member-form-id").value = m ? m.id : "";
  document.getElementById("member-arabic-name").value = m ? m.arabicName || "" : "";
  document.getElementById("member-english-name").value = m ? m.englishName : "";
  document.getElementById("member-committee").value = m ? m.committee || "" : "";
  document.getElementById("member-role").value = m ? m.role || "" : "";
  document.getElementById("member-verification-id").value = m ? m.verificationId || "" : "";
  document.getElementById("member-image-file").value = "";
}
function closeMemberModal() { document.getElementById("member-modal").classList.add("hidden"); }
document.querySelectorAll(".member-modal-close").forEach(b => b.addEventListener("click", closeMemberModal));
document.getElementById("member-new-btn").addEventListener("click", () => openMemberModal(null));

// Auto-fill verification ID from English name
document.getElementById("member-english-name").addEventListener("input", (e) => {
  const idField = document.getElementById("member-verification-id");
  if (idField.dataset.userEdited === "true") return;
  const parts = e.target.value.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 1) {
    const suggestion = "PULSE26-" + parts.map(p => p.replace(/[^A-Za-z]/g,"").toUpperCase()).join("-");
    idField.value = suggestion;
  }
});
document.getElementById("member-verification-id").addEventListener("input", (e) => {
  e.target.dataset.userEdited = "true";
});

document.getElementById("member-save-btn").addEventListener("click", async () => {
  const btn = document.getElementById("member-save-btn");
  const englishName = document.getElementById("member-english-name").value.trim();
  if (!englishName) { toast("English name is required", "error"); return; }

  btn.disabled = true;
  btn.innerHTML = `<span class="admin-spinner"></span> Saving…`;

  try {
    const editId = document.getElementById("member-form-id").value;
    const existing = editId ? membersCache.members.find(x => x.id === editId) : null;

    let imagePath = existing ? existing.image : "";
    const file = document.getElementById("member-image-file").files[0];
    if (file) imagePath = await uploadImage(file, "members");

    const member = {
      id: existing ? existing.id : (Date.now().toString(36) + Math.random().toString(36).slice(2,6)),
      arabicName: document.getElementById("member-arabic-name").value.trim(),
      englishName,
      committee: document.getElementById("member-committee").value.trim(),
      role: document.getElementById("member-role").value.trim(),
      verificationId: document.getElementById("member-verification-id").value.trim().toUpperCase(),
      image: imagePath,
      dateAdded: existing ? existing.dateAdded : new Date().toISOString().slice(0,10)
    };

    if (existing) {
      membersCache.members = membersCache.members.map(m => m.id === existing.id ? member : m);
    } else {
      membersCache.members.push(member);
    }

    const result = await putFile(
      "assets/data/new-members.json",
      JSON.stringify(membersCache.members, null, 2),
      `Admin: ${existing ? "update" : "add"} member "${englishName}"`,
      membersCache.sha
    );
    membersCache.sha = result.content.sha;

    toast("Saved! They'll appear on the Team page shortly.", "success");
    closeMemberModal();
    renderMembersList();
  } catch (e) {
    console.error(e);
    toast("Failed to save: " + e.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Add Member";
  }
});

async function deleteMember(id) {
  if (!confirm("Remove this member from the New Members section?")) return;
  const m = membersCache.members.find(x => x.id === id);
  membersCache.members = membersCache.members.filter(x => x.id !== id);
  try {
    const result = await putFile(
      "assets/data/new-members.json",
      JSON.stringify(membersCache.members, null, 2),
      `Admin: remove member "${m ? m.englishName : id}"`,
      membersCache.sha
    );
    membersCache.sha = result.content.sha;
    toast("Member removed.", "success");
    renderMembersList();
  } catch (e) {
    toast("Failed to remove: " + e.message, "error");
  }
}

// ════════════════════════════════════════════════════════════
// HOMEPAGE SETTINGS (Apply banner toggle)
// ════════════════════════════════════════════════════════════
let settingsCache = { data: { showApplyCTA: true }, sha: null };

async function loadSettings() {
  const { content, sha } = await getFile("assets/data/site-settings.json");
  settingsCache.sha = sha;
  settingsCache.data = content ? JSON.parse(content) : { showApplyCTA: true };
  document.getElementById("setting-show-apply").checked = settingsCache.data.showApplyCTA !== false;
}

document.getElementById("settings-save-btn").addEventListener("click", async () => {
  const btn = document.getElementById("settings-save-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="admin-spinner"></span> Saving…`;
  try {
    settingsCache.data.showApplyCTA = document.getElementById("setting-show-apply").checked;
    const result = await putFile(
      "assets/data/site-settings.json",
      JSON.stringify(settingsCache.data, null, 2),
      "Admin: update homepage settings",
      settingsCache.sha
    );
    settingsCache.sha = result.content.sha;
    toast("Saved! Live in a minute or two.", "success");
  } catch (e) {
    toast("Failed to save: " + e.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Save";
  }
});
