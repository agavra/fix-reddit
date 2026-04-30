# FixReddit

FixReddit is an iOS Safari Web Extension that makes Reddit usable on an iPhone by forcing Reddit traffic to `old.reddit.com` and reshaping old Reddit into a mobile-friendly reader.

The app target is only a small iOS container app. Most product behavior lives in the Safari extension resources under `Extension/Resources`.

## What It Does

- Redirects `reddit.com`, `www.reddit.com`, `m.reddit.com`, and `np.reddit.com` to `old.reddit.com`.
- Attempts to send a desktop Safari user agent to Reddit with Declarative Net Request header rules.
- Injects CSS that removes mobile/app promos, signup blocks, noisy listing controls, and desktop chrome.
- Reflows old Reddit listing cards for phone-sized viewports.
- Makes post cards open the comments page when tapped, while preserving normal taps on links, thumbnails, votes, media, and controls.
- Adds a small floating rail for `Top`, `Next`, and sidebar `Info`.
- Adds collapse/expand controls to comment threads.

## Project Layout

```text
project.yml                              XcodeGen project definition
FixReddit.xcodeproj/                     Generated Xcode project
FixReddit/                               iOS container app
  FixRedditApp.swift
  ContentView.swift                      Basic enable-extension instructions
  Info.plist
Extension/
  SafariWebExtensionHandler.swift        Native extension message handler
  Info.plist                             Safari Web Extension metadata
  Resources/
    manifest.json                        Web extension manifest
    rules.json                           Redirect and header rewrite DNR rules
    content.js                           DOM behavior and page shims
    reddit-mobile.css                    Main mobile old-Reddit stylesheet
    background.js                        Ruleset setup
    popup.html/css                       Toolbar popup
    _locales/en/messages.json            Extension name/description strings
    images/                              Toolbar/icon assets
```

## Prerequisites

- Xcode
- XcodeGen, available as `xcodegen`
- iOS 15+ for Safari Web Extensions
- Safari 16.4+ for `declarativeNetRequest` `modifyHeaders` support

Install XcodeGen if needed:

```sh
brew install xcodegen
```

## Build

Regenerate the project after editing `project.yml`:

```sh
xcodegen generate
```

Build from the command line:

```sh
xcodebuild -project FixReddit.xcodeproj -target FixReddit -sdk iphonesimulator build
```

Open in Xcode:

```sh
open FixReddit.xcodeproj
```

For device builds, select the `FixReddit` app target, set a development team, and change the bundle IDs if `com.example.fixreddit` is unavailable.

## Install And Enable

Run the `FixReddit` app target on an iPhone or simulator. Then enable the extension:

- iOS Settings > Apps > Safari > Extensions > FixReddit
- Older iOS: Settings > Safari > Extensions > FixReddit

Allow website access for Reddit domains. If `manifest.json` permissions change, iOS may require re-approval.

## Simulator Loop

The expected agent validation loop is:

```sh
xcodebuild -project FixReddit.xcodeproj -target FixReddit -sdk iphonesimulator build
xcrun simctl install booted build/Debug-iphonesimulator/FixReddit.app
xcrun simctl openurl booted https://old.reddit.com/
xcrun simctl io booted screenshot /tmp/fixreddit.png
```

Then inspect `/tmp/fixreddit.png`.

If the extension does not appear in Safari settings, inspect the built extension bundle:

```sh
find build/Debug-iphonesimulator/FixReddit.app/PlugIns/FixRedditExtension.appex -maxdepth 3 -type f | sort
```

The `.appex` must contain `manifest.json` at its top level. If it does not, the XcodeGen resource declarations in `project.yml` are wrong.

## Quick Checks

```sh
node --check Extension/Resources/content.js
node --check Extension/Resources/background.js
node -e "for (const f of ['Extension/Resources/manifest.json','Extension/Resources/rules.json','Extension/Resources/_locales/en/messages.json']) JSON.parse(require('fs').readFileSync(f, 'utf8'))"
plutil -lint FixReddit/Info.plist Extension/Info.plist
```

## Implementation Notes

`rules.json` has two jobs:

- Redirect Reddit main-frame requests to `old.reddit.com`.
- Rewrite the `User-Agent` header to desktop macOS Safari where Safari permits request header modification.

`content.js` has the behavioral layer:

- Redirect fallback if network redirects are skipped.
- Desktop identity shim for `navigator.userAgent`, `navigator.platform`, and touch signals.
- Mobile toolbar injection.
- Post card navigation to comments.
- Comment collapse controls.
- Promo/signup cleanup with a mutation observer.

`reddit-mobile.css` is the main UX surface. It should stay conservative and heavily scoped under `.fix-reddit-mobile` so it does not leak into non-Reddit pages.

## Known Constraints

- Safari Web Extension permissions are user-controlled. If host access is off, redirects, scripts, or header rewrites may not run.
- Header rewriting requires `declarativeNetRequestWithHostAccess` and a Safari/iOS version that supports `modifyHeaders`.
- Reddit can still infer mobile from viewport width, cookies, or server-side experiments. The extension therefore both spoofs desktop signals and removes mobile/app promo UI.
- Old Reddit markup is stable compared with new Reddit, but it is still not an API. CSS selectors should be kept broad enough to tolerate minor class changes.
- The generated `.xcodeproj` is committed for convenience, but `project.yml` is the source of truth.

## Maintenance Tips

- Prefer changing `Extension/Resources/reddit-mobile.css` for presentation.
- Prefer changing `Extension/Resources/content.js` for DOM behavior.
- Keep extension resources explicitly listed in `project.yml`; otherwise they may not be copied into the `.appex`.
- Rebuild and reinstall after every extension resource change. Safari does not hot-reload the installed extension bundle.
- Use simulator screenshots to validate actual layout before declaring UX work done.
