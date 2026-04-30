(function () {
  if (!window.__fr) {
    window.__fr = {};
  }

  function text(el) {
    return el ? (el.textContent || "").trim() : "";
  }

  function attr(el, name) {
    return el && el.getAttribute ? el.getAttribute(name) : null;
  }

  function intOrNull(value) {
    if (value == null || value === "") return null;
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : null;
  }

  function findCsrf(root) {
    const input = root.querySelector('input[name="uh"]');
    const value = input ? attr(input, "value") : null;
    return value && value.length ? value : null;
  }

  function parseUser(root) {
    const headerRight = root.querySelector("#header-bottom-right");
    const logoutForm = root.querySelector("form.logout");
    const userBody = root.querySelector("body");
    const loggedIn =
      Boolean(logoutForm) ||
      (userBody && userBody.classList && userBody.classList.contains("loggedin"));

    let username = null;
    if (loggedIn && headerRight) {
      const userLink = headerRight.querySelector(".user a, .user-summary a");
      const t = text(userLink);
      if (t) username = t.replace(/^u\//, "");
    }

    const messageCount = root.querySelector("#header .message-count, .message-count");
    const inboxUnread = intOrNull(text(messageCount)) || 0;

    // Always send users to old.reddit's own login/register pages. The
    // anchors that old.reddit serves point at www.reddit.com which 403s
    // for our user agent — so we ignore the parsed href.
    return {
      loggedIn: Boolean(loggedIn),
      username,
      inboxUnread,
      csrfToken: findCsrf(root),
      loginUrl: "https://old.reddit.com/login",
      registerUrl: "https://old.reddit.com/register",
      logoutForm: logoutForm || null,
      preferencesUrl: "/prefs/",
    };
  }

  function parseAge(thing) {
    const time = thing.querySelector(".tagline time");
    if (time) {
      const live = time.textContent ? time.textContent.trim() : "";
      if (live) return live;
      const dt = attr(time, "datetime");
      if (dt) return dt;
    }
    return "";
  }

  function parseThumbnail(thing) {
    const a = thing.querySelector("a.thumbnail");
    if (!a) return null;
    const img = a.querySelector("img");
    if (img && img.src) return img.src;
    const bg = a.style && a.style.backgroundImage;
    if (bg && bg !== "none") {
      const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
      if (m) return m[1];
    }
    return null;
  }

  function parseFlair(thing) {
    const flair = thing.querySelector(".linkflairlabel");
    return text(flair) || null;
  }

  function parseVoteForms(thing) {
    const up = thing.querySelector(".midcol .arrow.up, .midcol form .up, form .arrow.up");
    const down = thing.querySelector(".midcol .arrow.down, .midcol form .down, form .arrow.down");
    if (!up && !down) return null;
    return {
      up: up ? up.closest("form") || up : null,
      down: down ? down.closest("form") || down : null,
    };
  }

  function postFromThing(thing) {
    const id = attr(thing, "data-fullname") || attr(thing, "id") || "";
    const titleA = thing.querySelector("a.title");
    const titleText = text(titleA);
    const url = (titleA && titleA.href) || attr(thing, "data-url") || "";
    const permalink = attr(thing, "data-permalink") || "";
    const author = attr(thing, "data-author") || "";
    const subredditPrefixed = attr(thing, "data-subreddit-prefixed") || "";
    const subreddit =
      subredditPrefixed.replace(/^\/?r\//, "") ||
      attr(thing, "data-subreddit") ||
      "";
    const ageText = parseAge(thing);
    const score = intOrNull(attr(thing, "data-score"));
    const commentCount = intOrNull(attr(thing, "data-comments-count")) || 0;
    const domain = attr(thing, "data-domain") || "";
    const isSelf = /^self\./.test(domain) || thing.classList.contains("self");
    const isNsfw =
      attr(thing, "data-nsfw") === "true" || thing.classList.contains("over18");
    const isStickied = thing.classList.contains("stickied");
    const isPromoted =
      attr(thing, "data-promoted") === "true" ||
      thing.classList.contains("promoted");
    const isGallery = attr(thing, "data-is-gallery") === "true";

    return {
      id,
      title: titleText,
      url,
      permalink,
      author,
      subreddit,
      ageText,
      score,
      commentCount,
      domain,
      thumbnail: parseThumbnail(thing),
      isSelf,
      isNsfw,
      isStickied,
      isPromoted,
      isGallery,
      flair: parseFlair(thing),
      voteForm: parseVoteForms(thing),
      _el: thing,
    };
  }

  function parsePagename(root) {
    const path = location.pathname || "";
    const m = path.match(/^\/r\/([^\/]+)/);
    if (m) return "r/" + m[1];
    return "reddit";
  }

  function parseListing(root) {
    const sitetable =
      root.querySelector("#siteTable") ||
      root.querySelector(".sitetable.linklisting") ||
      root.querySelector(".sitetable");
    const posts = [];

    if (sitetable) {
      const things = sitetable.querySelectorAll(":scope > .thing");
      things.forEach((thing) => {
        if (attr(thing, "data-promoted") === "true") return;
        const post = postFromThing(thing);
        if (post.title) posts.push(post);
      });
    }

    const nextprev = root.querySelector(".nextprev");
    let nextPageUrl = null;
    let prevPageUrl = null;
    if (nextprev) {
      const next = nextprev.querySelector('a[rel*="next"]');
      const prev = nextprev.querySelector('a[rel*="prev"]');
      nextPageUrl = next ? next.href : null;
      prevPageUrl = prev ? prev.href : null;
    }

    return {
      pagename: parsePagename(root),
      posts,
      nextPageUrl,
      prevPageUrl,
    };
  }

  function parseSortOptions(root) {
    // old.reddit comments page: `.menuarea .lightdrop` link list inside `.dropdown.lightdrop`.
    // Each option is an `<a>` with text label and href.
    const out = [];
    const selectedText = text(
      root.querySelector(".commentarea .menuarea .selected")
    );
    const choices = root.querySelectorAll(
      ".commentarea .menuarea .dropdown.lightdrop a, .commentarea .menuarea .drop-choices a, .menuarea .drop-choices.lightdrop a"
    );
    choices.forEach((a) => {
      const label = text(a);
      if (!label) return;
      out.push({
        value: a.href,
        label,
        selected: selectedText
          ? label.toLowerCase() === selectedText.toLowerCase()
          : false,
      });
    });
    return out;
  }

  function commentVoteForms(commentEl) {
    const midcol = commentEl.querySelector(":scope > .entry .midcol");
    if (!midcol) return null;
    const up = midcol.querySelector(".arrow.up");
    const down = midcol.querySelector(".arrow.down");
    if (!up && !down) return null;
    return {
      up: up ? up.closest("form") || up : null,
      down: down ? down.closest("form") || down : null,
    };
  }

  function commentBody(commentEl) {
    const md = commentEl.querySelector(":scope > .entry .usertext-body .md");
    return md ? md.innerHTML : "";
  }

  function commentFlairs(commentEl) {
    const tag = commentEl.querySelector(":scope > .entry .tagline");
    if (!tag) return [];
    const flairs = [];
    if (tag.querySelector(".submitter")) flairs.push("OP");
    const dist = tag.querySelector(".author");
    if (dist && /\bmoderator\b/i.test(dist.className || "")) flairs.push("MOD");
    if (dist && /\badmin\b/i.test(dist.className || "")) flairs.push("ADMIN");
    return flairs;
  }

  function buildCommentNode(commentEl, depth) {
    const id = attr(commentEl, "data-fullname") || attr(commentEl, "id") || "";
    const tagline = commentEl.querySelector(":scope > .entry .tagline");
    const authorA = tagline ? tagline.querySelector(".author") : null;
    const isDeleted =
      commentEl.classList.contains("deleted") ||
      (!authorA && tagline && /\[deleted\]/.test(text(tagline)));
    const author = text(authorA) || (isDeleted ? "[deleted]" : "");
    const ageText = (() => {
      if (!tagline) return "";
      const times = tagline.querySelectorAll("time");
      const main = times[0] ? text(times[0]) : "";
      const edited = times[1] ? "edited " + text(times[1]) : "";
      return edited ? main + " · " + edited : main;
    })();
    const scoreEl =
      commentEl.querySelector(":scope > .entry .tagline .score.unvoted") ||
      commentEl.querySelector(":scope > .entry .midcol .score.unvoted");
    const scoreRaw = text(scoreEl);
    let score = null;
    if (scoreRaw) {
      const m = scoreRaw.match(/-?\d+/);
      if (m) score = parseInt(m[0], 10);
    }
    const permalinkA = commentEl.querySelector(
      ':scope > .entry a.bylink[href*="/comments/"]'
    );
    const permalink = (permalinkA && permalinkA.href) || "";
    const replyA = commentEl.querySelector(
      ':scope > .entry ul.flat-list .reply-button a, :scope > .entry .reply-button a'
    );
    const replyUrl = (replyA && replyA.href) || "";

    const children = [];
    const childList = commentEl.querySelector(":scope > .child > .sitetable");
    if (childList) {
      childList.querySelectorAll(":scope > .thing").forEach((node) => {
        if (node.classList.contains("comment")) {
          children.push(buildCommentNode(node, depth + 1));
        } else if (node.classList.contains("morechildren")) {
          const moreA = node.querySelector("a");
          children.push({
            id: attr(node, "id") || "",
            author: "",
            ageText: "",
            score: null,
            body: "",
            permalink: "",
            voteForm: null,
            replyUrl: "",
            flairs: [],
            children: [],
            depth: depth + 1,
            loadMoreUrl: (moreA && moreA.href) || "",
            isLoadMore: true,
            label: text(node) || "load more comments",
            _el: node,
          });
        }
      });
    }

    return {
      id,
      author,
      ageText,
      score,
      body: commentBody(commentEl),
      permalink,
      voteForm: commentVoteForms(commentEl),
      replyUrl,
      flairs: commentFlairs(commentEl),
      children,
      depth,
      loadMoreUrl: null,
      isLoadMore: false,
      isDeleted,
      _el: commentEl,
    };
  }

  function parseComments(root) {
    const sitetable =
      root.querySelector(".commentarea .sitetable.nestedlisting") ||
      root.querySelector(".commentarea .sitetable") ||
      root.querySelector(".commentarea");

    let post = null;
    const opThing = root.querySelector("#siteTable .thing.link, .content .sitetable.linklisting .thing.link");
    if (opThing) post = postFromThing(opThing);

    const comments = [];
    if (sitetable) {
      sitetable.querySelectorAll(":scope > .thing").forEach((node) => {
        if (node.classList.contains("comment")) {
          comments.push(buildCommentNode(node, 0));
        }
      });
    }

    let loadMoreUrl = null;
    const topMore = root.querySelector(".commentarea > .sitetable > .morechildren a, .commentarea .morechildren a");
    if (topMore) loadMoreUrl = topMore.href;

    return {
      post,
      sortOptions: parseSortOptions(root),
      comments,
      loadMoreUrl,
    };
  }

  window.__fr.parser = {
    parseUser,
    parseListing,
    parseComments,
  };
})();
