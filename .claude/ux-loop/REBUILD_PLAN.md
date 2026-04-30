# FixReddit Rebuild — Implementation Plan

This document is the single source of truth for the **rebuild** of FixReddit's mobile UX
on top of `old.reddit.com`. Subagents pick up phases from the **Phase Status Board** at
the bottom, mark them `in_progress`, ship them, mark `done`. Read this whole file before
starting any phase. Update the status board on every state change.

> Companion file: `.claude/ux-loop/STATE.md` is the loop's coordination state from the
> earlier patch-on-top approach (iter-0..iter-6). Treat it as historical context for
> sizing, look-and-feel decisions, and known good values. Do not regress those calls.

---

## Decision (locked)

**Hybrid rebuild.** Parse old.reddit's served HTML for *data* (title/score/comments/
account/CSRF tokens). Render our own layout from first principles. Keep original
`<form>` elements + hidden inputs in the DOM so vote/reply/login still work — our
buttons trigger them, we don't re-implement auth.

The current patch approach (`reddit-mobile.css` + `content.js`) stays in tree as a
fallback; the rebuild ships behind a class on `<html>` and the patch CSS is gated to
only apply when the rebuild is OFF.

---

## Architecture

```
old.reddit page loads
  └── content_scripts inject (manifest.json):
       ├── fr-bootstrap.js    entry: detect host, decide rebuild vs fallback
       ├── fr-parser.js       pure: DOM → models
       ├── fr-render.js       pure-ish: models → our DOM
       ├── fr-actions.js      glue: our buttons → original forms
       └── fr-app.css         our layout, design tokens, components

When rebuild is ON:
  1. fr-bootstrap reads <html>, <body>, original <form>s into memory + hides them.
  2. fr-parser builds Models from the original DOM.
  3. fr-render mounts <div id="fr-app"> and paints from the Models.
  4. fr-actions wires our buttons to the (hidden) original forms.
  5. MutationObserver re-parses + re-renders on lazy content (comments, "load more").
```

**Rebuild on/off toggle.** `<html>` gets class `fr-rebuild` when rebuild is active.
All new CSS keys off `.fr-rebuild`. Existing `.fix-reddit-mobile` rules keep working
for fallback — but Phase 0 adds `.fr-rebuild` as an additional class so users either
get the rebuild OR the patch, never both.

---

## File layout

| File                                         | Owner phase | Purpose                                  |
|----------------------------------------------|-------------|------------------------------------------|
| `Extension/Resources/manifest.json`          | Phase 0     | Register new content_scripts             |
| `Extension/Resources/fr-bootstrap.js`        | Phase 0     | Mount, observe, orchestrate              |
| `Extension/Resources/fr-parser.js`           | Phase 1     | DOM → models                             |
| `Extension/Resources/fr-render.js`           | Phase 2/3/4 | Models → our DOM                         |
| `Extension/Resources/fr-actions.js`          | Phase 2/3/4 | Wire our UI to original forms            |
| `Extension/Resources/fr-app.css`             | Phase 0+    | Design tokens + components               |
| `Extension/Resources/content.js`             | (existing)  | Patch fallback; gate behind `:not(.fr-rebuild)` |
| `Extension/Resources/reddit-mobile.css`      | (existing)  | Patch fallback; gate behind `:not(.fr-rebuild)` |

`fr-render.js` may be split per-section (`fr-render-listing.js`, etc.) at the
implementer's discretion if files grow past ~400 lines.

---

## Design tokens (calibrated, locked)

These match `STATE.md` typography agreements. Define them once as CSS custom
properties on `:root` in `fr-app.css`. Do not re-derive sizes per component.

```css
:root {
  /* Typography */
  --fr-font-body:   17px;   /* base body, comments body */
  --fr-font-title:  20px;   /* listing post title */
  --fr-font-meta:   15px;   /* tagline: subreddit, author, age, domain */
  --fr-font-small:  14px;   /* score, secondary metadata */
  --fr-font-button: 17px;   /* pills, primary actions */
  --fr-font-brand:  19px;   /* header pagename / brand */
  --fr-lh-tight:    1.32;
  --fr-lh-body:     1.5;
  --fr-lh-meta:     1.4;

  /* Spacing (4-pt grid) */
  --fr-s-1: 4px;  --fr-s-2: 8px;  --fr-s-3: 12px;
  --fr-s-4: 16px; --fr-s-5: 20px; --fr-s-6: 24px;

  /* Radius */
  --fr-r-card: 10px;  --fr-r-pill: 999px;  --fr-r-input: 8px;

  /* Hit target */
  --fr-tap: 44px;

  /* Color (light) */
  --fr-bg:        #f6f7f8;
  --fr-surface:   #ffffff;
  --fr-border:    #e5e7eb;
  --fr-text:      #111827;
  --fr-text-dim:  #6b7280;
  --fr-link:      #0079d3;
  --fr-up:        #ff4500;
  --fr-down:      #7193ff;
  --fr-danger:    #dc2626;

  /* Thread bar palette (cycle by depth %6) */
  --fr-th-0: #4f46e5; --fr-th-1: #0ea5e9; --fr-th-2: #10b981;
  --fr-th-3: #f59e0b; --fr-th-4: #ef4444; --fr-th-5: #8b5cf6;
}
```

**Tap target rule.** Any interactive element ≥ `--fr-tap` (44×44) clickable area.
Visible glyph may be smaller; pad the element to reach 44.

**URL bar anchor.** Post titles must read close to (within ~2px of) Safari URL bar
text size. Body text can be slightly smaller. See `STATE.md` for the relaxed rule.

---

## Coordination protocol

1. Open this file. Find the **Phase Status Board** at the bottom.
2. Pick the lowest-numbered phase whose `Status` is `not_started` and whose `Depends`
   are all `done`. If none, pick the lowest `in_progress` and resume.
3. Edit the row to `in_progress`, set your owner agent ID, append a one-line note.
4. Read the phase's full section (above the board) and any phases it depends on.
5. Implement. Stay inside the **Public surface** declared by the phase — do not
   reach into other phases' internals.
6. Verify against the phase's **Acceptance criteria** + **Test plan**.
7. Update phase row to `done` with a one-line summary of what shipped. Update any
   downstream phases whose context changed.
8. Return a ≤ 200-word report. Stop. Do not chain into the next phase unless the
   orchestrator asked you to.

**Hard rules:**

- Never commit, never push.
- Keep all CSS scoped under `.fr-rebuild` (or use CSS custom property values from
  the locked tokens).
- All new JS in IIFEs or modules — do not pollute global window.
- All UI text is in English literals for now (no i18n in this rebuild).
- Do not delete the patch fallback (`reddit-mobile.css` / `content.js`). Gate them.
- Original `<form>` elements move into a `<div id="fr-vault" hidden>` — they must
  remain in the DOM so CSRF tokens stay valid for vote/reply/login.

---

## Build & screenshot pipeline

```sh
# from repo root
xcodebuild -project FixReddit.xcodeproj -target FixReddit -sdk iphonesimulator build 2>&1 | tail -5
xcrun simctl install booted build/Debug-iphonesimulator/FixReddit.app
xcrun simctl openurl booted "<URL>"
sleep 5
xcrun simctl io booted screenshot ".claude/ux-loop/screenshots/rebuild-phase-<N>-<view>.png"
```

After every JS edit: `node --check Extension/Resources/<file>.js`.

Test URLs:

- Front page:    `https://old.reddit.com/`
- Subreddit:     `https://old.reddit.com/r/programming/`
- Comments:      pull a real permalink via
  ```sh
  curl -sA "Mozilla/5.0" "https://old.reddit.com/r/programming/top.json?limit=1&t=week" \
    | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); \
               console.log('https://old.reddit.com'+j.data.children[0].data.permalink)"
  ```
- Drawer test:   append `?frDrawer=1` (Phase 0 wires this debug flag)
- Login page:    `https://old.reddit.com/login`

---

## Phases

### Phase 0 — Scaffolding & bootstrap

**Goal.** Mount our shell, hide original DOM, set up the rebuild toggle. After this
phase the page renders an empty `<div id="fr-app">` shell + a "rebuild active" badge
for sanity-check, with old DOM tucked into `#fr-vault`.

**Files.** `manifest.json`, `fr-bootstrap.js`, `fr-app.css`. Touch `content.js` and
`reddit-mobile.css` only to gate them.

**Public surface.**

```js
// fr-bootstrap.js exports (via window.__fr namespace OR module export)
window.__fr = {
  vault:    HTMLElement,        // the hidden original DOM container
  app:      HTMLElement,        // our mount point <div id="fr-app">
  observe:  (callback) => Disposable, // re-run on Reddit DOM mutations
  flags:    { drawer: bool },   // parsed from URL ?fr* params
};
```

**Implementation notes.**

- Run only on `old.reddit.com`. Bail on other hosts (existing redirect logic stays in
  `content.js`).
- On DOMContentLoaded: take `document.body` children, wrap in `<div id="fr-vault"
  hidden>`, append our `<div id="fr-app">` after it.
- Add `fr-rebuild` class on `<html>`. Existing `.fix-reddit-mobile` selector remains
  but its rules must be gated to `:not(.fr-rebuild)`.
- Parse `location.search` for debug flags: `frDrawer=1`, `frFallback=1` (when
  `frFallback=1`, do NOT add `fr-rebuild` and let the patch path run instead).
- Manifest: add new resources to `content_scripts.js` array AND
  `web_accessible_resources` if needed; verify with `find
  build/Debug-iphonesimulator/FixReddit.app/PlugIns/FixRedditExtension.appex` after
  build.

**Acceptance.**

- Build clean. Page loads, no console errors.
- `<html>` has class `fr-rebuild`.
- `#fr-vault` exists and is hidden; original markup is inside it.
- `#fr-app` exists and shows a placeholder ("FixReddit rebuild active").
- `?frFallback=1` reverts to the patch UI exactly as it was at iter-6.

**Depends.** —

---

### Phase 1 — Data parsers

**Goal.** Pure functions that turn old.reddit's DOM into typed-ish models. No
rendering. No DOM mutation outside reading. All consumers in later phases use these
models.

**Files.** `fr-parser.js`.

**Public surface.**

```js
// All input: HTMLElement (typically the #fr-vault subtree)
// All output: plain objects, no DOM references except where noted

parseUser(root) -> {
  loggedIn: bool,
  username: string | null,
  inboxUnread: number,        // 0 if logged out
  csrfToken: string | null,   // from any modhash-bearing form
  loginUrl: string,           // from <a class="login-required" href=...>
  registerUrl: string,
  logoutForm: HTMLFormElement | null,    // keep ref; submit it for logout
  preferencesUrl: string,
}

parseListing(root) -> {
  pagename: string,           // "reddit" | "r/programming"
  posts: Post[],
  nextPageUrl: string | null,
  prevPageUrl: string | null,
}

Post = {
  id: string,                 // thing_t3_xxx
  title: string,
  url: string,                // outbound link or self permalink
  permalink: string,          // /r/.../comments/...
  author: string,
  subreddit: string,          // "programming"
  ageText: string,            // "3 hours ago"
  score: number | null,       // null when score hidden
  commentCount: number,
  domain: string,             // "self.programming" | "github.com"
  thumbnail: string | null,   // resolved URL or null
  isSelf: bool,
  isNsfw: bool,
  flair: string | null,
  voteForm: { up: HTMLFormElement, down: HTMLFormElement } | null,
}

parseComments(root) -> {
  post: Post,                 // the OP card
  sortOptions: { value: string, label: string, selected: bool }[],
  comments: CommentNode[],
  loadMoreUrl: string | null,
}

CommentNode = {
  id: string,
  author: string,
  ageText: string,
  score: number | null,       // null when collapsed-by-score / [score hidden]
  body: string,               // pre-rendered HTML from .usertext-body, trusted from old.reddit
  permalink: string,
  voteForm: { up: HTMLFormElement, down: HTMLFormElement } | null,
  replyUrl: string,
  flairs: string[],           // OP, MOD, etc.
  children: CommentNode[],
  depth: number,              // 0-based, capped at... no cap; renderer caps visually
  loadMoreUrl: string | null, // for "load more comments" stubs
}
```

**Implementation notes.**

- Parsers receive the `#fr-vault` subtree. They must not mutate it — they may hold
  references to specific `<form>` elements for later submission via `fr-actions`.
- For each model, prefer reading multiple selector fallbacks (Reddit's classes
  occasionally drift). E.g. age: `time[datetime]` first, then `.live-timestamp` text.
- Score: parse `.score.unvoted` text; "•" or "score hidden" → `null`.
- CSRF (`modhash`): read from `input[name="uh"]` in any form; cache on first hit.
- Self-test in development: when `?frDebug=1`, console.log a summary of what was
  parsed (post count, logged-in-or-not, sample CommentNode).

**Acceptance.**

- Loading the front page, `parseListing(__fr.vault)` returns a plausible list of
  ≥ 20 posts with non-empty `title`, `permalink`, `score` for most.
- A real comments page yields a `CommentNode` tree with depth >= 3 somewhere.
- `parseUser` correctly reports `loggedIn: false` on a fresh sim and finds login URL.
- No exceptions on edge pages (deleted users, removed posts, NSFW-gated subs).

**Depends.** Phase 0.

---

### Phase 2 — Listing renderer

**Goal.** First visible win. Render our own listing UI from `Post[]`. Wire votes
and "open comments" through to the original forms / permalinks.

**Files.** `fr-render.js` (or `fr-render-listing.js`), `fr-actions.js`, `fr-app.css`.

**Public surface.**

```js
renderListing(model: ListingModel, mountInto: HTMLElement) -> Disposable
```

**Layout (per card).**

```
┌─────────────────────────────────────────────┐
│  ⏶                                          │
│ score   [thumb]  Title (20px, bold)         │
│  ⏷              r/sub · u/author · 3h · domain │
│                 ⌃  142  ⌄    💬 124    ⋯    │
└─────────────────────────────────────────────┘
```

- Card is `<article class="fr-card">`. Click anywhere outside the action row /
  thumbnail / vote arrows opens the permalink. (Mirrors current iter-6 behavior.)
- Vote arrows on the LEFT, score between, all 44×44 hit area, 16px glyph. Color on
  voted state (orange up, blue down). Tapping triggers `fr-actions.castVote(post,
  'up'|'down'|'unvote')` which submits the original form via `fetch` with
  `credentials: 'include'` and updates score optimistically. Failure: revert.
- Thumbnail: 84×72, rounded, lazy-loaded. Self-posts get a light "TEXT" tile;
  link posts show the image; NSFW gets a blurred tile with NSFW chip.
- Tagline row: `r/sub` + `u/author` + age + domain. Each is a link; small (15px),
  dim color. ≥ 36px tap area each (use padding, not size).
- Action row: comments link with count, share/save behind a `⋯` overflow (overflow
  is non-functional in v1; just renders a button placeholder).
- Pagination: render at the bottom. "Next" is a primary pill button; "Prev" is text
  link.

**Acceptance.**

- Front page lists ≥ 20 cards, scrollable smoothly.
- Tapping a card title or empty area navigates to permalink.
- Tapping vote arrow toggles voted state visually; score updates. (Functional vote
  may be deferred ONLY if Phase 1 didn't capture form refs; in that case still
  render arrows but log a warning.)
- Tapping `r/sub`, `u/author`, or domain navigates correctly without triggering the
  card's open-comments handler.
- Visual: titles ~ URL bar text size, tagline 15px, action row icons crisp.

**Depends.** Phase 0, Phase 1.

---

### Phase 3 — Header + drawer (account + nav)

**Goal.** Our own header at top, our own slide-in drawer for account + nav.
No login/sign-up pills in the header — those live in the drawer (per iter-5).

**Files.** `fr-render.js` (or `fr-render-chrome.js`), `fr-app.css`.

**Header.**

```
┌─────────────────────────────────────────┐
│ ☰   r / programming           🔍   👤  │
└─────────────────────────────────────────┘
```

- Sticky, 52px tall, white surface, 1px bottom border.
- Left: drawer trigger (`☰` SVG, 44×44).
- Center: `r / <subreddit>` — link to subreddit root. Front page shows `reddit`.
- Right: search trigger (opens drawer scrolled to search) + account trigger
  (opens drawer scrolled to account section). When logged-in with unread inbox,
  show a red dot on the account icon.

**Drawer.**

- Slide-in from right, `min(92vw, 380px)` wide. Backdrop scrim with 0.4 opacity
  black, dismiss on tap.
- Sections, top to bottom:
  1. **Account** (logged-out: primary `Log in` row + secondary `Sign up` row;
     logged-in: username row → profile, `Inbox (N)` row, `Preferences`, `Log out`
     in danger color).
  2. **Search**: `<input>` styled tall (48px), submits to `/search?q=...` (or
     to subreddit-scoped search if currently on a subreddit page).
  3. **Navigation**: `Front`, `Popular`, `All`, `Saved` (logged-in only),
     `Submitted` (logged-in only). Each row 48px tall.
  4. **Subreddit info** (only on subreddit/comments pages): subscribers count,
     online count, description. Pulled from old.reddit's `.side` markup.
- All rows are `<a>` not `<button>` so iOS preserves tap-to-open semantics.
- Logout is a `<button>` that POSTs the `logoutForm` from `parseUser`.

**Acceptance.**

- Header shows `r / programming` on a subreddit page, `reddit` on front page.
- Tapping `☰` opens the drawer; tapping scrim or close dismisses.
- Drawer Account section reflects login state correctly (sim is logged out — see
  `Log in` blue + `Sign up` gray).
- Search submits and lands on results page.
- `?frDrawer=1` opens the drawer on load (preserved from Phase 0).

**Depends.** Phase 0, Phase 1.

---

### Phase 4 — Comment thread renderer

**Goal.** Render comment threads with the Reddit-app-inspired treatment we landed
in iter-6 — but native to the rebuild, no `!important`, clean DOM.

**Files.** `fr-render.js` (or `fr-render-comments.js`), `fr-actions.js`,
`fr-app.css`.

**Per-comment layout.**

```
┌─────────────────────────────────────
│ [bar]  username · 142 pts · 3h           [−]
│ [bar]
│ [bar]  body text at 17px, line-height 1.5,
│ [bar]  proper paragraph spacing.
│ [bar]
│ [bar]  ⌃ 142 ⌄    Reply        ⋯
└─────────────────────────────────────
   (children indented 8px under, with next color in cycle)
```

- Left bar: 3px wide, color cycles by depth %6 from `--fr-th-0..5`.
- Username: bold, dark, 15px.
- Metadata after username: dim, 14px.
- `[−]` / `[+]` toggle on the right of the header — tap header (excluding inner
  links) to collapse. Collapsed state hides body, action row, and children.
- Body: 17px, line-height 1.5. Trust `body` HTML from `parseComments` (it came
  from `.usertext-body` which old.reddit already sanitizes for markdown→HTML).
- Inline action row: vote up + score + vote down, then Reply pill, then `⋯`.
  Vote uses `fr-actions.castVote`. Reply for v1 navigates to the old reply URL
  (`?context=...&reply=...`); a true inline reply form is out of scope for the
  rebuild's first cut — log it as a follow-up.
- "Load more comments" stubs render as a full-width tappable row.

**OP card on comments page.**

- Render at top: post title (24px), author/sub/age/domain, body (if self-post) or
  link card (if link post), score + vote arrows, comment count, sort dropdown.
- Sort dropdown reads `parseComments.sortOptions` and on change navigates to the
  selected URL.

**Acceptance.**

- Permalink page renders with OP card at top, comment tree below.
- Bars cycle through 6 colors visibly.
- Tap header collapses; tap again expands; `[−]`/`[+]` reflects state.
- Voting on a comment toggles UI optimistically; score updates.
- Reply tap navigates correctly.
- Body markdown renders (lists, code blocks, blockquotes) without horizontal
  overflow.

**Depends.** Phase 0, Phase 1.

---

### Phase 5 — Floating toolbar + cross-cutting polish

**Goal.** Bring back the Top / Next / Info utility, add small affordances we know
help (sticky sort on comment pages, "back to top" autoshow), audit accessibility.

**Files.** `fr-render.js`, `fr-app.css`, `fr-actions.js`.

**Floating toolbar.**

- Bottom-right vertical stack of 36px circular buttons:
  - `Top` (chevron up)
  - `Next` (chevron right) — listing pages only; hidden on comment pages
  - `Menu` (`☰`) — opens drawer (same as header trigger; provides reach with one
    thumb at the bottom of the screen)
- Auto-hide on scroll up; reveal on scroll down or when stationary > 1s. Implement
  with `IntersectionObserver` on a sentinel near the top.

**Polish.**

- Skeleton loaders for the 200ms gap between mount and parse complete.
- Focus rings on keyboard nav.
- `prefers-color-scheme: dark` — define a parallel set of color tokens; flip on
  `<html>` class `fr-dark` which is set from the media query.
- Verify VoiceOver: every interactive element has `aria-label` if its content
  is icon-only. Vote buttons announce up/down/voted.
- Reduce `padding-bottom` on `<body>` only by toolbar height + safe-area; compute
  from CSS, not hardcoded.

**Acceptance.**

- Toolbar visible on listing & comments. Auto-hide on scroll feels right (try in
  sim, screenshot before + during scroll).
- Dark mode renders without contrast violations on every component.
- Tab order is logical on each view.

**Depends.** Phase 2, Phase 3, Phase 4.

---

### Phase 6 — Edge cases & QA

**Goal.** Audit the corners and either handle or explicitly mark "out of scope" in
this file.

**Files.** As needed across `fr-*` files.

**Audit list (handle each: support / degrade / explicitly skip).**

| Case                                         | Required behavior                                  |
|----------------------------------------------|----------------------------------------------------|
| NSFW listing card                            | blurred thumb + "Show NSFW" tap-to-reveal          |
| NSFW interstitial subreddit page             | render warning + "Continue to r/X" button          |
| Logged-in OP / mod tagline flair             | OP green chip, MOD gold chip                       |
| Stickied posts                               | green pin icon, top of listing                     |
| Promoted (ad) posts                          | hide entirely (already removed by patch's promo cleanup) |
| Self-post body in listing                    | not shown in card (only on permalink) — preview snippet OK |
| Gallery posts (multi-image)                  | first image as thumb + "🖼 N" badge                |
| Polls                                        | render question + options, link to permalink to vote |
| Crosspost cards                              | render origin sub + nested title; no recursion     |
| Quarantined sub warning                      | render the gate + "I understand" pass-through      |
| Banned / private sub                         | render the message; suggest going to /r/all       |
| 404 pages                                    | render the 404; offer back-to-front-page link     |
| "Load more comments" link                    | renders as full-width row; tap navigates         |
| Deleted user / [deleted] body                | render with muted style                           |
| Edited timestamp                             | show "edited Xh ago" next to age                  |

**Acceptance.**

- Each row above has either a screenshot saved under
  `.claude/ux-loop/screenshots/rebuild-phase-6-<case>.png` OR a one-line
  "explicitly out of scope" note here.

**Edge case status:**

| Case                                 | Status                                                |
|--------------------------------------|-------------------------------------------------------|
| NSFW listing card                    | thumb shows red NSFW chip; tap-to-reveal deferred (out of scope v1) |
| NSFW interstitial subreddit page     | falls through to `renderUnparseable` empty card       |
| Logged-in OP / mod tagline flair     | `.fr-c-flair-op/mod/admin` chips wired in renderer    |
| Stickied posts                       | green left border on `.fr-card-stickied` ✓            |
| Promoted (ad) posts                  | filtered in `parseListing` (skips data-promoted=true) |
| Self-post body in listing            | not shown on card; full body on permalink ✓           |
| Gallery posts                        | first-image thumb + image badge `.fr-thumb-badge` ✓   |
| Polls                                | render falls through to permalink (out of scope v1)   |
| Crosspost cards                      | render as a normal card; nested origin not unwrapped (out of scope v1) |
| Quarantined sub warning              | `renderUnparseable` shows the gate text ✓             |
| Banned / private sub                 | `renderUnparseable` shows message + Back to home      |
| 404 pages                            | `renderUnparseable` ✓ (verified via screenshot)       |
| Load more comments link              | full-width tappable row, navigates ✓                  |
| Deleted user / [deleted] body        | `.fr-comment-deleted` muted italic styling ✓          |
| Edited timestamp                     | parser appends "edited Xh ago" to ageText ✓           |

**Depends.** Phase 2, Phase 3, Phase 4, Phase 5.

---

## Phase status board

> Columns: `Phase | Status | Owner | Notes`. Statuses: `not_started`, `in_progress`,
> `done`, `blocked`. Update on every claim, finish, and unblock.

| Phase | Status      | Owner | Notes                                                  |
|-------|-------------|-------|--------------------------------------------------------|
| 0     | done        | main  | Vault wraps original DOM, #fr-app mounts, flags wired  |
| 1     | done        | main  | parseUser/Listing/Comments verified via frDebug surface|
| 2     | done        | main  | Cards: votes, thumbs, flair, tagline, action row       |
| 3     | done        | main  | Sticky header + slide-in drawer w/ account/nav/search  |
| 4     | done        | main  | OP card + cycling-bar comments w/ collapse + reply     |
| 5     | done        | main  | Toolbar (Top/Next/Menu) + auto-hide + dark mode tokens |
| 6     | done        | main  | Deleted/edited handled, unparseable pages have empty card |

---

## Out of scope for v1 (explicit non-goals)

- Inline reply composer (link out to old reddit's reply page is acceptable).
- Inline edit / delete of user's own comments.
- Awarding / coins / premium UI.
- Real-time vote / comment streams.
- Multireddits, custom feeds.
- New reddit (`www.reddit.com`) — we still redirect to `old.reddit.com`.
- Native iOS share sheet integration (use page-level share if needed).

When in doubt, render a minimal placeholder + log a warning. Do not crash the page.
