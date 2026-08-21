(function () {
  function initPillGroups() {
    document.querySelectorAll('.pill-group').forEach((group) => {
      if (group.dataset.sharedBound === 'true') return;
      group.dataset.sharedBound = 'true';
      group.querySelectorAll('.pill').forEach((pill) => {
        if (pill.dataset.sharedBound === 'true') return;
        pill.dataset.sharedBound = 'true';
        pill.addEventListener('click', () => {
          group.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
          pill.classList.add('active');

          if (group.dataset.reveal) {
            const target = document.getElementById(group.dataset.reveal);
            if (target) {
              target.classList.toggle('open', pill.dataset.value === 'Yes');
            }
          }
        });
      });
    });
  }

  function initChipGrids() {
    document.querySelectorAll('.chip-grid[data-items]').forEach((grid) => {
      if (grid.dataset.initialized === 'true') return;
      grid.dataset.initialized = 'true';
      if (grid.children.length) return;
      const items = grid.dataset.items.split('|');
      items.forEach((label) => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.dataset.value = label.trim();
        chip.innerHTML = '<div class="box"></div><span class="label">' + label.trim() + '</span>';
        chip.addEventListener('click', () => chip.classList.toggle('active'));
        grid.appendChild(chip);
      });
    });
  }

  function initWizard() {
    if (document.querySelectorAll('.step-dot').length) return;
    const steps = Array.from(document.querySelectorAll('.section'));
    if (!steps.length) return;

    const totalSteps = steps.length;
    const stepTitles = steps.map((s) => s.querySelector('.section-bar h2, .section-bar .left h2')?.textContent || 'Step');
    let currentStep = 1;

    const dotsWrap = document.getElementById('stepDots');
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      stepTitles.forEach((title, i) => {
        const dot = document.createElement('div');
        dot.className = 'step-dot';
        dot.title = title;
        dot.addEventListener('click', () => {
          if (i + 1 < currentStep) goToStep(i + 1);
        });
        dotsWrap.appendChild(dot);
      });
    }

    function goToStep(n) {
      n = Math.max(1, Math.min(totalSteps, n));
      steps.forEach((s) => s.classList.remove('active'));
      const target = steps.find((s) => s.dataset.step === String(n));
      if (target) target.classList.add('active');
      currentStep = n;
      updateProgress();
      const wrap = document.querySelector('.progress-wrap');
      if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function updateProgress() {
      const pct = Math.round((currentStep / totalSteps) * 100);
      const fill = document.getElementById('progressFill');
      const pctLabel = document.getElementById('progressPct');
      const stepLabel = document.getElementById('stepLabel');
      if (fill) fill.style.width = pct + '%';
      if (pctLabel) pctLabel.textContent = pct + '%';
      if (stepLabel) stepLabel.textContent = `Step ${currentStep} of ${totalSteps} · ${stepTitles[currentStep - 1] || 'Step'}`;
      document.querySelectorAll('.step-dot').forEach((dot, i) => {
        dot.classList.toggle('current', i + 1 === currentStep);
        dot.classList.toggle('done', i + 1 < currentStep);
      });
    }

    document.querySelectorAll('[data-next]').forEach((btn) => {
      btn.addEventListener('click', () => goToStep(currentStep + 1));
    });
    document.querySelectorAll('[data-back]').forEach((btn) => {
      btn.addEventListener('click', () => goToStep(currentStep - 1));
    });

    updateProgress();
    return { goToStep, updateProgress };
  }

  function initSharedFormUI() {
    initChipGrids();
    initPillGroups();
    initWizard();
  }

  window.EBCommon = {
    initSharedFormUI,
    initPillGroups,
    initChipGrids,
    initWizard,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSharedFormUI);
  } else {
    initSharedFormUI();
  }
})();
