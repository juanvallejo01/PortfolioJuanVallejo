const CONTACT_EMAIL = 'juan.c.vallejo01@gmail.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Método no permitido.' });
    return;
  }

  const { fullname, email, message, website, startedAt } = req.body || {};

  // Honeypot: real visitors never fill this hidden field.
  if (website) {
    res.status(200).json({ ok: true });
    return;
  }

  // Anti-bot: a real person needs at least a couple seconds to fill the form.
  const elapsed = Date.now() - Number(startedAt || 0);
  if (!startedAt || Number.isNaN(elapsed) || elapsed < 1500) {
    res.status(200).json({ ok: true });
    return;
  }

  const cleanName = String(fullname || '').trim().slice(0, 100);
  const cleanEmail = String(email || '').trim().slice(0, 200);
  const cleanMessage = String(message || '').trim().slice(0, 3000);

  if (!cleanName || !cleanEmail || !cleanMessage) {
    res.status(400).json({ error: 'Completa todos los campos.' });
    return;
  }

  if (!EMAIL_RE.test(cleanEmail)) {
    res.status(400).json({ error: 'El email no es válido.' });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured.');
    res.status(500).json({ error: 'El envío de mensajes no está disponible ahora mismo.' });
    return;
  }

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Portfolio <onboarding@resend.dev>',
        to: [CONTACT_EMAIL],
        reply_to: cleanEmail,
        subject: `Nuevo mensaje de ${cleanName} (portfolio)`,
        html:
          `<p><strong>Nombre:</strong> ${escapeHtml(cleanName)}</p>` +
          `<p><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>` +
          `<p><strong>Mensaje:</strong></p><p>${escapeHtml(cleanMessage).replace(/\n/g, '<br>')}</p>`,
      }),
    });

    if (!resendRes.ok) {
      const errorBody = await resendRes.text();
      console.error('Resend error:', resendRes.status, errorBody);
      res.status(502).json({ error: 'No se pudo enviar el mensaje. Intenta de nuevo más tarde.' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo enviar el mensaje. Intenta de nuevo más tarde.' });
  }
};
