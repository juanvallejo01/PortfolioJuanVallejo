const { handleUpload } = require('@vercel/blob/client');
const crypto = require('crypto');

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
];

function passwordMatches(candidate) {
  const expected = process.env.VIDEOS_PASSWORD;
  if (!expected || !candidate) return false;

  const a = Buffer.from(String(candidate));
  const b = Buffer.from(String(expected));

  if (a.length !== b.length) {
    crypto.timingSafeEqual(a, a);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Método no permitido.' });
    return;
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let password = null;
        try {
          password = JSON.parse(clientPayload || '{}').password;
        } catch {
          // ignore malformed payload, handled by passwordMatches returning false
        }

        if (!passwordMatches(password)) {
          throw new Error('Contraseña incorrecta.');
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: 20 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });

    res.status(200).json(jsonResponse);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'No se pudo procesar la subida.' });
  }
};
