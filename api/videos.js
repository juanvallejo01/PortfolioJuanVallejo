const { Client } = require('pg');
const crypto = require('crypto');

function getEmbedUrl(rawUrl) {
  let u;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') {
    const id = u.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (u.pathname === '/watch') {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.pathname.startsWith('/embed/')) return `https://www.youtube.com${u.pathname}`;
    if (u.pathname.startsWith('/shorts/')) {
      const id = u.pathname.split('/')[2];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  }

  if (host === 'vimeo.com') {
    const id = u.pathname.split('/').filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }

  return null;
}

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
  if (req.method === 'GET') {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      const { rows } = await client.query(
        'SELECT id, title, video_url, embed_url, created_at FROM videos ORDER BY created_at DESC'
      );
      res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error interno.' });
    } finally {
      await client.end();
    }
    return;
  }

  if (req.method === 'POST' && req.query.action === 'verify') {
    const { password } = req.body || {};
    if (!passwordMatches(password)) {
      res.status(401).json({ error: 'Contraseña incorrecta.' });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === 'POST') {
    const { password, title, url } = req.body || {};

    if (!passwordMatches(password)) {
      res.status(401).json({ error: 'Contraseña incorrecta.' });
      return;
    }

    const cleanTitle = String(title || '').trim().slice(0, 200);
    if (!cleanTitle || !url) {
      res.status(400).json({ error: 'Faltan campos.' });
      return;
    }

    const embedUrl = getEmbedUrl(String(url).trim());
    if (!embedUrl) {
      res.status(400).json({ error: 'Link de video no reconocido. Usa un link de YouTube o Vimeo.' });
      return;
    }

    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      const { rows } = await client.query(
        'INSERT INTO videos (title, video_url, embed_url) VALUES ($1, $2, $3) RETURNING id, title, video_url, embed_url, created_at',
        [cleanTitle, String(url).trim(), embedUrl]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error interno.' });
    } finally {
      await client.end();
    }
    return;
  }

  if (req.method === 'DELETE') {
    const { password, id } = req.body || {};

    if (!passwordMatches(password)) {
      res.status(401).json({ error: 'Contraseña incorrecta.' });
      return;
    }

    const videoId = Number(id);
    if (!Number.isInteger(videoId)) {
      res.status(400).json({ error: 'Id inválido.' });
      return;
    }

    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      await client.query('DELETE FROM videos WHERE id = $1', [videoId]);
      res.status(204).end();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error interno.' });
    } finally {
      await client.end();
    }
    return;
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  res.status(405).json({ error: 'Método no permitido.' });
};
