document.addEventListener('click', (event) => {
  const opener = event.target.closest('[data-open-dialog]');
  if (opener) { const dialog = document.getElementById(opener.dataset.openDialog); if (dialog && !dialog.open) { dialog._returnFocus = opener; dialog.showModal(); } }
  const closer = event.target.closest('[data-close-dialog]');
  if (closer) closer.closest('dialog')?.close();
  if (event.target instanceof HTMLDialogElement) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); }
});
document.addEventListener('close', (event) => { if (event.target instanceof HTMLDialogElement) event.target._returnFocus?.focus(); }, true);
document.addEventListener('change', (event) => { if (event.target.matches('[data-localization-select]')) event.target.form.requestSubmit(); });

const footerBreakpoint = matchMedia('(min-width: 750px)');
function syncFooter(event) { document.querySelectorAll('.footer-accordion').forEach(detail => { detail.open = event.matches; }); }
syncFooter(footerBreakpoint);
footerBreakpoint.addEventListener('change', syncFooter);
