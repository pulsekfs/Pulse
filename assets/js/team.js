// ════════════════════════════════════════════════════════════
// PULSE — TEAM PAGE
// Certificate verification lookup (original 28 members) +
// dynamic rendering of newly-accepted members added via /admin.
// (Navbar / hamburger / scroll-reveal now live in site.js)
// ════════════════════════════════════════════════════════════

// ── VERIFICATION ID → CARD ID MAPPING (original Season 2026 team) ──
const verificationMap = {
  // High Board
  "PULSE26-OMAR-ELBEDAWY":        "card-omar",
  "PULSE26-RHMAN-AHMED":          "card-abdelrhman",
  // Committee 1 — COI & OC
  "PULSE26-KARIM-MOHAMMED":       "card-abdelkarim",
  "PULSE26-BASSANT-HESHAM":       "card-bassant",
  "PULSE26-YARA-EBRAHIM":         "card-yara",
  "PULSE26-MOHAMMED-ELDALY":      "card-eldaly",
  "PULSE26-YOUSEF-ELLAWATY":      "card-yousef-ellawaty",
  "PULSE26-YASSIN-HOSSAM":        "card-yassin",
  "PULSE26-SHAIMAA-MOHAMMED":     "card-shaimaa",
  "PULSE26-GLORIA-MICHAEL":       "card-gloria",
  "PULSE26-HUDA-IBRAHIM":         "card-huda",
  "PULSE26-OMAR-MOWAFI":          "card-omar-mowafi",
  "PULSE26-ALI-ELSAQA":           "card-ali-elsaqa",
  "PULSE26-ABDELHAMEED-EMAD":     "card-abdelhameed",
  "PULSE26-OSAMA-FARAHAT":        "card-osama",
  "PULSE26-ALSHAIMAA-ENAR":       "card-alshaimaa",
  "PULSE26-NOUR-ELSHEIKH":        "card-nour",
  "PULSE26-ALI-ABDOLMONIEM":      "card-ali-abdolmoniem",
  // Committee 2 — Marketing & Media
  "PULSE26-AHMED-REDA":           "card-ahmed-reda",
  "PULSE26-SAFY-HESHAM":          "card-safy",
  "PULSE26-DAREEN-MOHAMMED":      "card-dareen",
  "PULSE26-AHMED-MAHMOUD":        "card-ahmed-mahmoud",
  "PULSE26-YOUSEF-RAGAB":         "card-yousef-ragab",
  "PULSE26-SARA-WESSAM":          "card-sara",
  // Committee 3 — Scholarships & Admissions
  "PULSE26-MOHAMMED-OSAMA":       "card-mohammed-osama",
  "PULSE26-MARK-HANY":            "card-mark",
  "PULSE26-ANAS-EBRAHIM":         "card-anas",
  "PULSE26-HANEEN-ABDELRAZIK":    "card-haneen",
};

// Name map for success message
const nameMap = {
  "card-omar":            "Omar Elbedawy — President",
  "card-abdelrhman":     "Abdelrhman Metwally — Vice President",
  "card-abdelkarim":      "AbdelKarim Mohammed",
  "card-bassant":         "Bassant Hesham",
  "card-yara":            "Yara Ebrahim",
  "card-eldaly":          "Mohammed Eldaly",
  "card-yousef-ellawaty": "Yousef Ellawaty",
  "card-yassin":          "Yassin Hossam",
  "card-shaimaa":         "Shaimaa Mohammed",
  "card-gloria":          "Gloria Michael",
  "card-huda":            "Huda Ibrahim",
  "card-omar-mowafi":     "Omar Mowafi",
  "card-ali-elsaqa":      "Ali ElSaqa",
  "card-abdelhameed":     "Abdelhameed Emad",
  "card-osama":           "Osama Farahat",
  "card-alshaimaa":       "AlShaimaa Enar",
  "card-nour":            "Nour Elsheikh",
  "card-ali-abdolmoniem": "Ali Abdolmoniem",
  "card-ahmed-reda":      "Ahmed Reda",
  "card-safy":            "Safy Hesham",
  "card-dareen":          "Dareen Mohammed",
  "card-ahmed-mahmoud":   "Ahmed Mahmoud",
  "card-yousef-ragab":    "Yousef Ragab",
  "card-sara":            "Sara Wessam",
  "card-mohammed-osama":  "Mohammed Osama",
  "card-mark":            "Mark Hany",
  "card-anas":            "Anas Ebrahim",
  "card-haneen":          "Haneen Abdelrazik",
};

let activeCard = null;
let clearTimer = null;

function clearVerification() {
  if (activeCard) {
    activeCard.classList.remove("verified");
    activeCard.style.boxShadow = "";
    activeCard = null;
  }
}

function runVerification() {
  const input = document.getElementById("verify-input");
  const errorEl = document.getElementById("verify-error");
  const successEl = document.getElementById("verify-success");
  const successText = document.getElementById("verify-success-text");
  const rawId = input.value.trim().toUpperCase();

  // Reset UI
  errorEl.classList.add("hidden");
  successEl.classList.add("hidden");
  clearVerification();
  if (clearTimer) clearTimeout(clearTimer);

  if (!rawId) return;

  const cardId = verificationMap[rawId];

  if (!cardId) {
    // Invalid ID
    errorEl.classList.remove("hidden");
    const toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
    return;
  }

  // Valid — scroll and highlight
  const card = document.getElementById(cardId);
  if (!card) return;

  const memberName = nameMap[cardId] || "Member";
  successText.textContent = `✅ Certificate verified! Scrolling to: ${memberName}`;
  successEl.classList.remove("hidden");

  // Smooth scroll
  const offset = 100;
  const top = card.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });

  // Apply green glow + verified badge after short delay (let scroll settle)
  setTimeout(() => {
    card.classList.add("verified");
    activeCard = card;
  }, 400);

  // Auto-remove after 4 seconds
  clearTimer = setTimeout(() => {
    clearVerification();
  }, 4400);
}

document.getElementById("verify-btn").addEventListener("click", runVerification);
document.getElementById("verify-input").addEventListener("keydown", e => {
  if (e.key === "Enter") runVerification();
});

// ════════════════════════════════════════════════════════════
// NEWLY ACCEPTED MEMBERS — loaded from assets/data/new-members.json
// Anything added through /admin shows up here automatically,
// on next page load, with zero code edits required.
// ════════════════════════════════════════════════════════════
async function loadNewMembers() {
  const section = document.getElementById("section-new-members");
  const grid = document.getElementById("new-members-grid");
  if (!section || !grid) return;

  let members = [];
  try {
    const res = await fetch("assets/data/new-members.json", { cache: "no-store" });
    if (res.ok) members = await res.json();
  } catch (e) {
    console.warn("Could not load new-members.json", e);
  }

  if (!Array.isArray(members) || members.length === 0) {
    section.classList.add("hidden");
    return;
  }

  section.classList.remove("hidden");
  grid.innerHTML = "";

  members.forEach(m => {
    const cardId = "card-new-" + slugify(m.englishName);

    // Register into verification system so their cert ID works too
    if (m.verificationId) {
      verificationMap[m.verificationId.toUpperCase()] = cardId;
      nameMap[cardId] = m.englishName + (m.role ? " — " + m.role : "");
    }

    const wrap = document.createElement("div");
    wrap.className = "flex flex-col items-center gap-3 w-52 sm:w-64 reveal visible";
    wrap.innerHTML = `
      <div id="${cardId}" class="member-card w-full" style="aspect-ratio:3/4;">
        <img src="${m.image || ''}" alt="${escapeHtml(m.englishName)}"
             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(m.englishName)}&background=FFD23F&color=0D0D0D&size=400&font-size=0.33&bold=true'" />
        <div class="member-overlay">
          <div class="flex items-end justify-between">
            <div>
              <div class="font-display font-extrabold text-white text-base leading-tight">${escapeHtml(m.englishName)}</div>
              <div class="text-yellow-pulse font-body text-xs mt-0.5 font-medium">${escapeHtml(m.role || '')}</div>
            </div>
          </div>
        </div>
        <div class="verified-badge">✅ Verified Authenticated</div>
      </div>
      <div class="text-center">
        <div class="font-display font-bold text-ink text-sm">${escapeHtml(m.englishName)}</div>
        <div class="font-body text-slate-500 text-xs mt-0.5">${escapeHtml(m.role || '')}</div>
        <span class="inline-block mt-1.5 px-2 py-0.5 bg-yellow-pulse/20 text-yellow-deep text-[10px] font-bold rounded-full font-display tracking-wide">${escapeHtml((m.committee || 'NEW MEMBER').toUpperCase())}</span>
      </div>
    `;
    grid.appendChild(wrap);
  });
}

function slugify(str) {
  return (str || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[s]));
}

loadNewMembers();
