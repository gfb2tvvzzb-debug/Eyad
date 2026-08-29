(function () {
  function collectFormAnswers(form) {
    const fields = {};
    const fd = new FormData(form);
    fd.forEach((value, key) => {
      const next = value == null ? '' : String(value);
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        if (!Array.isArray(fields[key])) fields[key] = [fields[key]];
        fields[key].push(next);
      } else {
        fields[key] = next;
      }
    });

    const pills = {};
    form.querySelectorAll('.pill-group[data-group]').forEach((group) => {
      const active = group.querySelector('.pill.active');
      pills[group.dataset.group] = active ? active.dataset.value : '';
    });

    const chips = {};
    form.querySelectorAll('.chip-grid[data-group]').forEach((grid) => {
      chips[grid.dataset.group] = Array.from(grid.querySelectorAll('.chip.active')).map((chip) => chip.dataset.value);
    });

    const radios = {};
    form.querySelectorAll('.radio-dot.active[data-group]').forEach((dot) => {
      radios[dot.dataset.group] = dot.dataset.value || '';
    });

    const pain = Array.from(form.querySelectorAll('.pain-item.active')).map((item) => item.dataset.value);

    return { fields, pills, chips, radios, pain };
  }

  async function saveAssignment(options) {
    const res = await fetch('/api/assignments', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignmentKey: options.assignmentKey,
        payload: options.payload,
        summary: options.summary || '',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Could not save the assignment.');
      err.status = res.status;
      throw err;
    }
    return data.submission;
  }

  let thanksCopy;

  function snapshotThanks() {
    const overlay = document.getElementById('thanksOverlay');
    if (!overlay || thanksCopy) return;
    const title = overlay.querySelector('h3');
    const copy = overlay.querySelector('p');
    thanksCopy = {
      title: title ? title.textContent : '',
      copy: copy ? copy.textContent : '',
    };
  }

  function restoreThanks() {
    const overlay = document.getElementById('thanksOverlay');
    if (!overlay || !thanksCopy) return;
    const title = overlay.querySelector('h3');
    const copy = overlay.querySelector('p');
    if (title) title.textContent = thanksCopy.title;
    if (copy) copy.textContent = thanksCopy.copy;
  }

  function showSaveError(message) {
    snapshotThanks();
    const overlay = document.getElementById('thanksOverlay');
    const title = overlay && overlay.querySelector('h3');
    const copy = overlay && overlay.querySelector('p');
    if (title) title.textContent = 'Could Not Save';
    if (copy) copy.textContent = message;
    if (overlay) overlay.classList.add('active');
    else window.alert(message);
  }

  async function saveFormAssignment(form, assignmentKey, summary) {
    try {
      await saveAssignment({
        assignmentKey,
        payload: collectFormAnswers(form),
        summary,
      });
      restoreThanks();
      return true;
    } catch (err) {
      const message = err.status === 401
        ? 'Sign in first, then submit this assignment again so it is saved to your profile.'
        : (err.message || 'Could not save the assignment.');
      showSaveError(message);
      return false;
    }
  }

  window.EBForms = {
    collectFormAnswers,
    saveAssignment,
    saveFormAssignment,
    showSaveError,
  };
})();
