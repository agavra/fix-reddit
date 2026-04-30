# FixReddit

FixReddit is a Firefox extension that forces Reddit traffic to `old.reddit.com`
and reshapes old Reddit into a mobile-friendly reader.

## What It Does

- Redirects `reddit.com`, `www.reddit.com`, `m.reddit.com`, and `np.reddit.com`
  to `old.reddit.com`.
- Sends a desktop Safari user agent to Reddit via Declarative Net Request header
  rules.
- Injects CSS that removes mobile/app promos, signup blocks, noisy listing
  controls, and desktop chrome.
- Reflows old Reddit listing cards for phone-sized viewports.
- Makes post cards open the comments page when tapped, while preserving normal
  taps on links, thumbnails, votes, media, and controls.
- Adds a small floating rail for `Top`, `Next`, and sidebar `Info`.
- Adds collapse/expand controls to comment threads.

## Project Layout

```text
src/
  manifest.json          Web extension manifest (MV3)
  rules.json             Redirect and header rewrite DNR rules
  content.js             DOM behavior and page shims
  reddit-mobile.css      Main mobile old-Reddit stylesheet
  background.js          Ruleset setup
  popup.html/css         Toolbar popup
  _locales/en/messages.json
  images/                Toolbar/icon assets
.github/workflows/release.yml   Tag-driven AMO signing + GitHub Release
```

## Develop

Install [`web-ext`](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/):

```sh
npm install --global web-ext
```

Run a development Firefox with the extension loaded:

```sh
web-ext run --source-dir=src
```

Lint:

```sh
web-ext lint --source-dir=src
```

Quick syntactic checks:

```sh
node --check src/content.js
node --check src/background.js
node -e "for (const f of ['src/manifest.json','src/rules.json','src/_locales/en/messages.json']) JSON.parse(require('fs').readFileSync(f, 'utf8'))"
```

## Release

Push a `v1.2.3` tag. CI signs the build with Mozilla's API and attaches the
signed XPI to a GitHub Release. See [`.github/workflows/release.yml`](.github/workflows/release.yml)
for the required secrets.

## Implementation Notes

`rules.json` has two jobs:

- Redirect Reddit main-frame requests to `old.reddit.com`.
- Rewrite the `User-Agent` header to desktop macOS Safari.

`content.js` has the behavioral layer:

- Redirect fallback if network redirects are skipped.
- Desktop identity shim for `navigator.userAgent`, `navigator.platform`, and
  touch signals.
- Mobile toolbar injection.
- Post card navigation to comments.
- Comment collapse controls.
- Promo/signup cleanup with a mutation observer.

`reddit-mobile.css` is the main UX surface. It stays scoped under
`.fix-reddit-mobile` so it does not leak into non-Reddit pages.

## License

MIT — see [LICENSE](LICENSE).
