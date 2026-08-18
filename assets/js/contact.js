'use strict';

(function () {
  const form = document.querySelector('[data-form]');
  if (!form) return;

  const submitBtn = document.querySelector('[data-form-btn]');
  const btnLabel = document.querySelector('[data-form-btn-label]');
  const msg = document.querySelector('[data-contact-form-msg]');
  const startedAt = Date.now();

  const successView = document.querySelector('[data-contact-success]');
  const successText = document.querySelector('[data-contact-success-text]');
  const successSummary = document.querySelector('[data-contact-success-summary]');
  const successResetBtn = document.querySelector('[data-contact-success-reset]');

  const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  };

  const truncate = (str, max) => (str.length > max ? `${str.slice(0, max).trim()}…` : str);

  const showSuccess = ({ fullname, email, message }) => {
    const firstName = fullname ? fullname.trim().split(' ')[0] : '';

    successText.innerHTML =
      `¡Gracias${firstName ? `, ${escapeHtml(firstName)}` : ''}! Tu mensaje ya está en camino. ` +
      `Te responderé pronto a <strong>${escapeHtml(email)}</strong>.`;

    successSummary.innerHTML =
      '<div><dt>Nombre</dt><dd>' + escapeHtml(fullname) + '</dd></div>' +
      '<div><dt>Email</dt><dd>' + escapeHtml(email) + '</dd></div>' +
      '<div><dt>Mensaje</dt><dd>' + escapeHtml(truncate(message, 140)) + '</dd></div>';

    form.style.display = 'none';
    successView.style.display = 'block';
  };

  const showForm = () => {
    successView.style.display = 'none';
    form.style.display = 'block';
    msg.textContent = '';
    msg.className = 'contact-form-msg';
    submitBtn.disabled = true;
    form.querySelector('[name="fullname"]').focus();
  };

  successResetBtn.addEventListener('click', showForm);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;

    const formData = new FormData(form);
    const fullname = formData.get('fullname');
    const email = formData.get('email');
    const message = formData.get('message');

    submitBtn.disabled = true;
    btnLabel.textContent = 'Enviando...';
    msg.textContent = '';
    msg.className = 'contact-form-msg';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullname,
          email,
          message,
          website: formData.get('website'),
          startedAt,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        msg.textContent = data.error || 'No se pudo enviar el mensaje. Intenta de nuevo más tarde.';
        msg.classList.add('error');
        btnLabel.textContent = 'Send Message';
        submitBtn.disabled = false;
        return;
      }

      form.reset();
      btnLabel.textContent = 'Send Message';
      showSuccess({ fullname, email, message });
    } catch (err) {
      msg.textContent = 'Error de conexión. Intenta de nuevo.';
      msg.classList.add('error');
      btnLabel.textContent = 'Send Message';
      submitBtn.disabled = false;
    }
  });
})();
