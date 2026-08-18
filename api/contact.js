const CONTACT_EMAIL = 'juan.c.vallejo01@gmail.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatReceivedAt() {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(new Date());
}

function buildEmailHtml({ name, email, message }) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
  const firstName = escapeHtml(name.split(' ')[0]);

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nuevo mensaje de contacto</title>
</head>
<body style="margin:0;">
  <div style="background:#f4f4f5;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#121212;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">
      <div style="background:#0a0a0a;padding:28px 32px;border-bottom:3px solid #ffd166;">
        <p style="margin:0 0 6px;color:#ffd166;font-size:12px;letter-spacing:1px;text-transform:uppercase;font-weight:700;">Portfolio &middot; Nuevo contacto</p>
        <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.3;">Tienes un nuevo mensaje de ${safeName}</h1>
      </div>
      <div style="padding:28px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
          <tr>
            <td style="padding:8px 0;color:#9a9a9a;font-size:13px;width:90px;vertical-align:top;">Nombre</td>
            <td style="padding:8px 0;color:#ffffff;font-size:15px;font-weight:600;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9a9a9a;font-size:13px;vertical-align:top;">Email</td>
            <td style="padding:8px 0;"><a href="mailto:${safeEmail}" style="color:#ffd166;font-size:15px;text-decoration:none;">${safeEmail}</a></td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9a9a9a;font-size:13px;vertical-align:top;">Fecha</td>
            <td style="padding:8px 0;color:#ffffff;font-size:15px;">${escapeHtml(formatReceivedAt())}</td>
          </tr>
        </table>
        <div style="background:#1c1c1c;border-left:3px solid #ffd166;border-radius:8px;padding:18px 20px;">
          <p style="margin:0 0 8px;color:#9a9a9a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Mensaje</p>
          <p style="margin:0;color:#e8e8e8;font-size:15px;line-height:1.6;">${safeMessage}</p>
        </div>
        <a href="mailto:${safeEmail}" style="display:inline-block;margin-top:24px;background:#ffd166;color:#0a0a0a;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;">Responder a ${firstName}</a>
      </div>
      <div style="padding:16px 32px;border-top:1px solid #2a2a2a;">
        <p style="margin:0;color:#6a6a6a;font-size:12px;">Enviado desde el formulario de contacto de tu portfolio.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildEmailText({ name, email, message }) {
  return [
    `Nuevo mensaje de ${name} (${email})`,
    `Fecha: ${formatReceivedAt()}`,
    '',
    message,
    '',
    `Responder: mailto:${email}`,
  ].join('\n');
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
        html: buildEmailHtml({ name: cleanName, email: cleanEmail, message: cleanMessage }),
        text: buildEmailText({ name: cleanName, email: cleanEmail, message: cleanMessage }),
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
