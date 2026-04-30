# Agent Notes

This repository is a Firefox WebExtension (Manifest V3). All shipping code lives
under `src/`.

## Core Workflow

1. Edit source files under `src/`.
2. Run lightweight checks:

   ```sh
   node --check src/content.js
   node --check src/background.js
   node -e "for (const f of ['src/manifest.json','src/rules.json','src/_locales/en/messages.json']) JSON.parse(require('fs').readFileSync(f, 'utf8'))"
   npx web-ext lint --source-dir=src
   ```

3. Run a dev browser with the extension loaded:

   ```sh
   npx web-ext run --source-dir=src
   ```

## Important Files

- `src/reddit-mobile.css`: primary mobile layout and typography.
- `src/content.js`: post navigation, promo removal, toolbar, comment controls,
  page shims.
- `src/rules.json`: DNR redirect and User-Agent rewrite rules.
- `src/manifest.json`: extension permissions and resource declarations.

## UX Baseline

The current target experience is a dense mobile reader:

- No Reddit mobile app banner.
- No signup splash block.
- Listing cards are compact and tappable.
- Tapping a card opens comments.
- Explicit links/buttons keep their normal behavior.
- A narrow floating right rail provides `Top`, `Next`, and `Info`.

Do not reintroduce full-width floating toolbars or large repeated action
buttons in the feed unless explicitly requested.

## Editing Constraints

- Keep CSS scoped under `.fix-reddit-mobile`.
- Avoid broad DOM deletion in `content.js`; remove only promo-shaped nodes.
- Preserve normal click behavior for anchors, buttons, form controls, vote
  arrows, thumbnails, media, and expandos.
- Reddit can still infer mobile from viewport width, cookies, or server-side
  experiments. The extension therefore both spoofs desktop signals and removes
  mobile/app promo UI.
- Old Reddit markup is stable but it is not an API. Keep selectors broad enough
  to tolerate minor class changes.
