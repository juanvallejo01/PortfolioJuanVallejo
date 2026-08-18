'use strict';

(function () {
  const form = document.querySelector('[data-form]');
  if (!form) return;

  const submitBtn = document.querySelector('[data-form-btn]');
  const btnLabel = document.querySelector('[data-form-btn-label]');
  const msg = document.querySelector('[data-contact-form-msg]');
  const startedAt = Date.now();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;

    const formData = new FormData(form);
    submitBtn.disabled = true;
    btnLabel.textContent = 'Enviando...';
    msg.textContent = '';
    msg.className = 'contact-form-msg';

    let sent = false;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullname: formData.get('fullname'),
          email: formData.get('email'),
          message: formData.get('message'),
          website: formData.get('website'),
          startedAt,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        msg.textContent = data.error || 'No se pudo enviar el mensaje. Intenta de nuevo más tarde.';
        msg.classList.add('error');
      } else {
        sent = true;
        form.reset();
        msg.textContent = '¡Mensaje enviado! Te responderé pronto.';
        msg.classList.add('success');
      }
    } catch (err) {
      msg.textContent = 'Error de conexión. Intenta de nuevo.';
      msg.classList.add('error');
    }

    btnLabel.textContent = 'Send Message';
    // Keep it disabled after a successful send (form is now empty/invalid again);
    // re-enable on failure so the user can retry without retyping.
    submitBtn.disabled = sent;
  });
})();
