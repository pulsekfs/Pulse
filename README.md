# Pulse Website — File Guide & Admin Setup

Your site was reorganized into clean, separate files (no visual changes — everything
looks and behaves exactly as before), plus two new things:

1. **`news.html`** — a real newspaper/newsroom page you can publish to forever.
2. **`admin/`** — a private dashboard where you (the admin) add news articles and
   newly-accepted members yourself, with no code editing required.

---

## 1. File structure

```
/
├── index.html              Home page (same content, now loads shared CSS/JS)
├── team.html                Team + certificate verification page
├── news.html                 Newspaper — lists all published articles
├── news-article.html         Single article view
├── admin/
│   └── index.html            Your private admin dashboard
├── assets/
│   ├── css/
│   │   ├── main.css          All shared site styles (deduplicated from the originals)
│   │   ├── news.css          Extra styles for the newspaper pages
│   │   └── admin.css         Extra styles for the admin dashboard
│   ├── js/
│   │   ├── tailwind-config.js  Shared Tailwind theme config
│   │   ├── site.js             Navbar, hamburger menu, scroll-reveal (every page)
│   │   ├── home.js              Home page's events carousel
│   │   ├── team.js              Certificate verification + "new members" rendering
│   │   ├── news.js              Newspaper listing logic
│   │   ├── news-article.js      Single article rendering
│   │   └── admin.js             Admin dashboard logic (publishes via GitHub)
│   └── data/
│       ├── news.json          All published articles — this IS your newspaper's database
│       └── new-members.json   All newly-accepted members added via /admin
├── images/                   Your existing image files (unchanged — just re-upload
│                              the same images/ folder you already have, this repo
│                              handoff doesn't include your image binaries)
├── favicon/                  Your existing favicon files (same as before)
└── CNAME                     For the pulsekfs.org custom domain
```

Nothing about how the site *looks* changed. The only visible additions are a
"News" link in the navigation, and a "Newly Accepted Members" section on the
Team page (hidden automatically until you add someone through the admin).

---

## 2. Publishing this to GitHub Pages + pulsekfs.org

1. Push this whole folder to your `pulsekfs` repo, replacing the old files.
2. In the repo's **Settings → Pages**, make sure GitHub Pages is serving from
   the branch you pushed to (usually `main`).
3. The included `CNAME` file already points to `pulsekfs.org` for when you
   get the domain in a few days. Until then, either delete the `CNAME` file
   or just ignore GitHub's "domain not configured" warning — the site still
   works fine at your `pulsekfs.github.io` URL in the meantime. Once you
   have the domain, point its DNS to GitHub Pages (GitHub's *Settings →
   Pages → Custom domain* screen shows you the exact records to add) and
   it'll switch over automatically.

---

## 3. Setting up the Admin Dashboard

The admin dashboard lives at **`yourdomain.com/admin/`**. It's not linked from
the public site's navigation — bookmark it yourself.

### How it publishes content
There's no separate server or database — the dashboard talks directly to
**GitHub's API** and commits straight to your repo's `assets/data/news.json`
and `assets/data/new-members.json` files (and uploads any images you attach
into `images/news/` or `images/members/`). GitHub Pages then rebuilds the live
site automatically, usually within a minute or two of you hitting "Publish."

### One-time setup
1. **Tell me (or edit `assets/js/admin.js` yourself)** your real GitHub username/org
   and repo name — near the top of the file:
   ```js
   const REPO_OWNER = "pulsekfs";
   const REPO_NAME = "pulsekfs.github.io";
   const REPO_BRANCH = "main";
   ```
   Once these are set correctly, the admin login only ever asks for a
   password + a token — nothing else.
2. Go to **[github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)**
   while logged into an account with write access to the repo.
3. Create a **fine-grained personal access token**:
   - **Repository access:** "Only select repositories" → choose your Pulse repo.
   - **Permissions:** under "Repository permissions," set **Contents** to
     **Read and write**. Leave everything else as "No access."
   - Set an expiration you're comfortable with (you can always generate a new
     one later).
4. Copy the generated token (starts with `github_pat_...`) — you won't be able
   to see it again.
5. Open `yourdomain.com/admin/`, enter the password (default: `ImTheAdmin` —
   change it below) and paste in your token, then click **Log In**. The
   token is saved only in your browser's local storage — it's never sent
   anywhere except directly to GitHub.

### Changing the admin password
Open `assets/js/admin.js`, find this near the top:
```js
const ADMIN_PASSWORD = "ImTheAdmin";
```
Change it to whatever you like, then commit that change to GitHub like any
other file.

**Why there's no `.env` file:** this site has no server — GitHub Pages just
serves static files. A `.env` file only hides secrets on a server that runs
code privately; a static site ships every file straight to the browser, so
anything placed there (password *or* token) is visible to anyone who views
the page source. That's why the password is just a light front-door lock,
and the GitHub token — which only works if it has write access to your
specific repo — is the real thing standing between a random visitor and your
content. Don't share your token, keep it scoped to just this repo, and you
can revoke it instantly from GitHub's settings any time.

### Using the dashboard
- **Newspaper tab:** click "New Article" to publish a story — title, excerpt,
  full body, category, tags, optional cover image, and Featured/Pinned
  toggles. Saved articles show up on `news.html` immediately after GitHub
  Pages rebuilds, and the 3 most recent also show automatically on the
  homepage under "Latest News."
- **New Members tab:** click "Add Member" — name, committee, role, and photo.
  A verification ID is auto-suggested (editable) in the same
  `PULSE26-FIRSTNAME-LASTNAME` style as your existing team. New members
  appear in a dedicated "Newly Accepted Members" section on `team.html`, and
  their verification ID works in the certificate lookup tool too — all
  without touching the original 28 hardcoded profiles.
- **Homepage tab:** one toggle — "Show the big Apply Now banner." Turn it
  off once applications close for the season, and the big yellow banner
  disappears from the homepage. The "Join Us ⚡" button that lives
  permanently in the navbar (top-right, every page) is unaffected — that
  one's always there for anyone who wants to apply.

---

## 4. Notes

- The original `index.html` and `team.html` had some accidentally duplicated
  CSS blocks (the same rules repeated 2–3 times). These were deduplicated
  into `assets/css/main.css` — the result is byte-for-byte the same styling,
  just smaller and easier to maintain.
- Your existing 28 team member cards on `team.html` were left completely
  untouched — new members are additive, not a replacement.
