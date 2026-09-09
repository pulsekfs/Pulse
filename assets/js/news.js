// ════════════════════════════════════════════════════════════
// PULSE NEWS — listing page
// Reads assets/data/news.json (edited via /admin) and renders it.
// ════════════════════════════════════════════════════════════

let ALL_ARTICLES = [];
let activeCategory = "All";

function formatDate(iso) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch (e) { return iso; }
}

function articleCardHTML(a) {
  const img = a.image || "images/logo.webp";
  return `
    <a href="news-article.html?slug=${encodeURIComponent(a.slug)}" class="news-card reveal visible">
      <div class="news-card-img"><img src="${img}" alt="${escapeHtml(a.title)}" onerror="this.style.display='none'"/></div>
      <div class="news-card-body">
        <div class="flex items-center gap-2">
          <span class="news-chip">${escapeHtml(a.category || "News")}</span>
          ${a.pinned ? '<span class="news-chip pinned"><i class="fa-solid fa-thumbtack"></i> Pinned</span>' : ''}
        </div>
        <h3 class="font-display font-bold text-ink text-lg leading-snug">${escapeHtml(a.title)}</h3>
        <p class="font-body text-slate-500 text-sm leading-relaxed line-clamp-3">${escapeHtml(a.excerpt || "")}</p>
        <div class="mt-auto pt-2 text-xs font-body text-slate-400">${formatDate(a.date)}</div>
      </div>
    </a>`;
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[s]));
}

function renderCategoryFilters() {
  const wrap = document.getElementById("category-filters");
  const cats = ["All", ...new Set(ALL_ARTICLES.map(a => a.category).filter(Boolean))];
  wrap.innerHTML = cats.map(c =>
    `<button class="filter-chip ${c === activeCategory ? 'active' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
  ).join("");
  wrap.querySelectorAll(".filter-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderCategoryFilters();
      renderGrid();
    });
  });
}

function renderFeatured() {
  const featured = ALL_ARTICLES.filter(a => a.featured || a.pinned);
  const wrap = document.getElementById("featured-wrap");
  const grid = document.getElementById("featured-grid");
  if (featured.length === 0) { wrap.classList.add("hidden"); return; }
  wrap.classList.remove("hidden");
  grid.innerHTML = featured.map(articleCardHTML).join("");
}

function renderGrid() {
  const grid = document.getElementById("news-grid");
  const empty = document.getElementById("news-empty");
  let list = [...ALL_ARTICLES].sort((a,b) => (b.date || "").localeCompare(a.date || ""));
  if (activeCategory !== "All") list = list.filter(a => a.category === activeCategory);

  if (list.length === 0) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");
  grid.innerHTML = list.map(articleCardHTML).join("");
}

async function init() {
  try {
    const res = await fetch("assets/data/news.json", { cache: "no-store" });
    ALL_ARTICLES = res.ok ? await res.json() : [];
  } catch (e) {
    console.warn("Could not load news.json", e);
    ALL_ARTICLES = [];
  }
  if (!Array.isArray(ALL_ARTICLES)) ALL_ARTICLES = [];
  renderCategoryFilters();
  renderFeatured();
  renderGrid();
}

init();
