(function () {
  if (!window.__fr) window.__fr = {};

  const SVG = {
    chevronUp:
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chevronDown:
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chevronRight:
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    speech:
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    moreH:
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="6" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="18" cy="12" r="1.6" fill="currentColor"/></svg>',
    image:
      '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="1.4" fill="currentColor"/><path d="M5 17l4-4 3 3 4-4 3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
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

  function renderVoteColumn(post) {
    const actions = window.__fr.actions;
    const up = el("button", {
      class: "fr-vote fr-vote-up",
      type: "button",
      attrs: { "aria-label": "Upvote" },
      html: SVG.chevronUp,
    });
    const down = el("button", {
      class: "fr-vote fr-vote-down",
      type: "button",
      attrs: { "aria-label": "Downvote" },
      html: SVG.chevronDown,
    });
    const score = el("div", {
      class: "fr-score",
      text: fmtScore(post.score),
    });
    const col = el("div", { class: "fr-votecol" }, up, score, down);

    function applyState({ dir, score: s }) {
      col.classList.toggle("fr-voted-up", dir === 1);
      col.classList.toggle("fr-voted-down", dir === -1);
      score.textContent = fmtScore(s);
    }

    up.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      actions.castVote(post, "up", applyState);
    });
    down.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      actions.castVote(post, "down", applyState);
    });
    return col;
  }

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
      return el(
        "a",
        {
          class: "fr-thumb fr-thumb-self",
          href: post.permalink || "#",
        },
        el("span", { class: "fr-thumb-tag", text: "TEXT" })
      );
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
    return el(
      "a",
      {
        class: "fr-thumb fr-thumb-link",
        href: post.url || post.permalink,
      },
      el("span", { class: "fr-thumb-tag", text: "LINK" })
    );
  }

  function renderTagline(post) {
    const subA = el("a", {
      class: "fr-meta-sub",
      href: "/r/" + post.subreddit + "/",
      text: "r/" + post.subreddit,
    });
    const authorA = el("a", {
      class: "fr-meta-author",
      href: "/user/" + post.author + "/",
      text: "u/" + post.author,
    });
    const ageEl = el("span", {
      class: "fr-meta-age",
      text: post.ageText || "",
    });
    const domain = post.domain || "";
    const items = [subA, sep(), authorA, sep(), ageEl];
    if (domain) {
      items.push(sep());
      const isExternal = !/^self\./.test(domain);
      if (isExternal && post.url) {
        items.push(
          el("a", {
            class: "fr-meta-domain",
            href: post.url,
            attrs: { target: "_self" },
            text: domain,
          })
        );
      } else {
        items.push(el("span", { class: "fr-meta-domain", text: domain }));
      }
    }
    return el("div", { class: "fr-tagline" }, ...items);
  }

  function sep() {
    return el("span", { class: "fr-sep", attrs: { "aria-hidden": "true" }, text: "·" });
  }

  function renderActionRow(post) {
    const comments = el(
      "a",
      {
        class: "fr-action fr-action-comments",
        href: post.permalink,
        attrs: { "aria-label": post.commentCount + " comments" },
      },
      el("span", { class: "fr-action-icon", html: SVG.speech }),
      el("span", {
        class: "fr-action-label",
        text: fmtCount(post.commentCount) + " comments",
      })
    );
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
    return el("div", { class: "fr-actions" }, comments, more);
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

    const body = el(
      "div",
      { class: "fr-card-body" },
      titleA,
      renderTagline(post),
      renderActionRow(post)
    );

    const layout = el(
      "div",
      { class: "fr-card-layout" },
      renderVoteColumn(post),
      renderThumb(post),
      body
    );

    card.appendChild(layout);

    const open = (event) => {
      if (window.__fr.actions.shouldDeferToTarget(event.target)) return;
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
    return {
      dispose() {
        if (root.parentNode) root.parentNode.removeChild(root);
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
    const menuBtn = el("button", {
      class: "fr-h-btn fr-h-menu",
      type: "button",
      attrs: { "aria-label": "Open menu" },
      html: SVG_MENU,
    });
    const path = location.pathname || "";
    const m = path.match(/^\/r\/([^\/]+)/);
    const isFrontpage = !m;
    const brand = el(
      "a",
      {
        class: "fr-h-brand",
        href: m ? "/r/" + m[1] + "/" : "/",
      },
      isFrontpage
        ? el("span", { class: "fr-h-brand-name", text: "reddit" })
        : (() => {
            const w = el("span", { class: "fr-h-brand-pair" });
            w.appendChild(el("span", { class: "fr-h-brand-r", text: "r" }));
            w.appendChild(el("span", { class: "fr-h-brand-slash", text: "/" }));
            w.appendChild(el("span", { class: "fr-h-brand-sub", text: m[1] }));
            return w;
          })()
    );

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
      const dot = el("span", { class: "fr-h-dot", attrs: { "aria-hidden": "true" } });
      accountBtn.appendChild(dot);
    }

    header.append(menuBtn, brand, el("div", { class: "fr-h-spacer" }), searchBtn, accountBtn);

    menuBtn.addEventListener("click", () => state.openDrawer("nav"));
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
      text: "Close",
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

  function renderOpCard(post) {
    const card = el("article", { class: "fr-op-card" });
    const head = el("div", { class: "fr-op-head" });

    head.appendChild(el("h1", { class: "fr-op-title", text: post.title || "" }));

    const meta = el("div", { class: "fr-op-meta" });
    meta.appendChild(el("a", {
      class: "fr-op-sub",
      href: "/r/" + post.subreddit + "/",
      text: "r/" + post.subreddit,
    }));
    meta.appendChild(sep());
    meta.appendChild(el("a", {
      class: "fr-op-author",
      href: "/user/" + post.author + "/",
      text: "u/" + post.author,
    }));
    meta.appendChild(sep());
    meta.appendChild(el("span", { class: "fr-op-age", text: post.ageText || "" }));
    if (post.domain) {
      meta.appendChild(sep());
      const isExternal = !/^self\./.test(post.domain);
      if (isExternal && post.url) {
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
      const linkCard = el("a", {
        class: "fr-op-link",
        href: post.url,
        text: post.url,
      });
      card.appendChild(linkCard);
    }

    if (post._el) {
      const body = post._el.querySelector(".expando .usertext-body .md, .usertext .usertext-body .md");
      if (body && body.innerHTML.trim()) {
        const wrap = el("div", { class: "fr-op-body fr-md", html: body.innerHTML });
        card.appendChild(wrap);
      }
    }

    const footer = el("div", { class: "fr-op-footer" });
    const vote = renderVoteColumnInline(post);
    footer.appendChild(vote);
    footer.appendChild(el("span", {
      class: "fr-op-comments",
      text: fmtCount(post.commentCount) + " comments",
    }));
    card.appendChild(footer);

    return card;
  }

  function renderVoteColumnInline(post) {
    const actions = window.__fr.actions;
    const row = el("div", { class: "fr-op-vote" });
    const up = el("button", {
      class: "fr-vote fr-vote-up",
      type: "button",
      attrs: { "aria-label": "Upvote" },
      html: SVG.chevronUp,
    });
    const down = el("button", {
      class: "fr-vote fr-vote-down",
      type: "button",
      attrs: { "aria-label": "Downvote" },
      html: SVG.chevronDown,
    });
    const score = el("span", {
      class: "fr-op-score",
      text: fmtScore(post.score),
    });
    row.append(up, score, down);

    function applyState({ dir, score: s }) {
      row.classList.toggle("fr-voted-up", dir === 1);
      row.classList.toggle("fr-voted-down", dir === -1);
      score.textContent = fmtScore(s);
    }
    up.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      actions.castVote(post, "up", applyState);
    });
    down.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      actions.castVote(post, "down", applyState);
    });
    return row;
  }

  function renderSortControl(model) {
    if (!model.sortOptions || !model.sortOptions.length) return null;
    const sel = el("select", { class: "fr-sort" });
    model.sortOptions.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      if (opt.selected) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", () => {
      const url = sel.value;
      if (url) location.href = url;
    });
    const wrap = el("div", { class: "fr-sort-wrap" });
    wrap.appendChild(el("label", { class: "fr-sort-label", text: "Sort:" }));
    wrap.appendChild(sel);
    return wrap;
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
      const a = el("a", {
        class: "fr-c-author",
        href: "/user/" + node.author + "/",
        text: "u/" + node.author,
      });
      head.appendChild(a);
    }
    const flairs = node.flairs || [];
    flairs.forEach((f) => {
      const cls =
        "fr-c-flair fr-c-flair-" + f.toLowerCase();
      head.appendChild(el("span", { class: cls, text: f }));
    });
    if (node.score != null) {
      head.appendChild(sep());
      head.appendChild(el("span", {
        class: "fr-c-score",
        text: fmtScore(node.score) + " pts",
      }));
    }
    if (node.ageText) {
      head.appendChild(sep());
      head.appendChild(el("span", { class: "fr-c-age", text: node.ageText }));
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
    const actions = window.__fr.actions;

    const up = el("button", {
      class: "fr-vote fr-vote-up fr-c-vote",
      type: "button",
      attrs: { "aria-label": "Upvote" },
      html: SVG.chevronUp,
    });
    const score = el("span", {
      class: "fr-c-score-inline",
      text: node.score != null ? fmtScore(node.score) : "•",
    });
    const down = el("button", {
      class: "fr-vote fr-vote-down fr-c-vote",
      type: "button",
      attrs: { "aria-label": "Downvote" },
      html: SVG.chevronDown,
    });
    function applyState({ dir, score: s }) {
      row.classList.toggle("fr-voted-up", dir === 1);
      row.classList.toggle("fr-voted-down", dir === -1);
      score.textContent = s != null ? fmtScore(s) : "•";
    }
    up.addEventListener("click", (e) => {
      e.stopPropagation();
      actions.castVote(node, "up", applyState);
    });
    down.addEventListener("click", (e) => {
      e.stopPropagation();
      actions.castVote(node, "down", applyState);
    });

    row.append(up, score, down);

    if (node.replyUrl) {
      const reply = el("a", {
        class: "fr-c-reply",
        href: node.replyUrl,
        text: "Reply",
      });
      row.appendChild(reply);
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
