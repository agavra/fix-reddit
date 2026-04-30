(function () {
  if (!window.__fr) window.__fr = {};

  const SVG = {
    arrowUp:
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 5v14M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowDown:
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 19V5M5 12l7 7 7-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chevronUp:
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chevronDown:
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chevronLeft:
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chevronRight:
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bubble:
      '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4h-.5A.5.5 0 0 1 4 16.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    share:
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 4v12M8 8l4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bookmark:
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    moreH:
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="5" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="19" cy="12" r="1.7" fill="currentColor"/></svg>',
    image:
      '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="1.4" fill="currentColor"/><path d="M5 17l4-4 3 3 4-4 3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    link:
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M10 14a4 4 0 0 1 0-5.7l3-3a4 4 0 1 1 5.7 5.7l-1.5 1.5M14 10a4 4 0 0 1 0 5.7l-3 3a4 4 0 1 1-5.7-5.7l1.5-1.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    xmark:
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  };

  function el(tag, props, ...children) {
    const node = document.createElement(tag);
    if (props) {
      for (const k in props) {
        if (k === "class") node.className = props[k];
        else if (k === "html") node.innerHTML = props[k];
        else if (k === "text") node.textContent = props[k];
        else if (k.startsWith("on") && typeof props[k] === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), props[k]);
        } else if (k === "attrs") {
          for (const a in props[k]) node.setAttribute(a, props[k][a]);
        } else if (k === "style" && typeof props[k] === "object") {
          Object.assign(node.style, props[k]);
        } else if (props[k] != null) {
          node[k] = props[k];
        }
      }
    }
    for (const c of children) {
      if (c == null || c === false) continue;
      if (typeof c === "string") node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    }
    return node;
  }

  function fmtScore(n) {
    if (n == null) return "•";
    const abs = Math.abs(n);
    if (abs >= 10000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  function fmtCount(n) {
    if (!n) return "0";
    if (n >= 10000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  const AGE_UNIT = {
    year: "y", month: "mo", week: "w", day: "d",
    hour: "h", minute: "m", second: "s",
  };

  function compactAge(textValue) {
    if (!textValue) return "";
    const m = textValue.match(/(\d+)\s*(year|month|week|day|hour|minute|second)s?\s*ago/i);
    if (m) return m[1] + (AGE_UNIT[m[2].toLowerCase()] || m[2][0]);
    return textValue;
  }

  function bumpEl(node) {
    if (!node) return;
    node.classList.remove("fr-bump");
    void node.offsetWidth;
    node.classList.add("fr-bump");
  }

  function faviconFor(url) {
    try {
      const u = new URL(url, location.href);
      return "https://" + u.hostname + "/favicon.ico";
    } catch (_) {
      return null;
    }
  }

  // renderVoteGroup builds a horizontal up/score/down trio used in card
  // action rows, OP cards, and comment action rows. The optional
  // `applyExtra` lets callers attach behaviour (e.g. swipe sync) via the
  // returned `applyState` closure.
  function renderVoteGroup(model, opts) {
    const actions = window.__fr.actions;
    const variant = (opts && opts.variant) || "card";
    const up = el("button", {
      class: "fr-vote fr-vote-up",
      type: "button",
      attrs: { "aria-label": "Upvote" },
      html: SVG.arrowUp,
    });
    const down = el("button", {
      class: "fr-vote fr-vote-down",
      type: "button",
      attrs: { "aria-label": "Downvote" },
      html: SVG.arrowDown,
    });
    const score = el("span", {
      class: "fr-vote-score",
      text: fmtScore(model.score),
    });
    const row = el("div", { class: "fr-votegroup fr-votegroup-" + variant }, up, score, down);

    function applyState({ dir, score: s }) {
      row.classList.toggle("fr-voted-up", dir === 1);
      row.classList.toggle("fr-voted-down", dir === -1);
      score.textContent = s != null ? fmtScore(s) : "•";
      bumpEl(score);
      if (opts && typeof opts.onState === "function") opts.onState({ dir, score: s });
    }

    up.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      actions.castVote(model, "up", applyState);
    });
    down.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      actions.castVote(model, "down", applyState);
    });
    return { row, applyState };
  }

  // renderThumb returns null for self-posts (let the title fill width)
  // and for external links without a real thumbnail (a generic link
  // glyph next to the domain reads cleaner than a "LINK" placeholder).
  // NSFW gets a tinted square; image/video posts show their thumbnail
  // with a small media badge if it's a gallery.
  function renderThumb(post) {
    if (post.isNsfw) {
      return el(
        "a",
        {
          class: "fr-thumb fr-thumb-nsfw",
          href: post.permalink || post.url,
        },
        el("span", { class: "fr-thumb-tag", text: "NSFW" })
      );
    }
    if (post.isSelf) {
      return null;
    }
    if (post.thumbnail) {
      const a = el("a", {
        class: "fr-thumb",
        href: post.url || post.permalink,
        attrs: { target: "_self" },
      });
      const img = el("img", {
        attrs: { src: post.thumbnail, alt: "", loading: "lazy" },
      });
      a.appendChild(img);
      if (post.isGallery) {
        a.appendChild(
          el("span", { class: "fr-thumb-badge", html: SVG.image })
        );
      }
      return a;
    }
    return null;
  }

  function sep() {
    return el("span", { class: "fr-sep", attrs: { "aria-hidden": "true" }, text: "·" });
  }

  function renderTagline(post) {
    const wrap = el("div", { class: "fr-tagline" });
    if (post.subreddit) {
      wrap.appendChild(el("a", {
        class: "fr-meta-sub",
        href: "/r/" + post.subreddit + "/",
        text: "r/" + post.subreddit,
      }));
    }
    if (post.author && !/^\[deleted\]?$/.test(post.author)) {
      wrap.appendChild(el("a", {
        class: "fr-meta-author",
        href: "/user/" + post.author + "/",
        text: "u/" + post.author,
      }));
    }
    if (post.ageText) {
      wrap.appendChild(el("span", { class: "fr-meta-age", text: compactAge(post.ageText) }));
    }
    const domain = post.domain || "";
    if (domain && !/^self\./.test(domain)) {
      if (post.url) {
        wrap.appendChild(el("a", {
          class: "fr-meta-domain",
          href: post.url,
          attrs: { target: "_self" },
          text: domain,
        }));
      } else {
        wrap.appendChild(el("span", { class: "fr-meta-domain", text: domain }));
      }
    }
    return wrap;
  }

  function renderActionRow(post, voteHooks) {
    const vote = renderVoteGroup(post, { variant: "card", onState: voteHooks && voteHooks.onState });
    if (voteHooks) voteHooks.applyState = vote.applyState;

    const comments = el(
      "a",
      {
        class: "fr-action fr-action-comments",
        href: post.permalink,
        attrs: { "aria-label": post.commentCount + " comments" },
      },
      el("span", { class: "fr-action-icon", html: SVG.bubble }),
      el("span", { class: "fr-action-label", text: fmtCount(post.commentCount) })
    );

    const share = el("button", {
      class: "fr-action fr-action-share",
      type: "button",
      attrs: { "aria-label": "Share" },
      html: SVG.share,
    });
    share.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const shareUrl = post.permalink ? location.origin + post.permalink : location.href;
      if (navigator.share) {
        navigator.share({ title: post.title, url: shareUrl }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).catch(() => {});
      }
    });

    const more = el("button", {
      class: "fr-action fr-action-more",
      type: "button",
      attrs: { "aria-label": "More actions" },
      html: SVG.moreH,
    });
    more.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
    });

    return el("div", { class: "fr-actions" }, vote.row, comments, share, more);
  }

  function renderCard(post) {
    const card = el("article", {
      class:
        "fr-card" +
        (post.isStickied ? " fr-card-stickied" : "") +
        (post.isNsfw ? " fr-card-nsfw" : ""),
      attrs: { role: "link", tabindex: "0" },
    });

    const titleA = el("a", {
      class: "fr-title",
      href: post.permalink,
      text: post.title,
    });

    if (post.flair) {
      titleA.prepend(
        el("span", { class: "fr-flair", text: post.flair })
      );
    }

    const body = el("div", { class: "fr-card-body" }, titleA, renderTagline(post));

    const thumb = renderThumb(post);
    const head = el("div", { class: "fr-card-head" });
    if (thumb) head.appendChild(thumb);
    head.appendChild(body);

    const voteHooks = {};
    const actionRow = renderActionRow(post, voteHooks);

    const swipeBg = el("div", { class: "fr-card-swipebg" },
      el("div", { class: "fr-card-swipebg-up", html: SVG.arrowUp }),
      el("div", { class: "fr-card-swipebg-down", html: SVG.arrowDown })
    );
    const surface = el("div", { class: "fr-card-surface" }, head, actionRow);
    card.append(swipeBg, surface);

    attachSwipeVote(card, surface, post, voteHooks);

    const open = (event) => {
      if (window.__fr.actions.shouldDeferToTarget(event.target)) return;
      if (card.classList.contains("fr-swiping")) return;
      window.__fr.actions.navigate(post.permalink);
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.__fr.actions.navigate(post.permalink);
      }
    });

    return card;
  }

  // Swipe-right-to-upvote / swipe-left-to-downvote on cards. Locks to
  // horizontal once we see clear horizontal intent so vertical scroll is
  // never starved. Threshold is fraction-of-card-width so it scales with
  // device size.
  function attachSwipeVote(card, surface, post, hooks) {
    const SWIPE_THRESHOLD = 0.22; // 22% of card width
    const VERTICAL_TOLERANCE = 12;
    const HORIZONTAL_GATE = 8;
    let startX = 0;
    let startY = 0;
    let dx = 0;
    let locked = null; // null | "h" | "v"
    let active = false;

    function onStart(e) {
      if (!e.touches || e.touches.length !== 1) return;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      dx = 0;
      locked = null;
      active = true;
      surface.style.transition = "none";
    }
    function onMove(e) {
      if (!active || !e.touches || e.touches.length !== 1) return;
      const t = e.touches[0];
      const ax = t.clientX - startX;
      const ay = t.clientY - startY;
      if (locked == null) {
        if (Math.abs(ay) > VERTICAL_TOLERANCE && Math.abs(ay) > Math.abs(ax)) {
          locked = "v";
          active = false;
          return;
        }
        if (Math.abs(ax) > HORIZONTAL_GATE) locked = "h";
      }
      if (locked !== "h") return;
      e.preventDefault();
      dx = ax;
      card.classList.add("fr-swiping");
      const damp = Math.sign(dx) * Math.min(Math.abs(dx), card.clientWidth * 0.5);
      surface.style.transform = "translateX(" + damp + "px)";
      const progress = Math.min(1, Math.abs(dx) / (card.clientWidth * SWIPE_THRESHOLD));
      card.classList.toggle("fr-swipe-up-armed", dx > 0 && progress >= 1);
      card.classList.toggle("fr-swipe-down-armed", dx < 0 && progress >= 1);
      card.style.setProperty("--fr-swipe-progress", String(progress));
    }
    function onEnd() {
      if (!active && locked !== "h") {
        return;
      }
      active = false;
      surface.style.transition = "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)";
      surface.style.transform = "translateX(0)";
      const armedUp = card.classList.contains("fr-swipe-up-armed");
      const armedDown = card.classList.contains("fr-swipe-down-armed");
      card.classList.remove("fr-swipe-up-armed", "fr-swipe-down-armed");
      card.style.removeProperty("--fr-swipe-progress");
      const wasSwipe = locked === "h" && Math.abs(dx) > 4;
      // Keep the swiping class on briefly so the click handler sees it.
      if (wasSwipe) {
        setTimeout(() => card.classList.remove("fr-swiping"), 100);
      } else {
        card.classList.remove("fr-swiping");
      }
      if (armedUp && hooks.applyState) {
        window.__fr.actions.castVote(post, "up", hooks.applyState);
      } else if (armedDown && hooks.applyState) {
        window.__fr.actions.castVote(post, "down", hooks.applyState);
      }
    }

    card.addEventListener("touchstart", onStart, { passive: true });
    card.addEventListener("touchmove", onMove, { passive: false });
    card.addEventListener("touchend", onEnd, { passive: true });
    card.addEventListener("touchcancel", onEnd, { passive: true });
  }

  function renderPagination(model) {
    if (!model.nextPageUrl && !model.prevPageUrl) return null;
    const wrap = el("nav", { class: "fr-pagination", attrs: { "aria-label": "Listing pagination" } });
    if (model.prevPageUrl) {
      wrap.appendChild(
        el("a", { class: "fr-page-prev", href: model.prevPageUrl, text: "Previous" })
      );
    }
    if (model.nextPageUrl) {
      wrap.appendChild(
        el(
          "a",
          {
            class: "fr-page-next",
            href: model.nextPageUrl,
          },
          "Next ",
          el("span", { class: "fr-page-next-icon", html: SVG.chevronRight })
        )
      );
    }
    return wrap;
  }

  function renderListing(model, mountInto) {
    const root = el("div", { class: "fr-listing" });
    const list = el("div", { class: "fr-cards" });
    for (const post of model.posts) {
      list.appendChild(renderCard(post));
    }
    root.appendChild(list);
    const pag = renderPagination(model);
    if (pag) root.appendChild(pag);
    mountInto.appendChild(root);

    const top = mountFloatingTopButton();

    return {
      dispose() {
        if (root.parentNode) root.parentNode.removeChild(root);
        if (top) top.dispose();
      },
    };
  }

  function mountFloatingTopButton() {
    const btn = el("button", {
      class: "fr-fab fr-fab-top",
      type: "button",
      attrs: { "aria-label": "Back to top" },
      html: SVG.arrowUp,
    });
    document.body.appendChild(btn);
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    let visible = false;
    function update() {
      const should = window.scrollY > 600;
      if (should === visible) return;
      visible = should;
      btn.classList.toggle("is-visible", visible);
    }
    window.addEventListener("scroll", update, { passive: true });
    return {
      dispose() {
        window.removeEventListener("scroll", update);
        if (btn.parentNode) btn.parentNode.removeChild(btn);
      },
    };
  }

  // ---------- Chrome: header + drawer ----------

  function parseSidebarInfo(vault) {
    // Look in old.reddit's `.side` for subscriber count, online count,
    // description. Returns null on the front page (no subreddit context).
    const side = vault.querySelector(".side");
    if (!side) return null;
    const subscribers = (() => {
      const sub = side.querySelector(".subscribers .subscribers, .subscribers");
      const t = sub ? (sub.textContent || "").match(/[\d,]+/) : null;
      return t ? t[0] : null;
    })();
    const online = (() => {
      const usersOnline = side.querySelector(".users-online .number, p.users-online");
      const t = usersOnline ? (usersOnline.textContent || "").match(/[\d,]+/) : null;
      return t ? t[0] : null;
    })();
    const titleEl = side.querySelector(".titlebox h1.redditname, .titlebox h1");
    const desc = side.querySelector(".titlebox .md");
    return {
      title: titleEl ? (titleEl.textContent || "").trim() : "",
      subscribers,
      online,
      descriptionHTML: desc ? desc.innerHTML : "",
    };
  }

  function renderHeader(state) {
    const SVG_MENU =
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
    const SVG_SEARCH =
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M16 16l4 4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
    const SVG_USER =
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

    const header = el("header", { class: "fr-header" });
    const path = location.pathname || "";
    const m = path.match(/^\/r\/([^\/]+)/);
    const isComments = /\/comments\//.test(path);

    let leadingBtn;
    if (isComments) {
      leadingBtn = el("button", {
        class: "fr-h-btn fr-h-back",
        type: "button",
        attrs: { "aria-label": "Back" },
        html: SVG.chevronLeft,
      });
      leadingBtn.addEventListener("click", () => {
        if (history.length > 1) history.back();
        else if (m) location.href = "/r/" + m[1] + "/";
        else location.href = "/";
      });
    } else {
      leadingBtn = el("button", {
        class: "fr-h-btn fr-h-menu",
        type: "button",
        attrs: { "aria-label": "Open menu" },
        html: SVG_MENU,
      });
      leadingBtn.addEventListener("click", () => state.openDrawer("nav"));
    }

    const brandText = m ? "r/" + m[1] : "reddit";
    const brand = el("a", {
      class: "fr-h-brand",
      href: m ? "/r/" + m[1] + "/" : "/",
      text: brandText,
    });

    const searchBtn = el("button", {
      class: "fr-h-btn fr-h-search",
      type: "button",
      attrs: { "aria-label": "Search" },
      html: SVG_SEARCH,
    });
    const accountBtn = el("button", {
      class: "fr-h-btn fr-h-account",
      type: "button",
      attrs: { "aria-label": "Account" },
      html: SVG_USER,
    });
    if (state.user && state.user.inboxUnread > 0) {
      accountBtn.appendChild(el("span", { class: "fr-h-dot", attrs: { "aria-hidden": "true" } }));
    }

    header.append(leadingBtn, brand, el("div", { class: "fr-h-spacer" }), searchBtn, accountBtn);

    searchBtn.addEventListener("click", () => state.openDrawer("search"));
    accountBtn.addEventListener("click", () => state.openDrawer("account"));

    return header;
  }

  function renderDrawer(state) {
    const drawer = el("aside", {
      class: "fr-drawer",
      attrs: { "aria-hidden": "true", role: "dialog", "aria-label": "Menu" },
    });
    const scrim = el("div", { class: "fr-drawer-scrim", attrs: { "aria-hidden": "true" } });
    const panel = el("div", { class: "fr-drawer-panel", attrs: { role: "document" } });

    const closeBtn = el("button", {
      class: "fr-drawer-close",
      type: "button",
      attrs: { "aria-label": "Close menu" },
      html: SVG.xmark,
    });

    panel.appendChild(closeBtn);

    const sections = el("div", { class: "fr-drawer-sections" });

    sections.appendChild(renderAccountSection(state));
    sections.appendChild(renderSearchSection(state));
    sections.appendChild(renderNavSection(state));
    if (state.sidebarInfo) {
      sections.appendChild(renderSidebarSection(state.sidebarInfo));
    }

    panel.appendChild(sections);
    drawer.append(scrim, panel);

    scrim.addEventListener("click", () => state.closeDrawer());
    closeBtn.addEventListener("click", () => state.closeDrawer());

    return drawer;
  }

  function renderAccountSection(state) {
    const sec = el("section", { class: "fr-d-section fr-d-account" });
    sec.appendChild(el("h3", { class: "fr-d-heading", text: "Account" }));
    const list = el("div", { class: "fr-d-list" });

    if (state.user && state.user.loggedIn) {
      list.appendChild(
        el("a", {
          class: "fr-d-row fr-d-user",
          href: "/user/" + (state.user.username || "") + "/",
          text: "u/" + (state.user.username || ""),
        })
      );
      const inboxText = state.user.inboxUnread > 0 ? "Inbox (" + state.user.inboxUnread + ")" : "Inbox";
      list.appendChild(
        el("a", {
          class:
            "fr-d-row fr-d-inbox" +
            (state.user.inboxUnread > 0 ? " fr-d-inbox-unread" : ""),
          href: "/message/inbox/",
          text: inboxText,
        })
      );
      list.appendChild(
        el("a", { class: "fr-d-row", href: state.user.preferencesUrl, text: "Preferences" })
      );
      const logoutBtn = el("button", {
        class: "fr-d-row fr-d-logout",
        type: "button",
        text: "Log out",
      });
      logoutBtn.addEventListener("click", () => {
        const form = state.user.logoutForm;
        if (form && typeof form.submit === "function") form.submit();
      });
      list.appendChild(logoutBtn);
    } else {
      list.appendChild(
        el("a", {
          class: "fr-d-row fr-d-primary",
          href: state.user ? state.user.loginUrl : "/login",
          text: "Log in",
        })
      );
      list.appendChild(
        el("a", {
          class: "fr-d-row fr-d-secondary",
          href: state.user ? state.user.registerUrl : "/register",
          text: "Sign up",
        })
      );
    }

    sec.appendChild(list);
    return sec;
  }

  function renderSearchSection(state) {
    const sec = el("section", { class: "fr-d-section fr-d-search" });
    sec.appendChild(el("h3", { class: "fr-d-heading", text: "Search" }));
    const path = location.pathname || "";
    const m = path.match(/^\/r\/([^\/]+)/);
    const action = m ? "/r/" + m[1] + "/search" : "/search";
    const form = el("form", {
      class: "fr-d-search-form",
      attrs: { action, method: "GET", role: "search" },
    });
    const input = el("input", {
      class: "fr-d-search-input",
      attrs: {
        type: "search",
        name: "q",
        placeholder: m ? "Search r/" + m[1] : "Search Reddit",
        autocomplete: "off",
      },
    });
    if (m) {
      const restrict = el("input", { attrs: { type: "hidden", name: "restrict_sr", value: "on" } });
      form.appendChild(restrict);
    }
    form.appendChild(input);
    sec.appendChild(form);
    state.drawerSearchInput = input;
    return sec;
  }

  function renderNavSection(state) {
    const sec = el("section", { class: "fr-d-section fr-d-nav" });
    sec.appendChild(el("h3", { class: "fr-d-heading", text: "Navigation" }));
    const list = el("div", { class: "fr-d-list" });
    const items = [
      { label: "Front", href: "/" },
      { label: "Popular", href: "/r/popular/" },
      { label: "All", href: "/r/all/" },
    ];
    if (state.user && state.user.loggedIn) {
      items.push({ label: "Saved", href: "/user/" + (state.user.username || "") + "/saved/" });
      items.push({ label: "Submitted", href: "/user/" + (state.user.username || "") + "/submitted/" });
    }
    items.forEach((item) => {
      list.appendChild(
        el("a", { class: "fr-d-row", href: item.href, text: item.label })
      );
    });
    sec.appendChild(list);
    return sec;
  }

  function renderSidebarSection(info) {
    const sec = el("section", { class: "fr-d-section fr-d-sidebar" });
    if (info.title) {
      sec.appendChild(el("h3", { class: "fr-d-heading", text: info.title }));
    } else {
      sec.appendChild(el("h3", { class: "fr-d-heading", text: "About" }));
    }
    const counts = [];
    if (info.subscribers) counts.push(info.subscribers + " members");
    if (info.online) counts.push(info.online + " online");
    if (counts.length) {
      sec.appendChild(el("p", { class: "fr-d-counts", text: counts.join(" · ") }));
    }
    if (info.descriptionHTML) {
      const desc = el("div", { class: "fr-d-desc", html: info.descriptionHTML });
      sec.appendChild(desc);
    }
    return sec;
  }

  function renderChrome(opts) {
    const fr = window.__fr;
    if (!fr || !fr.app) return null;
    const user = fr.parser ? fr.parser.parseUser(fr.vault) : null;
    const sidebarInfo = parseSidebarInfo(fr.vault);

    const state = {
      user,
      sidebarInfo,
      drawerSearchInput: null,
      openDrawer(focus) {
        document.documentElement.classList.add("fr-drawer-open");
        if (focus === "search" && state.drawerSearchInput) {
          setTimeout(() => state.drawerSearchInput.focus(), 50);
        }
      },
      closeDrawer() {
        document.documentElement.classList.remove("fr-drawer-open");
      },
    };

    const header = renderHeader(state);
    const drawer = renderDrawer(state);

    fr.app.prepend(header);
    document.body.appendChild(drawer);

    if (fr.flags && fr.flags.drawer) {
      state.openDrawer("nav");
    }

    return state;
  }

  // ---------- Comments ----------

  function renderOpMedia(post) {
    if (!post._el) return null;
    const expando = post._el.querySelector(".expando");
    if (!expando) return null;

    const videoNode = expando.querySelector(
      "[data-hls-url], [data-mpd-url]"
    );
    if (videoNode) {
      const hls = videoNode.getAttribute("data-hls-url");
      const w = parseInt(videoNode.getAttribute("data-video-width"), 10);
      const h = parseInt(videoNode.getAttribute("data-video-height"), 10);
      const src = hls || videoNode.getAttribute("data-mpd-url");
      if (src) {
        const video = el("video", {
          class: "fr-op-video",
          attrs: {
            src,
            controls: "",
            playsinline: "",
            preload: "metadata",
          },
          style:
            w && h ? { aspectRatio: w + " / " + h } : { aspectRatio: "16 / 9" },
        });
        return el("div", { class: "fr-op-media fr-op-media-video" }, video);
      }
    }

    const galleryPreviews = expando.querySelectorAll(
      ".gallery-preview .media-preview-content"
    );
    if (galleryPreviews.length) {
      const wrap = el("div", { class: "fr-op-gallery" });
      galleryPreviews.forEach((node) => {
        const img = node.querySelector("img.preview, img");
        if (!img || !img.src) return;
        const a = node.querySelector("a");
        const item = el("a", {
          class: "fr-op-gallery-item",
          href: (a && a.href) || img.src,
          attrs: { target: "_self" },
        });
        item.appendChild(
          el("img", {
            attrs: { src: img.src, alt: "", loading: "lazy" },
          })
        );
        wrap.appendChild(item);
      });
      if (wrap.firstChild) {
        return el("div", { class: "fr-op-media fr-op-media-gallery" }, wrap);
      }
    }

    const imagePreview = expando.querySelector(
      ".media-preview-content img.preview, .media-preview-content img"
    );
    if (imagePreview && imagePreview.src) {
      const linkA = imagePreview.closest("a");
      const wrap = el("a", {
        class: "fr-op-image-link",
        href: (linkA && linkA.href) || post.url,
        attrs: { target: "_self" },
      });
      wrap.appendChild(
        el("img", {
          class: "fr-op-image",
          attrs: { src: imagePreview.src, alt: "", loading: "lazy" },
        })
      );
      return el("div", { class: "fr-op-media fr-op-media-image" }, wrap);
    }

    return null;
  }

  function renderOpCard(post) {
    const card = el("article", { class: "fr-op-card" });
    const head = el("div", { class: "fr-op-head" });

    head.appendChild(el("h1", { class: "fr-op-title", text: post.title || "" }));

    const meta = el("div", { class: "fr-op-meta" });
    if (post.subreddit) {
      meta.appendChild(el("a", {
        class: "fr-op-sub",
        href: "/r/" + post.subreddit + "/",
        text: "r/" + post.subreddit,
      }));
    }
    if (post.author && !/^\[deleted\]?$/.test(post.author)) {
      meta.appendChild(el("a", {
        class: "fr-op-author",
        href: "/user/" + post.author + "/",
        text: "u/" + post.author,
      }));
    }
    if (post.ageText) {
      meta.appendChild(el("span", { class: "fr-op-age", text: compactAge(post.ageText) }));
    }
    if (post.domain && !/^self\./.test(post.domain)) {
      if (post.url) {
        meta.appendChild(el("a", {
          class: "fr-op-domain",
          href: post.url,
          text: post.domain,
        }));
      } else {
        meta.appendChild(el("span", { class: "fr-op-domain", text: post.domain }));
      }
    }
    head.appendChild(meta);
    card.appendChild(head);

    if (!post.isSelf && post.url) {
      const media = renderOpMedia(post);
      if (media) {
        card.appendChild(media);
      } else {
        const linkCard = el("a", {
          class: "fr-op-link",
          href: post.url,
          text: post.url,
        });
        card.appendChild(linkCard);
      }
    }

    if (post._el) {
      const body = post._el.querySelector(".expando .usertext-body .md, .usertext .usertext-body .md");
      if (body && body.innerHTML.trim()) {
        const wrap = el("div", { class: "fr-op-body fr-md", html: body.innerHTML });
        card.appendChild(wrap);
      }
    }

    const footer = el("div", { class: "fr-op-footer" });
    const vote = renderVoteGroup(post, { variant: "op" });
    footer.appendChild(vote.row);
    footer.appendChild(
      el("span", { class: "fr-op-comments-icon", html: SVG.bubble })
    );
    footer.appendChild(el("span", {
      class: "fr-op-comments",
      text: fmtCount(post.commentCount),
    }));
    const opShare = el("button", {
      class: "fr-action fr-action-share fr-op-share",
      type: "button",
      attrs: { "aria-label": "Share" },
      html: SVG.share,
    });
    opShare.addEventListener("click", (e) => {
      e.stopPropagation();
      const shareUrl = post.permalink ? location.origin + post.permalink : location.href;
      if (navigator.share) {
        navigator.share({ title: post.title, url: shareUrl }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).catch(() => {});
      }
    });
    footer.appendChild(opShare);
    card.appendChild(footer);

    return card;
  }

  function renderSortControl(model) {
    if (!model.sortOptions || !model.sortOptions.length) return null;
    const selected = model.sortOptions.find((o) => o.selected);
    const button = el("button", {
      class: "fr-sort-button",
      type: "button",
      attrs: { "aria-haspopup": "dialog" },
    });
    button.appendChild(el("span", { class: "fr-sort-label", text: "Sort:" }));
    button.appendChild(el("span", {
      class: "fr-sort-current",
      text: (selected && selected.label) || (model.sortOptions[0] && model.sortOptions[0].label) || "top",
    }));
    button.appendChild(el("span", { class: "fr-sort-chevron", html: SVG.chevronDown }));
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      openActionSheet({
        title: "Sort comments",
        options: model.sortOptions,
        onSelect: (opt) => {
          if (opt && opt.value) location.href = opt.value;
        },
        cancelLabel: "Cancel",
      });
    });
    const wrap = el("div", { class: "fr-sort-wrap" });
    wrap.appendChild(button);
    return wrap;
  }

  function openActionSheet(opts) {
    const root = el("div", { class: "fr-sheet", attrs: { role: "dialog" } });
    const scrim = el("div", { class: "fr-sheet-scrim" });
    const panel = el("div", { class: "fr-sheet-panel" });
    panel.appendChild(el("div", { class: "fr-sheet-handle", attrs: { "aria-hidden": "true" } }));
    if (opts.title) {
      panel.appendChild(el("div", { class: "fr-sheet-title", text: opts.title }));
    }
    const list = el("div", { class: "fr-sheet-list" });
    (opts.options || []).forEach((opt) => {
      const row = el("button", {
        class: "fr-sheet-row" + (opt.selected ? " is-selected" : ""),
        type: "button",
        text: opt.label,
      });
      row.addEventListener("click", () => {
        close();
        if (opts.onSelect) opts.onSelect(opt);
      });
      list.appendChild(row);
    });
    panel.appendChild(list);
    if (opts.cancelLabel) {
      const cancel = el("button", {
        class: "fr-sheet-cancel",
        type: "button",
        text: opts.cancelLabel,
      });
      cancel.addEventListener("click", () => close());
      panel.appendChild(cancel);
    }
    root.append(scrim, panel);
    document.body.appendChild(root);
    requestAnimationFrame(() => root.classList.add("is-open"));

    function close() {
      root.classList.remove("is-open");
      setTimeout(() => {
        if (root.parentNode) root.parentNode.removeChild(root);
      }, 240);
    }
    scrim.addEventListener("click", close);
    return { close };
  }

  function renderComment(node) {
    if (node.isLoadMore) {
      return renderLoadMoreRow(node);
    }
    const wrap = el("div", {
      class: "fr-comment" + (node.isDeleted ? " fr-comment-deleted" : ""),
      attrs: { "data-fr-depth": String(node.depth % 6) },
    });

    const head = el("div", { class: "fr-c-head" });
    if (node.author) {
      head.appendChild(el("a", {
        class: "fr-c-author",
        href: "/user/" + node.author + "/",
        text: "u/" + node.author,
      }));
    }
    (node.flairs || []).forEach((f) => {
      head.appendChild(el("span", {
        class: "fr-c-flair fr-c-flair-" + f.toLowerCase(),
        text: f,
      }));
    });
    const metaParts = [];
    if (node.score != null) metaParts.push(fmtScore(node.score));
    if (node.ageText) metaParts.push(compactAge(node.ageText));
    if (metaParts.length) {
      head.appendChild(el("span", { class: "fr-c-meta", text: metaParts.join(" · ") }));
    }

    const toggle = el("button", {
      class: "fr-c-toggle",
      type: "button",
      attrs: { "aria-label": "Collapse thread" },
      text: "−",
    });
    head.appendChild(toggle);

    const body = el("div", { class: "fr-c-body fr-md", html: node.body || "" });
    const actionRow = renderCommentActions(node);

    let childrenWrap = null;
    if (node.children && node.children.length) {
      childrenWrap = el("div", { class: "fr-c-children" });
      node.children.forEach((child) => {
        childrenWrap.appendChild(renderComment(child));
      });
    }

    wrap.append(head, body, actionRow);
    if (childrenWrap) wrap.appendChild(childrenWrap);

    function setCollapsed(collapsed) {
      wrap.classList.toggle("fr-c-collapsed", collapsed);
      toggle.textContent = collapsed ? "+" : "−";
      toggle.setAttribute(
        "aria-label",
        collapsed ? "Expand thread" : "Collapse thread"
      );
    }
    let collapsed = false;
    function flip() {
      collapsed = !collapsed;
      setCollapsed(collapsed);
    }
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      flip();
    });
    head.addEventListener("click", (e) => {
      if (e.target instanceof Element && e.target.closest("a, button, input, select, textarea")) {
        return;
      }
      flip();
    });

    return wrap;
  }

  function renderCommentActions(node) {
    const row = el("div", { class: "fr-c-actions" });
    const vote = renderVoteGroup(node, { variant: "comment" });
    row.appendChild(vote.row);

    if (node.replyUrl) {
      row.appendChild(el("a", {
        class: "fr-c-reply",
        href: node.replyUrl,
        text: "Reply",
      }));
    }

    const more = el("button", {
      class: "fr-c-more",
      type: "button",
      attrs: { "aria-label": "More" },
      html: SVG.moreH,
    });
    more.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
    });
    row.appendChild(more);
    return row;
  }

  function renderLoadMoreRow(node) {
    const a = el("a", {
      class: "fr-c-loadmore",
      href: node.loadMoreUrl || "#",
      attrs: { "data-fr-depth": String(node.depth % 6) },
      text: node.label || "load more comments",
    });
    return a;
  }

  function renderComments(model, mountInto) {
    const root = el("div", { class: "fr-comments" });
    if (model.post) {
      root.appendChild(renderOpCard(model.post));
    }
    const sort = renderSortControl(model);
    if (sort) root.appendChild(sort);

    const list = el("div", { class: "fr-c-list" });
    model.comments.forEach((c) => list.appendChild(renderComment(c)));
    root.appendChild(list);

    if (model.loadMoreUrl) {
      root.appendChild(
        el("a", {
          class: "fr-c-loadmore fr-c-loadmore-bottom",
          href: model.loadMoreUrl,
          text: "load more comments",
        })
      );
    }

    mountInto.appendChild(root);
    return {
      dispose() {
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  }

  window.__fr.render = Object.assign(window.__fr.render || {}, {
    renderListing,
    renderChrome,
    renderComments,
  });
})();
