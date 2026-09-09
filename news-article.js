// ════════════════════════════════════════════════════════════
// PULSE NEWS — single article page
// ════════════════════════════════════════════════════════════

function formatDate(iso) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch (e) { return iso; }
}
function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[s]));
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  let articles = [];
  try {
    const res = await fetch("assets/data/news.json", { cache: "no-store" });
    articles = res.ok ? await res.json() : [];
  } catch (e) {
    console.warn("Could not load news.json", e);
  }

  const article = Array.isArray(articles) ? articles.find(a => a.slug === slug) : null;

  if (!article) {
    document.getElementById("article-root").classList.add("hidden");
    document.getElementById("article-not-found").classList.remove("hidden");
    return;
  }

  document.getElementById("page-title").textContent = article.title + " — Pulse News";
  document.getElementById("article-title").textContent = article.title;
  document.getElementById("article-date").textContent = formatDate(article.date);
  document.getElementById("article-author").textContent = article.author || "Pulse Media Team";

  document.getElementById("article-meta").innerHTML = `
    <span class="news-chip">${escapeHtml(article.category || "News")}</span>
    ${article.pinned ? '<span class="news-chip pinned"><i class="fa-solid fa-thumbtack"></i> Pinned</span>' : ''}
  `;

  const img = document.getElementById("article-image");
  if (article.image) {
    img.src = article.image;
    img.alt = article.title;
  } else {
    img.closest("div").classList.add("hidden");
  }

  const bodyEl = document.getElementById("article-body");
  const paragraphs = (article.body || "").split(/\n\s*\n/).filter(p => p.trim());
  bodyEl.innerHTML = paragraphs.map(p => `<p>${escapeHtml(p).replace(/\n/g,'<br/>')}</p>`).join("");

  const tagsEl = document.getElementById("article-tags");
  if (Array.isArray(article.tags) && article.tags.length) {
    tagsEl.innerHTML = article.tags.map(t => `<span class="article-tag">#${escapeHtml(t)}</span>`).join("");
  }
}

init();
