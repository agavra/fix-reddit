# FixReddit UX Loop — Coordination State

This file is the shared state for inspector/implementer subagents iterating on the
mobile Safari extension UX. Read it before acting; update it after acting.

## Project Quick Facts

- Repo: `/Users/agavra/dev/fix-reddit`
- Primary CSS: `Extension/Resources/reddit-mobile.css` (scope everything under `.fix-reddit-mobile`)
- Primary JS: `Extension/Resources/content.js`
- Build + screenshot pipeline (run from repo root):
  ```sh
  xcodebuild -project FixReddit.xcodeproj -target FixReddit -sdk iphonesimulator build 2>&1 | tail -5
  xcrun simctl install booted build/Debug-iphonesimulator/FixReddit.app
  xcrun simctl openurl booted "<URL>"
  sleep 4
  xcrun simctl io booted screenshot "<output.png>"
  ```
- Always run `node --check Extension/Resources/content.js` after editing JS.

## Goals — what "good" means

> **Mobile-first sizing rule of thumb.** Imagine you are a person holding an iPhone,
> reading on a couch with no glasses. The Safari URL bar text "old.reddit.com" is the
> calibration anchor — it's ~17px and matches Apple's iOS HIG body baseline. Anything
> smaller than the URL bar text feels squinty. **Err bigger, never smaller.** A user
> who feels the need to pinch-zoom = failure of this loop.
>
> Calibrated minimums — DO NOT GO BELOW WITHOUT EXPLICIT ORCHESTRATOR INSTRUCTION:
>
> | Element                                  | Min px | Target px |
> |------------------------------------------|--------|-----------|
> | Post title (listing)                     | 19     | 20–21     |
> | Body text / markdown / comment body      | 17     | 17–18     |
> | Tagline (sub · author · age · domain)    | 14     | 15        |
> | Score number (between vote arrows)       | 13     | 14        |
> | Buttons / pill links / nav links / login | 16     | 17        |
> | Header pagename / brand                  | 18     | 19–20     |
> | Toolbar button label / icon              | 14     | 15        |
>
> Line-height: 1.3 for titles, 1.5 for body, 1.4 for taglines. **All tap targets
> ≥44×44 px** per Apple HIG (the visible glyph can be smaller, but the clickable
> hit area must reach 44×44).
>
> **How to validate (relaxed).** The Safari URL bar text "old.reddit.com" is a
> rough anchor, NOT a hard floor. Post titles can be a touch smaller than the URL
> bar text — that's fine. They should NOT look dramatically smaller (e.g. half the
> size). Body text and tagline can be smaller than the URL bar by design. The real
> test: would a person on a couch with no glasses comfortably read this without
> pinching to zoom? If yes, ship it.

1. **Readable text without zooming.** Hit the calibrated table above. Sizes can be
   a touch under the URL bar text but not dramatically smaller.
2. **Tappable controls.** Vote arrows ≥44×44 hit target (HIG minimum). Triangle glyph
   itself can be ~14–16px but the clickable area must be 44×44. Comments link,
   subreddit, author all obvious links with ≥44px hit area.
3. **Working menu navigation.** From the front page, the user must be able to:
   - See and tap a Login link when logged out
   - See and tap a Logout link / username menu when logged in
   - Reach their inbox / profile / preferences
   The current CSS hides `#header-bottom-right` which kills this. Fix it.
4. **Visual hierarchy.** Title > tagline > body. Cards have breathing room. Listing rows
   feel scannable, not crammed.
5. **Floating toolbar (Top / Next / Info) stays useful and out of the way.** Don't cover
   content; current placement is OK but verify on long pages.
6. **Comments page works.** Comment threads readable, collapse/expand visible, indents
   not too deep on phone.
7. **Sidebar drawer works.** "Info" button reveals the sidebar; close button works.

## URLs to test each iteration

- Front page: `https://old.reddit.com/`
- Subreddit listing: `https://old.reddit.com/r/programming/`
- Comments page: pick the top post link from the listing
- Sidebar (open via Info button on front page after load)

## Screenshot naming

Save under `.claude/ux-loop/screenshots/` as `iter-<N>-<view>.png`.
Views: `frontpage`, `subreddit`, `comments`, `sidebar`.

## Known issues from baseline (iter 0)

See `screenshots/iter-0-*.png`.

- **MED**: Thumbnails at 68×56 are too small to be useful. Consider 84–96px.
- **MED**: Header `.pagename` shows "reddit" only; needs subreddit name visible plus
  account/menu access. (partially addressed iter-1: header-right now shows login/signup)
- **MED**: Cards have 8px vertical gap which makes the list feel like one block; need
  more separation or a visible divider.
- **LOW**: Floating right-rail (Top/Next/Info) labels are tiny (13px). Bump to 14–15px,
  use icons + labels.
- **LOW**: Tagline (subreddit · author · age) should sit clearly under the title with
  enough contrast.

## Iteration log

(append one line per iteration: what changed, what improved, what regressed)

- iter-0 (baseline): just took screenshots, no changes.
- iter-1: unhid `#header-bottom-right` (now flex row with 44px tap targets, login/signup
  visible); replaced sprite-based `.arrow` with CSS-triangle filled up/down (42px hit,
  voted state colored orange/blue); reduced body 20→17px, title 24→21px, md body 20→17px,
  tagline/flat-list/details 17→14px; widened vote column 42→48px so triangles are clearly
  spaced from titles. Build clean, all 4 views render correctly.
- iter-2: trimmed verbose login prose ("Want to join?…in seconds.") via `cleanHeaderRight`
  text-node walker in JS; restyled `a.login-required` as primary (filled blue)
  `Log in` + secondary (outlined) `Sign up` pills, 36px min-height. Rewrote `.pagename`
  via `rewritePagename` to read `reddit / r/<sub>` on subreddit/comments pages. Tightened
  vote column: midcol 48→44px, arrows 42→32px tall (still 44px wide hit target),
  triangles 12/16→10/14px, score 13→12px, removed gap so column hugs title. Card
  margin 8→12px + `box-shadow: 0 1px 2px rgba(15,23,42,0.06)` on `.thing.link`. Toolbar
  shrunk to 44px-wide vertical stack of 36px icon-only buttons (`↑`, `→`, `≡` with
  aria-labels), pinned to `bottom: 16px + safe-area`. Reduced body bottom padding
  220→180px to match the smaller toolbar. All three views verified — no content overlap,
  cards visibly separate, header pills compact.
- iter-3: typography bump per orchestrator-flagged calibration. Body 17→18px,
  title 21px (kept after a 20px try, bumped back to 21 to clearly exceed URL bar),
  `.md` body 17→18px (lh 1.55), tagline cluster 14→15px (lh 1.4), score 12→14px,
  pagename 17→19px, login/signup pills 14→17px font + 36→42px min-height,
  toolbar button base font 14→15px, `.thing` padding 10/8→12/10px for breathing
  room, `.arrow` height 32→44px so vote tap target is full 44×44 (glyph still
  centered). Verified screenshots: post titles now read visually equal-to-slightly
  larger than the Safari URL bar text "old.reddit.com" on frontpage and subreddit,
  helped by bold weight; tagline still clearly subordinate; comment body sits
  comfortable at 18px.
- iter-5: account controls relocated into the sidebar drawer. New JS
  `relocateAccountControls()` runs after `cleanHeaderRight` and `convertSidebar`,
  builds a `<section class="fix-reddit-account">` with row-style anchors (logged
  out: blue `Log in` primary + gray `Sign up` secondary; logged in: username,
  Inbox (with unread count when present), Preferences, Log out — logout
  intercepts click and submits the original `.logout` form). Section is
  inserted right after `.fix-reddit-sidebar-close`. JS adds
  `fix-reddit-account-relocated` class on `<html>`; CSS keys off it to
  `display:none` `#header-bottom-right`, collapsing the header to just the
  pagename. Existing pill styles left in place as a fallback if relocation
  fails. CSS adds `.fix-reddit-account` (column flex, gap 8px) + row variants
  (48px min-height, 17px font, 8px radius, calibrated colors per spec).
  Testing-only `?fixSidebar=1` query trigger added so the screenshot pipeline
  can capture the drawer state — gated to query param presence only. All three
  views verified: header clean (frontpage shows just `reddit`, subreddit shows
  `reddit / r/programming`), drawer opens with Log in primary on top, Sign up
  below, then the rest of the subreddit sidebar.
- iter-6: Reddit-app-inspired comment threads. Removed per-comment border/shadow
  card; comments now use a 3px colored left bar that cycles through 6 colors
  (indigo/sky/emerald/amber/red/violet) by ancestor depth. Depth is computed
  in JS by walking up `.comment` ancestors (mod 6) and applied as
  `data-fix-reddit-depth` on each `.comment`. The bar is applied both to the
  comment itself and to its `.child` block so nested replies inherit a fresh
  color one level down. Hidden the left vote `.midcol` inside `.commentarea`
  and let `.entry` stack vertically. `.tagline` restyled as the comment header
  (bold dark `a.author` 15px, dimmer 14px metadata) with a `[−]/[+]`
  `::before` toggle and a click handler that flips `fix-reddit-collapsed`
  (bails out if the click hits an `a/button/input/select/textarea`). Hidden
  the default cluttered `ul.flat-list` action row and injected a new
  `.fix-reddit-comment-actions` row containing the score (read from the now-
  hidden midcol) and a 36px-tall pill `Reply` link that proxies clicks to the
  original `.reply-button a` so the inline reply form still wires up. Removed
  the deprecated `.fix-reddit-collapse` button + its CSS. Renamed
  `observePromos()` to `observeDynamicContent()` so the MutationObserver also
  re-runs `improveCommentControls()` for lazy-loaded children. Verified on a
  busy `/r/programming` thread — six-color cycling left bar reads clearly,
  bodies sit at 18px, no left vote stripe, `[−]` affordance visible on every
  tagline. Frontpage unchanged.
- iter-4: visual polish. Thumbnails 68×56→84×72 with `border-radius: 6px` and
  `object-fit: cover` (also applied to inner `<img>`); listing grid for
  `.fix-reddit-has-thumbnail` updated to `44px / 1fr / 84px` with `column-gap: 8px`.
  Vote arrows resting color #9aa3b2→#374151 plus a #f3f4f6 rounded background on
  `.arrow.up`/`.arrow.down` (resting only — moded states keep their orange/blue
  tints). Toolbar buttons replaced with inline SVG icons (chevron-up, chevron-right,
  hamburger) at 18×18 stroked #fff; `makeIconButton` now takes innerHTML.
  `.thing` padding 12/10→14/12 and `.link .title { margin-bottom: 6px }` for
  breathing room between title and tagline. Build clean; SVGs render crisply on
  all three views; vote arrows visibly more confident; thumbnails look like real
  previews instead of postage stamps.

## Active findings (work queue)

Inspector writes here, implementer drains. One bullet = one focused change.
Mark `[done]` once the implementer addresses it. Re-add if regressed.

- [done] **MED**: Header right invite prose trimmed to pill buttons.
- [done] **MED**: `.pagename` rewritten to `reddit / r/<sub>` on SR/comments pages.
- [done] **LOW**: Vote column tightened (44px wide, 32px arrows, no extra gap).
- [done] **MED**: Card separation bumped to 12px + subtle shadow.
- [done] **LOW**: Toolbar redesigned as 36px icon stack (↑ → ≡), bottom-right.
- [done] **MED**: Header right may still wrap onto its own row in some viewports —
  resolved iter-5 by hiding `#header-bottom-right` entirely and relocating its
  contents into the sidebar drawer.
- [done] **NEW (iter-5)**: Move `Log in` / `Sign up` (and logged-in account
  controls) out of the header into the sidebar drawer. Header collapses to
  pagename-only. Account section sits at the top of the drawer.
- [done] **MED**: Thumbnails bumped 68×56→84×72 with rounded corners, applied to
  inner `<img>` too. Listing grid widened to 84px column with 8px gap.
- [done] **LOW**: Toolbar now uses inline SVG icons (chevron-up, chevron-right,
  hamburger) stroked white on dark buttons. `makeIconButton` accepts innerHTML.
- [ ] **LOW**: When logged in, `.user`/inbox styling not yet specifically verified
  in screenshot (sim is logged out). Verify on a logged-in test account or via
  CSS-only inspection that the `user-logged-in` branch reads cleanly. (iter-5
  added a logged-in branch in `relocateAccountControls` building user/inbox/
  prefs/logout rows, but still no live screenshot of that state.)
- [ ] **LOW**: On the front page, `.pagename` reads just "reddit" with no path
  context. Acceptable since user IS on the home page, but could indicate the
  feed type (e.g. "reddit / front") for symmetry. Low priority.
- [ ] **LOW**: Comments page: post card vote column on long posts (e.g. self-posts)
  may still cause visual stripe on the right of the title because midcol now
  align-self:start — verify on a tall self-post permalink.
- [done] **HIGH (iter-6)**: Comment threads re-shaped to Reddit-app style.
  Cycling 6-color left bar by depth, hidden left vote column, bold username
  header with tap-to-collapse `[−]/[+]` affordance, inline Reply pill,
  per-comment border/shadow removed.
- [ ] **LOW (iter-6)**: Voting on comments is non-functional — `Reply` is the
  only action surfaced. Up/down arrows omitted this iteration since old reddit
  voting requires a CSRF-token form post; revisit if user wants in-thread
  voting.
- [ ] **LOW (iter-6)**: Tagline `a.author` and `time` color overrides may not
  catch deleted/`[deleted]` placeholders or distinguished mod/op flairs (still
  inherit default reddit colors). Verify on a thread with `[OP]`/`[M]` tags.
- [ ] **LOW**: Floating toolbar at right:10px, bottom:16px+safe-area sits inside
  the safari bottom bar's safe area — confirm it doesn't end up under the URL bar
  on devices where the URL bar is taller (iPhone SE etc.).
- [done] **HIGH (orchestrator-flagged)**: typography bump applied iter-3. Body
  17→18, title 20→21, md 17→18, tagline 14→15, score 12→14, pagename 17→19,
  login pills 14→17 + 42px min-height, toolbar 14→15. Screenshots verified —
  titles read visually ≥ URL bar text. `.thing` padding 10/8→12/10 and `.arrow`
  height 32→44 so vote tap target is full 44×44.

## Done / shipped

- iter-1: `#header-bottom-right` unhidden, styled with 44px-min tap targets, flex-wrap,
  login/logout/inbox visible.
- iter-1: vote arrows rendered via CSS border triangles (filled up/down), 42px hit
  target, voted state colored (orange up, blue down), score readable between.
- iter-1: body 20→17px, title 24→21px, md body 20→17px, tagline cluster 17→14px;
  proportional line-heights.
- iter-2: header-right login prose stripped via JS text-node walker; `Log in`/`Sign up`
  rendered as primary/secondary pills (36px).
- iter-2: `.pagename` rewritten to `reddit / r/<sub>` via JS pathname parse.
- iter-2: vote column tightened (midcol 44px wide, arrows 32px tall, triangles
  10/14px, score 12px, no inter-element gap, align-self:start).
- iter-2: cards: margin-bottom 8→12px, `box-shadow: 0 1px 2px rgba(15,23,42,0.06)`
  on `.thing.link`.
- iter-2: floating toolbar shrunk to 44px-wide vertical stack of 36px icon buttons
  (`↑` Top, `→` Next, `≡` Info) with `aria-label`s; pinned bottom-right at 16px +
  safe-area-inset. Body bottom padding 220→180px.
- iter-3: typography calibrated to URL-bar reference. Body 18px, title 21px,
  `.md` 18px (lh 1.55), tagline cluster 15px (lh 1.4), `.midcol .score` 14px,
  `.pagename` 19px, login/signup pills 17px @ 42px min-height, toolbar buttons
  base 15px. `.thing` padding 12px 10px for breathing room. `.arrow` 44×44 hit
  target (was 44×32) — full HIG minimum confirmed.
- iter-5: account controls relocated. JS `relocateAccountControls` reads
  login/register links (logged-out) or user/inbox/logout (logged-in) from
  `#header-bottom-right` and rebuilds them as a stack of `.fix-reddit-account-row`
  anchors inside `.side`, just below `.fix-reddit-sidebar-close`. `<html>` gets
  `fix-reddit-account-relocated`; CSS hides `#header-bottom-right`. Logged-out
  rows: blue `Log in` (primary, font-weight 600), gray `Sign up`. Logged-in
  rows: white with bottom-border separators; unread inbox styled with #eff6fc
  background + #0079d3 text; logout in #dc2626 red. Section uses 48px min-height
  rows / 17px font / 8px radius / 12px horizontal padding per the calibrated
  sizing table. `?fixSidebar=1` query trigger added (testing only) so the
  screenshot pipeline can capture the drawer state on load.
- iter-4: thumbnails 68×56→84×72 with `border-radius: 6px`, listing grid
  `44px / 1fr / 84px` with `column-gap: 8px`, applied `object-fit: cover` to
  inner `<img>` so thumbnails fully fill the frame. Vote arrows resting color
  #9aa3b2→#374151 plus #f3f4f6 rounded-square background on resting `.arrow.up`/
  `.arrow.down` (moded states keep orange/blue). Toolbar ASCII glyphs replaced
  with inline SVG icons (chevron-up, chevron-right, hamburger) at 18×18 stroked
  #fff; `makeIconButton` switched to `innerHTML`. `.thing` padding 12/10→14/12
  and `.link .title` `margin-bottom: 6px` for tagline breathing room.

## Notes for subagents

- **Inspector role**: build is already done by the implementer. You read screenshots,
  compare against goals, write/refresh the "Active findings" list with concrete CSS/JS
  selectors when possible. Be specific (e.g., "`.arrow` is 34px, bump to 44px and
  ensure background-image isn't clipped").
- **Implementer role**: pick the highest-priority unchecked finding(s), make the
  smallest CSS/JS change that addresses it, build, install, screenshot all four views,
  save them with this iteration's number, append to the iteration log, mark findings
  `[done]`. Don't introduce new abstractions. Keep CSS scoped under `.fix-reddit-mobile`.
- **Both**: never commit. Never push. The orchestrator (main agent) decides when
  iteration stops.
