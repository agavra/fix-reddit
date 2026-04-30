(function () {
  const OLD_REDDIT_HOST = "old.reddit.com";
  const REDDIT_HOSTS = new Set(["reddit.com", "www.reddit.com", "m.reddit.com", "np.reddit.com"]);

  if (REDDIT_HOSTS.has(location.hostname)) {
    location.replace(`https://${OLD_REDDIT_HOST}${location.pathname}${location.search}${location.hash}`);
    return;
  }

  if (location.hostname !== OLD_REDDIT_HOST) {
    return;
  }

  // Yield to the rebuild path when fr-bootstrap.js has activated it. The
  // rebuild lives entirely under <html class="fr-rebuild">; the patch fallback
  // only runs when that class is absent (e.g. ?frFallback=1).
  if (document.documentElement.classList.contains("fr-rebuild")) {
    return;
  }

  installDesktopIdentityShim();
  document.documentElement.classList.add("fix-reddit-mobile");

  ensureViewport();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installMobileTools, { once: true });
  } else {
    installMobileTools();
  }

  function ensureViewport() {
    let viewport = document.querySelector("meta[name='viewport']");

    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      document.documentElement.firstElementChild?.appendChild(viewport);
    }

    viewport.content = "width=device-width, initial-scale=1, viewport-fit=cover";
  }

  function installDesktopIdentityShim() {
    const script = document.createElement("script");
    script.textContent = `
      (() => {
        const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
        const platform = "MacIntel";
        const maxTouchPoints = 0;
        const define = (target, property, value) => {
          try {
            Object.defineProperty(target, property, {
              configurable: true,
              get: () => value
            });
          } catch (_) {}
        };

        define(Navigator.prototype, "userAgent", userAgent);
        define(Navigator.prototype, "appVersion", userAgent.replace(/^Mozilla\\//, ""));
        define(Navigator.prototype, "platform", platform);
        define(Navigator.prototype, "maxTouchPoints", maxTouchPoints);
      })();
    `;

    document.documentElement.prepend(script);
    script.remove();
  }

  function installMobileTools() {
    document.body.classList.add("fix-reddit-mobile-ready");
    improvePostLinks();
    installPostCardNavigation();
    improveCommentControls();
    removePromos();
    convertSidebar();
    rewritePagename();
    cleanHeaderRight();
    relocateAccountControls();
    installSidebarToggle();
    maybeOpenSidebarFromQuery();
    observeDynamicContent();
  }

  // Testing-only trigger: append `?fixSidebar=1` to a URL to auto-open the
  // drawer on load so screenshot tooling can capture it. No-op without the flag.
  function maybeOpenSidebarFromQuery() {
    if (location.search.includes("fixSidebar=1")) {
      document.body.classList.add("fix-reddit-sidebar-open");
    }
  }

  function cleanHeaderRight() {
    const headerRight = document.querySelector("#header-bottom-right");

    if (!headerRight || headerRight.dataset.fixRedditCleaned === "true") {
      return;
    }

    // Hide the verbose "Want to join? ... in seconds." prose. Walk every text
    // node inside the header-right and zap any node whose content matches the
    // known invite phrases or is just a separator. Keep element children intact.
    const PROSE_PATTERNS = [
      /want\s+to\s+join/i,
      /in\s+seconds/i,
      /\bor\b/i
    ];

    const walker = document.createTreeWalker(headerRight, NodeFilter.SHOW_TEXT);
    const toRemove = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = (node.nodeValue || "").trim();

      if (!text) {
        continue;
      }

      // Free-floating prose between/around the login pills.
      if (PROSE_PATTERNS.some((p) => p.test(text))) {
        toRemove.push(node);
        continue;
      }

      // Pipe / bullet separators between user-logged-in items.
      if (/^[|·•]+$/.test(text)) {
        toRemove.push(node);
      }
    }

    toRemove.forEach((node) => node.remove());

    // Also nuke any element whose only purpose is the prose separators.
    headerRight.querySelectorAll("span").forEach((span) => {
      const text = (span.textContent || "").trim();

      if (!text || /^[|·•]+$/.test(text) || /^(want\s+to\s+join|in\s+seconds\.?|or)$/i.test(text)) {
        span.remove();
      }
    });

    headerRight.dataset.fixRedditCleaned = "true";
  }

  function relocateAccountControls() {
    const side = document.querySelector(".side");
    const headerRight = document.querySelector("#header-bottom-right");

    if (!side || !headerRight) {
      return;
    }

    if (side.querySelector(".fix-reddit-account")) {
      return;
    }

    const section = document.createElement("section");
    section.className = "fix-reddit-account";

    const isLoggedIn = document.body.classList.contains("loggedin") ||
      Boolean(headerRight.querySelector(".logout"));

    if (isLoggedIn) {
      const userLink = headerRight.querySelector(".user a, .user-summary a");
      const username = userLink ? (userLink.textContent || "").trim() : "";
      const profileHref = userLink instanceof HTMLAnchorElement ? userLink.href : "/";

      if (username) {
        const userRow = document.createElement("a");
        userRow.href = profileHref;
        userRow.className = "fix-reddit-account-row fix-reddit-account-user";
        userRow.textContent = `u/${username.replace(/^u\//, "")}`;
        section.appendChild(userRow);
      }

      const messageCount = headerRight.querySelector(".message-count");
      const unread = messageCount ? (messageCount.textContent || "").trim() : "";
      const inboxRow = document.createElement("a");
      inboxRow.href = "/message/inbox/";
      inboxRow.className = "fix-reddit-account-row fix-reddit-account-inbox";

      if (unread && unread !== "0") {
        inboxRow.textContent = `Inbox (${unread})`;
        inboxRow.classList.add("fix-reddit-account-inbox-unread");
      } else {
        inboxRow.textContent = "Inbox";
      }

      section.appendChild(inboxRow);

      const prefsRow = document.createElement("a");
      prefsRow.href = "/prefs/";
      prefsRow.className = "fix-reddit-account-row fix-reddit-account-prefs";
      prefsRow.textContent = "Preferences";
      section.appendChild(prefsRow);

      const logoutLink = headerRight.querySelector(".logout a");
      const logoutRow = document.createElement("a");
      logoutRow.href = logoutLink instanceof HTMLAnchorElement ? logoutLink.href : "/logout";
      logoutRow.className = "fix-reddit-account-row fix-reddit-account-logout";
      logoutRow.textContent = "Log out";

      // Reddit's logout is form-based; replicate that by submitting the original
      // logout form when we have it.
      const logoutForm = headerRight.querySelector(".logout");

      if (logoutForm instanceof HTMLFormElement) {
        logoutRow.addEventListener("click", (event) => {
          event.preventDefault();
          logoutForm.submit();
        });
      }

      section.appendChild(logoutRow);
    } else {
      const loginA = headerRight.querySelector('a.login-required[href*="/login"], a[href*="/login"].login-required');
      const signupA = headerRight.querySelector('a.login-required[href*="/register"], a[href*="/register"].login-required');

      const loginHref = loginA instanceof HTMLAnchorElement ? loginA.href : "/login";
      const signupHref = signupA instanceof HTMLAnchorElement ? signupA.href : "/register";

      const loginRow = document.createElement("a");
      loginRow.href = loginHref;
      loginRow.className = "fix-reddit-account-row fix-reddit-account-login";
      loginRow.textContent = "Log in";
      section.appendChild(loginRow);

      const signupRow = document.createElement("a");
      signupRow.href = signupHref;
      signupRow.className = "fix-reddit-account-row fix-reddit-account-signup";
      signupRow.textContent = "Sign up";
      section.appendChild(signupRow);
    }

    const closeButton = side.querySelector(".fix-reddit-sidebar-close");

    if (closeButton && closeButton.nextSibling) {
      side.insertBefore(section, closeButton.nextSibling);
    } else if (closeButton) {
      side.appendChild(section);
    } else {
      side.prepend(section);
    }

    document.documentElement.classList.add("fix-reddit-account-relocated");
  }

  function rewritePagename() {
    const pagename = document.querySelector(".pagename");

    if (!pagename || pagename.dataset.fixRedditRewritten === "true") {
      return;
    }

    const match = location.pathname.match(/^\/r\/([^\/]+)/);

    if (!match) {
      return;
    }

    const subreddit = match[1];
    const homeHref = pagename.querySelector("a")?.getAttribute("href") || "/";
    pagename.innerHTML = "";

    const home = document.createElement("a");
    home.href = homeHref;
    home.textContent = "reddit";
    home.className = "fix-reddit-pagename-home";

    const sep = document.createElement("span");
    sep.textContent = " / ";
    sep.className = "fix-reddit-pagename-sep";

    const sr = document.createElement("a");
    sr.href = `/r/${subreddit}/`;
    sr.textContent = `r/${subreddit}`;
    sr.className = "fix-reddit-pagename-sr";

    pagename.append(home, sep, sr);
    pagename.dataset.fixRedditRewritten = "true";
  }

  function installSidebarToggle() {
    const header = document.querySelector("#header");

    if (!header || header.querySelector(".fix-reddit-menu-toggle")) {
      return;
    }

    const ICON_MENU = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "fix-reddit-menu-toggle";
    toggle.innerHTML = ICON_MENU;
    toggle.setAttribute("aria-label", "Info / sidebar");
    toggle.title = "Info / sidebar";
    toggle.addEventListener("click", () => document.body.classList.toggle("fix-reddit-sidebar-open"));

    header.appendChild(toggle);
  }

  function makeButton(label, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", action);
    return button;
  }

  function removePromos() {
    const promoPatterns = [
      /get\s+reddit\s+mobile/i,
      /become\s+a\s+redditor/i,
      /front\s+page\s+of\s+the\s+internet/i,
      /mobile\s+website/i,
      /reddit\s+for\s+iphone/i,
      /reddit\s+for\s+android/i
    ];

    document.querySelectorAll("body > section, .content > section, .content > .infobar, .footer-parent, [class*='mweb'], [class*='mobile-web'], [class*='promo'], [class*='Promo']").forEach((node) => {
      const text = node.textContent || "";

      if (promoPatterns.some((pattern) => pattern.test(text))) {
        node.remove();
      }
    });

    document.querySelectorAll("a, button").forEach((node) => {
      const text = node.textContent || "";

      if (/get\s+reddit\s+mobile/i.test(text)) {
        const container = node.closest("div, section, aside");
        (container || node).remove();
      }
    });
  }

  function observeDynamicContent() {
    const observer = new MutationObserver(() => {
      removePromos();
      improveCommentControls();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function convertSidebar() {
    const side = document.querySelector(".side");

    if (!side || side.querySelector(".fix-reddit-sidebar-close")) {
      return;
    }

    const close = makeButton("Close", () => document.body.classList.remove("fix-reddit-sidebar-open"));
    close.className = "fix-reddit-sidebar-close";
    side.prepend(close);
  }

  function improvePostLinks() {
    document.querySelectorAll(".link").forEach((post) => {
      if (post.querySelector(":scope > .thumbnail")) {
        post.classList.add("fix-reddit-has-thumbnail");
      }
    });

    document.querySelectorAll("a.comments").forEach((link) => {
      if (!(link instanceof HTMLAnchorElement) || link.dataset.fixRedditCount) {
        return;
      }

      const count = link.textContent?.match(/\d+/)?.[0];
      link.dataset.fixRedditCount = count ? `(${count})` : "";
      link.setAttribute("aria-label", link.textContent?.trim() || "Comments");
    });
  }

  function installPostCardNavigation() {
    document.querySelectorAll(".link").forEach((post) => {
      if (post.dataset.fixRedditCardNav === "true") {
        return;
      }

      const comments = post.querySelector("a.comments");

      if (!(comments instanceof HTMLAnchorElement)) {
        return;
      }

      post.dataset.fixRedditCardNav = "true";
      post.setAttribute("role", "link");
      post.setAttribute("tabindex", "0");
      post.setAttribute("aria-label", `Open comments: ${post.querySelector(".title")?.textContent?.trim() || "Reddit post"}`);

      post.addEventListener("click", (event) => {
        if (shouldLetTargetHandleClick(event.target)) {
          return;
        }

        location.href = comments.href;
      });

      post.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          location.href = comments.href;
        }
      });
    });
  }

  function shouldLetTargetHandleClick(target) {
    if (!(target instanceof Element)) {
      return false;
    }

    return Boolean(target.closest("a, button, input, select, textarea, .arrow, .thumbnail, .expando-button, .toggleImage, video"));
  }

  function improveCommentControls() {
    document.querySelectorAll(".comment").forEach((comment) => {
      if (comment.dataset.fixRedditCommentDecorated === "true") {
        return;
      }

      const entry = comment.querySelector(":scope > .entry");

      if (!entry) {
        return;
      }

      // Compute depth relative to ancestor `.comment`s; cycle every 6 levels.
      let depth = 0;
      let parent = comment.parentElement;

      while (parent && parent !== document.body) {
        if (parent.classList && parent.classList.contains("comment")) {
          depth += 1;
        }

        parent = parent.parentElement;
      }

      comment.dataset.fixRedditDepth = String(depth % 6);

      const tagline = entry.querySelector(":scope > .tagline");

      if (tagline) {
        tagline.classList.add("fix-reddit-tagline");
        tagline.addEventListener("click", (event) => {
          const target = event.target;

          if (target instanceof Element && target.closest("a, button, input, select, textarea")) {
            return;
          }

          comment.classList.toggle("fix-reddit-collapsed");
        });
      }

      // Build a new inline action row at the end of the entry.
      // Surface the existing reply link from the .flat-list (kept in DOM for
      // its wiring; visually hidden via CSS).
      const existingRow = entry.querySelector(":scope > .fix-reddit-comment-actions");

      if (!existingRow) {
        const row = document.createElement("div");
        row.className = "fix-reddit-comment-actions";

        const score = comment.querySelector(":scope > .entry .midcol .score");
        const scoreText = score ? (score.textContent || "").trim() : "";

        if (scoreText) {
          const scoreSpan = document.createElement("span");
          scoreSpan.className = "fix-reddit-comment-score";
          scoreSpan.textContent = scoreText;
          row.appendChild(scoreSpan);
        }

        const replyAnchor = entry.querySelector(":scope > ul.flat-list .reply-button a, :scope > ul.flat-list li.reply-button a");

        if (replyAnchor instanceof HTMLAnchorElement) {
          const replyClone = document.createElement("a");
          replyClone.href = replyAnchor.href;
          replyClone.className = "fix-reddit-comment-reply";
          replyClone.textContent = "Reply";
          replyClone.addEventListener("click", (event) => {
            // Defer to the original anchor so reddit's reply form opens inline.
            event.preventDefault();
            replyAnchor.click();
          });
          row.appendChild(replyClone);
        }

        const usertext = entry.querySelector(":scope > form.usertext, :scope > div.usertext");

        if (usertext && usertext.parentElement === entry) {
          entry.insertBefore(row, usertext.nextSibling);
        } else {
          entry.appendChild(row);
        }
      }

      comment.dataset.fixRedditCommentDecorated = "true";
    });
  }
})();
