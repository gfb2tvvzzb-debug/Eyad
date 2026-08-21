(function () {
  const modal = document.createElement('div');
  modal.className = 'certificate-modal';
  modal.innerHTML = '<div class="certificate-modal-backdrop" data-close-certificate></div><div class="certificate-modal-dialog" role="dialog" aria-modal="true" aria-label="Certificate preview"><button type="button" class="certificate-modal-close" data-close-certificate aria-label="Close certificate preview">&times;</button><img class="certificate-modal-image" alt=""></div>';
  document.body.appendChild(modal);

  const image = modal.querySelector('.certificate-modal-image');
  function closeModal() {
    modal.classList.remove('open');
    image.removeAttribute('src');
  }

  document.addEventListener('click', (event) => {
    const preview = event.target.closest('[data-certificate-image]');
    if (preview) {
      event.preventDefault();
      image.src = preview.dataset.certificateImage;
      image.alt = preview.dataset.certificateAlt || 'Certificate preview';
      modal.classList.add('open');
      modal.querySelector('.certificate-modal-close').focus();
      return;
    }
    if (event.target.closest('[data-close-certificate]')) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });
})();
