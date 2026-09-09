// ════════════════════════════════════════════════════════════
// PULSE — SHARED SITE BEHAVIOR
// Navbar glass-on-scroll, hamburger menu, scroll-reveal animation.
// Used on every page (index, team, news, article).
// ════════════════════════════════════════════════════════════

// Navbar glass on scroll
const nav = document.getElementById("navbar");
if (nav) {
  window.addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 60));
}

// Hamburger
const hbg = document.getElementById("hamburger");
const mob = document.getElementById("mobile-menu");
if (hbg && mob) {
  hbg.addEventListener("click", () => {
    mob.classList.toggle("open");
    const ic = hbg.querySelector("i");
    ic.classList.toggle("fa-bars"); ic.classList.toggle("fa-xmark");
  });
  document.querySelectorAll(".mobile-link").forEach(l => l.addEventListener("click", () => {
    mob.classList.remove("open");
    const ic = hbg.querySelector("i");
    ic.classList.add("fa-bars"); ic.classList.remove("fa-xmark");
  }));
}

// Scroll reveal
const obs = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); }
}), { threshold: 0.1 });
document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
