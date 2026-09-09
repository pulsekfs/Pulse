// ════════════════════════════════════════════════════════════
// PULSE — HOME PAGE ONLY
// Events gallery carousel, latest-news strip, and the
// admin-controlled Apply banner toggle.
// ════════════════════════════════════════════════════════════

// ── Latest News (top 3 articles from the newsroom) ──
(function loadLatestNews(){
  const grid = document.getElementById('latest-news-grid');
  const section = document.getElementById('latest-news');
  if (!grid || !section) return;

  function escapeHtml(str){
    return (str || "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[s]));
  }
  function formatDate(iso){
    try { return new Date(iso + "T00:00:00").toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}); }
    catch(e){ return iso; }
  }
  function cardHTML(a){
    const img = a.image || "images/logo.webp";
    return `
      <a href="news-article.html?slug=${encodeURIComponent(a.slug)}" class="news-card reveal visible">
        <div class="news-card-img"><img src="${img}" alt="${escapeHtml(a.title)}" onerror="this.style.display='none'"/></div>
        <div class="news-card-body">
          <span class="news-chip">${escapeHtml(a.category || "News")}</span>
          <h3 class="font-display font-bold text-ink text-lg leading-snug">${escapeHtml(a.title)}</h3>
          <p class="font-body text-slate-500 text-sm leading-relaxed line-clamp-3">${escapeHtml(a.excerpt || "")}</p>
          <div class="mt-auto pt-2 text-xs font-body text-slate-400">${formatDate(a.date)}</div>
        </div>
      </a>`;
  }

  fetch("assets/data/news.json", { cache: "no-store" })
    .then(res => res.ok ? res.json() : [])
    .then(articles => {
      if (!Array.isArray(articles) || articles.length === 0) return; // stays hidden
      const latest = [...articles].sort((a,b) => (b.date||"").localeCompare(a.date||"")).slice(0, 3);
      grid.innerHTML = latest.map(cardHTML).join("");
      section.classList.remove("hidden");
    })
    .catch(() => {});
})();

// ── Apply banner visibility (admin-controlled) ──
(function applySiteSettings(){
  const cta = document.getElementById('home-apply-cta');
  if (!cta) return;
  fetch("assets/data/site-settings.json", { cache: "no-store" })
    .then(res => res.ok ? res.json() : { showApplyCTA: true })
    .then(settings => {
      if (settings && settings.showApplyCTA === false) {
        cta.classList.add("hidden");
      }
    })
    .catch(() => {}); // if it fails to load, leave the banner showing (safe default)
})();
(function(){
  const inner = document.getElementById('galleryInner');
  if(!inner) return;
  const N = 7;
  const dots = document.querySelectorAll('.gallery-dot');
  let cur = 0, locked = false;

  function goTo(n, animate) {
    cur = ((n % N) + N) % N;
    inner.style.transition = animate === false ? 'none' : 'transform .45s cubic-bezier(.4,0,.2,1)';
    inner.style.transform = `translateX(${-cur * 100}%)`;
    dots.forEach((d,i) => d.classList.toggle('active', i === cur));
  }

  function next() { if(!locked){ locked=true; goTo(cur+1,true); setTimeout(()=>locked=false,460); } }
  function prev() { if(!locked){ locked=true; goTo(cur-1,true); setTimeout(()=>locked=false,460); } }

  document.getElementById('galleryNext').addEventListener('click', next);
  document.getElementById('galleryPrev').addEventListener('click', prev);
  dots.forEach(d => d.addEventListener('click', ()=>goTo(+d.dataset.idx, true)));

  // Touch swipe
  let tx=0;
  inner.addEventListener('touchstart', e=>{ tx=e.touches[0].clientX; }, {passive:true});
  inner.addEventListener('touchend', e=>{
    const diff = tx - e.changedTouches[0].clientX;
    if(Math.abs(diff)>40) diff>0 ? next() : prev();
  });

  // Auto-advance — uses setInterval, never stops
  setInterval(next, 4500);
  goTo(0, false);
})();
