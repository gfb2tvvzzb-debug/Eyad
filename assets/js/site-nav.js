(function () {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const isTemplate = window.location.pathname.includes('/templates/');
  const prefix = isTemplate ? '../' : '';
  const activePage = currentPath === 'about.html'
    ? 'coaching'
    : currentPath === 'transformations.html'
      ? 'transformations'
      : currentPath === 'auth-updated.html'
        ? 'start'
        : ['nutrition-assessment-updated.html', 'dietary-log.html', 'exercise-history.html', 'food-preferences.html', 'health-history.html'].includes(currentPath)
          ? 'assignments'
        : currentPath === 'index.html' || currentPath === ''
          ? 'home'
          : '';

  const nav = document.getElementById('navbar') || document.createElement('nav');
  nav.id = 'navbar';
  nav.classList.add('site-nav');
  nav.innerHTML = `
    <a href="${prefix}index.html" class="nav-logo" aria-label="Evolved and Balanced home">
      <img class="nav-logo-img" src="${prefix}logo.png" alt="">
    </a>
    <div class="nav-links" id="navLinks">
      <div class="nav-dropdown">
        <a href="${prefix}index.html" class="nav-trigger" data-nav="home" aria-expanded="false">Home</a>
        <div class="dropdown-menu">
          <a href="${prefix}index.html#about">About</a>
          <a href="${prefix}index.html#certificates">Certificates</a>
          <a href="${prefix}index.html#faq">FAQ</a>
        </div>
      </div>
      <div class="nav-dropdown">
        <a href="${prefix}about.html" class="nav-trigger" data-nav="coaching" aria-expanded="false">Coaching</a>
        <div class="dropdown-menu">
          <a href="${prefix}about.html#process">Process</a>
          <a href="${prefix}about.html#method">Method</a>
          <a href="${prefix}about.html#calculator">Calculator</a>
        </div>
      </div>
      <a href="${prefix}transformations.html" data-nav="transformations">Transformations</a>
      <div class="nav-dropdown">
        <button type="button" class="nav-trigger" data-nav="assignments" aria-expanded="false">Assignments</button>
        <div class="dropdown-menu">
          <a href="${prefix}nutrition-assessment-updated.html">Nutrition Assessment</a>
          <a href="${prefix}dietary-log.html">Dietary Log</a>
          <a href="${prefix}exercise-history.html">Exercise History</a>
          <a href="${prefix}food-preferences.html">Food Preferences</a>
          <a href="${prefix}health-history.html">Health History</a>
        </div>
      </div>
    </div>
    <a href="${prefix}auth-updated.html" class="nav-cta" data-nav="start">Start Now</a>
    <button type="button" class="hamburger" aria-label="Open navigation menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>`;

  if (!nav.parentNode) document.body.insertBefore(nav, document.body.firstChild);

  nav.querySelectorAll('[data-nav]').forEach((link) => {
    link.classList.toggle('active', link.dataset.nav === activePage);
  });

  const links = nav.querySelector('.nav-links');
  const menuButton = nav.querySelector('.hamburger');
  const dropdowns = Array.from(nav.querySelectorAll('.nav-dropdown'));

  function closeDropdowns(except) {
    dropdowns.forEach((dropdown) => {
      if (dropdown === except) return;
      dropdown.classList.remove('open');
      dropdown.querySelector('.nav-trigger')?.setAttribute('aria-expanded', 'false');
    });
  }

  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector('.nav-trigger');
    trigger.addEventListener('click', (event) => {
      if (window.matchMedia('(max-width: 760px)').matches && trigger.tagName === 'A') {
        event.preventDefault();
      }
      const open = dropdown.classList.toggle('open');
      closeDropdowns(open ? dropdown : null);
      trigger.setAttribute('aria-expanded', String(open));
    });
  });

  menuButton.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    if (!open) closeDropdowns();
  });

  links.querySelectorAll('.dropdown-menu a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      closeDropdowns();
    });
  });
})();
