(function () {
  const OLD_REDDIT_HOST = "old.reddit.com";

  if (location.hostname !== OLD_REDDIT_HOST) {
    return;
  }

  const flags = parseFlags(location.search);

  if (flags.fallback) {
    return;
  }

  // Some old.reddit pages are forms that we don't want to rebuild —
  // login/register/logout/post-submit. Let the patch fallback handle them
  // so the original form ships intact.
  const PASSTHROUGH = /^\/(login|register|logout|submit|prefs|message|wiki)(\/|$)/;
  if (PASSTHROUGH.test(location.pathname || "")) {
    return;
  }

  document.documentElement.classList.add("fr-rebuild");

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  function ensureViewport() {
    // Run AFTER the head is parsed so we replace the desktop viewport
    // that old.reddit injects (`width=1024`). Strip every existing
    // viewport meta and append a single mobile-first one.
    const existing = document.querySelectorAll("meta[name='viewport']");
    existing.forEach((m) => m.parentNode && m.parentNode.removeChild(m));
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, viewport-fit=cover"
    );
    const head = document.head || document.documentElement.firstElementChild;
    if (head) head.appendChild(meta);
  }

  function parseFlags(search) {
    const params = new URLSearchParams(search);
    return {
      drawer: params.get("frDrawer") === "1",
      fallback: params.get("frFallback") === "1",
      debug: params.get("frDebug") === "1",
    };
  }

  function boot() {
    ensureViewport();

    const vault = document.createElement("div");
    vault.id = "fr-vault";
    vault.hidden = true;

    while (document.body.firstChild) {
      vault.appendChild(document.body.firstChild);
    }

    const app = document.createElement("div");
    app.id = "fr-app";

    document.body.appendChild(vault);
    document.body.appendChild(app);

    const subscribers = new Set();
    const observer = new MutationObserver((mutations) => {
      for (const fn of subscribers) {
        try {
          fn(mutations);
        } catch (e) {
          if (flags.debug) {
            console.error("[fr] observer subscriber threw", e);
          }
        }
      }
    });

    observer.observe(vault, { childList: true, subtree: true });

    function observe(callback) {
      subscribers.add(callback);
      return {
        dispose() {
          subscribers.delete(callback);
        },
      };
    }

    window.__fr = Object.assign(window.__fr || {}, {
      vault,
      app,
      observe,
      flags,
    });

    if (flags.debug) {
      console.log("[fr] bootstrap complete", { flags });
      renderDebugSummary();
    }

    mountForRoute();
  }

  function mountForRoute() {
    const fr = window.__fr;
    if (!fr || !fr.app || !fr.vault || !fr.parser || !fr.render) {
      return showPlaceholder("FixReddit rebuild loading…");
    }
    const path = location.pathname || "";
    const isComments = /\/comments\//.test(path);
    try {
      if (fr.render.renderChrome) {
        fr.render.renderChrome();
      }
      if (isComments) {
        if (fr.render.renderComments) {
          const model = fr.parser.parseComments(fr.vault);
          if (!model.post) {
            renderUnparseable();
          } else {
            fr.render.renderComments(model, fr.app);
          }
        } else {
          showPlaceholder("Comments view: rebuild in progress");
        }
      } else {
        if (fr.render.renderListing) {
          const model = fr.parser.parseListing(fr.vault);
          if (model.posts.length === 0) {
            renderUnparseable();
          } else {
            fr.render.renderListing(model, fr.app);
          }
        } else {
          showPlaceholder("Listing view: rebuild in progress");
        }
      }
    } catch (e) {
      console.error("[fr] mount failed", e);
      showPlaceholder("FixReddit rebuild error: " + (e && e.message));
    }
  }

  // Render the gist of any non-listing / non-comments page (404, banned,
  // private, quarantined, login interstitial). We pull the most-prominent
  // title/message text out of the vault and offer a path back home.
  function renderUnparseable() {
    const fr = window.__fr;
    if (!fr || !fr.vault || !fr.app) return;
    const vault = fr.vault;
    const heading =
      vault.querySelector("h1, h2") ||
      vault.querySelector(".error-page h1, .error-page h2");
    const body =
      vault.querySelector(".content > .md, .content > p, .content .interstitial") ||
      vault.querySelector(".infobar.warning") ||
      vault.querySelector(".content > div");

    const wrap = document.createElement("section");
    wrap.className = "fr-empty";
    if (heading) {
      const h = document.createElement("h1");
      h.className = "fr-empty-title";
      h.textContent = (heading.textContent || "").trim() || "Nothing here";
      wrap.appendChild(h);
    } else {
      const h = document.createElement("h1");
      h.className = "fr-empty-title";
      h.textContent = "Nothing here";
      wrap.appendChild(h);
    }
    if (body) {
      const p = document.createElement("div");
      p.className = "fr-empty-body";
      p.innerHTML = body.innerHTML;
      wrap.appendChild(p);
    }
    const home = document.createElement("a");
    home.className = "fr-empty-home";
    home.href = "/";
    home.textContent = "Back to front page";
    wrap.appendChild(home);

    fr.app.appendChild(wrap);
  }

  function showPlaceholder(message) {
    const fr = window.__fr;
    if (!fr || !fr.app) return;
    const node = document.createElement("div");
    node.className = "fr-bootstrap-placeholder";
    node.textContent = message;
    fr.app.appendChild(node);
  }

  function renderDebugSummary() {
    const app = window.__fr && window.__fr.app;
    const vault = window.__fr && window.__fr.vault;
    const parser = window.__fr && window.__fr.parser;
    if (!app || !vault || !parser) return;

    const path = location.pathname || "";
    const isComments = /\/comments\//.test(path);
    const summary = document.createElement("pre");
    summary.className = "fr-debug-summary";

    try {
      const user = parser.parseUser(vault);
      const lines = [];
      lines.push("user.loggedIn=" + user.loggedIn);
      lines.push("user.username=" + (user.username || "null"));
      lines.push("user.csrfToken=" + (user.csrfToken ? "present" : "null"));
      lines.push("user.loginUrl=" + user.loginUrl);

      if (isComments) {
        const c = parser.parseComments(vault);
        lines.push("comments.post.title=" + (c.post && c.post.title));
        lines.push("comments.count=" + c.comments.length);
        function maxDepth(nodes, d) {
          let m = d;
          for (const n of nodes) m = Math.max(m, maxDepth(n.children, d + 1));
          return m;
        }
        lines.push("comments.maxDepth=" + maxDepth(c.comments, 0));
      } else {
        const l = parser.parseListing(vault);
        lines.push("listing.pagename=" + l.pagename);
        lines.push("listing.posts=" + l.posts.length);
        if (l.posts[0]) {
          lines.push("listing.posts[0].title=" + l.posts[0].title);
          lines.push("listing.posts[0].score=" + l.posts[0].score);
          lines.push(
            "listing.posts[0].subreddit=" + l.posts[0].subreddit
          );
          lines.push(
            "listing.posts[0].comments=" + l.posts[0].commentCount
          );
        }
      }
      summary.textContent = lines.join("\n");
    } catch (e) {
      summary.textContent = "parser threw: " + (e && e.message);
    }

    app.appendChild(summary);
  }
})();
