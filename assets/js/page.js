// Ảnh thực tế: mở lightbox, và hiện chỗ trống rõ ràng nếu chưa có file ảnh.
document.querySelectorAll('[data-lightbox]').forEach((btn) => {
  const dialog = document.getElementById(btn.dataset.lightbox);
  const img = btn.querySelector('img');
  const figure = btn.closest('.photo');

  const markMissing = () => {
    figure.classList.add('photo--missing');
    btn.disabled = true;
    btn.removeAttribute('aria-label');
    btn.innerHTML = '<span class="photo__placeholder">Chưa có ảnh thực tế</span>';
    const cap = figure.querySelector('figcaption');
    if (cap) cap.textContent = 'Ảnh thực tế sẽ được cập nhật.';
  };

  if (img.complete && img.naturalWidth === 0) markMissing();
  else img.addEventListener('error', markMissing, { once: true });

  btn.addEventListener('click', () => {
    if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
  });
  dialog?.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
});
