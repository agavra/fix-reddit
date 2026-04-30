(function () {
  if (!window.__fr) window.__fr = {};

  function buildFormBody(form) {
    const body = new URLSearchParams();
    const fields = form.querySelectorAll("input[name]");
    fields.forEach((input) => {
      if (!input.name) return;
      if (input.type === "checkbox" || input.type === "radio") {
        if (input.checked) body.append(input.name, input.value || "");
      } else {
        body.append(input.name, input.value || "");
      }
    });
    return body;
  }

  // Submit a vote form via fetch so we don't navigate away.
  // direction: 1 for up, -1 for down, 0 for unvote.
  async function submitVote(form, direction) {
    if (!(form instanceof HTMLFormElement)) {
      return { ok: false, reason: "no-form" };
    }
    const body = buildFormBody(form);
    body.set("dir", String(direction));
    const action = form.action || "";
    if (!action) return { ok: false, reason: "no-action" };

    try {
      const res = await fetch(action, {
        method: form.method || "POST",
        body,
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      return { ok: res.ok };
    } catch (e) {
      return { ok: false, reason: "network", error: e };
    }
  }

  // Cast a vote on a post or comment. Optimistic UI; reverts on failure.
  // model.voteForm = { up: <form>, down: <form> } (or null when logged out)
  // direction: 'up' | 'down' | 'unvote'
  // onUpdate(state): called with { dir: -1|0|1, score: number|null }
  async function castVote(model, direction, onUpdate) {
    if (!model || !model.voteForm) {
      if (onUpdate) onUpdate({ dir: 0, score: model ? model.score : null });
      return { ok: false, reason: "logged-out" };
    }
    const wantsDir = direction === "up" ? 1 : direction === "down" ? -1 : 0;
    const currentDir = model._voteDir || 0;
    const newDir = wantsDir === currentDir ? 0 : wantsDir;
    const baseScore =
      typeof model._baseScore === "number"
        ? model._baseScore
        : model.score == null
        ? null
        : model.score - currentDir;
    model._baseScore = baseScore;
    const newScore = baseScore == null ? null : baseScore + newDir;
    model._voteDir = newDir;
    if (onUpdate) onUpdate({ dir: newDir, score: newScore });

    const targetForm =
      newDir === 1 ? model.voteForm.up : newDir === -1 ? model.voteForm.down : model.voteForm.up;
    if (!(targetForm instanceof HTMLFormElement)) {
      return { ok: false, reason: "no-form" };
    }
    const result = await submitVote(targetForm, newDir);
    if (!result.ok) {
      // Revert
      model._voteDir = currentDir;
      const revertScore = baseScore == null ? null : baseScore + currentDir;
      if (onUpdate) onUpdate({ dir: currentDir, score: revertScore });
    }
    return result;
  }

  function navigate(url) {
    if (!url) return;
    location.href = url;
  }

  function shouldDeferToTarget(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(
      target.closest("a, button, input, select, textarea, .fr-vote, .fr-thumb")
    );
  }

  window.__fr.actions = {
    castVote,
    navigate,
    shouldDeferToTarget,
  };
})();
