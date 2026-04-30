# Agent Notes

This repository contains a generated Xcode project for an iOS Safari Web
Extension. Treat `project.yml` as the source of truth for target structure
and resource copying. Web extension source lives under `src/`.

## Core Workflow

1. Edit source files.
2. Run lightweight checks:

   ```sh
   node --check src/content.js
   node --check src/background.js
   node -e "for (const f of ['src/manifest.json','src/rules.json','src/_locales/en/messages.json']) JSON.parse(require('fs').readFileSync(f, 'utf8'))"
   plutil -lint FixReddit/Info.plist Extension/Info.plist
   ```

3. Build:

   ```sh
   xcodebuild -project FixReddit.xcodeproj -target FixReddit -sdk iphonesimulator build
   ```

4. For UX work, install into the booted simulator and screenshot:

   ```sh
   xcrun simctl install booted build/Debug-iphonesimulator/FixReddit.app
   xcrun simctl openurl booted https://old.reddit.com/
   xcrun simctl io booted screenshot /tmp/fixreddit.png
   ```

## Important Files

- `src/reddit-mobile.css`: primary mobile layout and typography.
- `src/content.js`: post navigation, promo removal, toolbar, comment
  controls, page shims.
- `src/rules.json`: DNR redirect and User-Agent rewrite rules.
- `src/manifest.json`: extension permissions and resource declarations.
- `project.yml`: XcodeGen target structure. Extension resources must be listed
  here under `src/...` with `buildPhase: resources`.

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

## Safari Extension Gotchas

- If Safari Settings does not show the extension, the `.appex` likely lacks
  `manifest.json`.
- If redirects/scripts do not run, host access may be disabled in iOS
  Settings → Safari → Extensions.
- If Reddit still shows mobile UI, it may be using viewport/cookie/client
  checks rather than only the HTTP User-Agent.
- Safari may require re-approval after permission changes in `manifest.json`.

## Editing Constraints

- Keep CSS scoped under `.fix-reddit-mobile`.
- Avoid broad DOM deletion in `content.js`; remove only promo-shaped nodes.
- Preserve normal click behavior for anchors, buttons, form controls, vote
  arrows, thumbnails, media, and expandos.
- Keep generated build output ignored.
- Any new file added under `src/` must also be listed in `project.yml` under
  the `FixRedditExtension` target with `buildPhase: resources`.
