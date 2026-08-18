const { Client } = require('pg');
const crypto = require('crypto');

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
const OFFICE_EXTENSIONS = ['.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx'];

function extensionOf(pathname) {
  const match = pathname.toLowerCase().match(/(\.[a-z0-9]+)$/);
  return match ? match[1] : '';
}

// Resolves any pasted link or uploaded-file URL into how it should be rendered.
function resolveContent(rawUrl) {
  let u;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, '');
  const ext = extensionOf(u.pathname);

  if (host === 'youtu.be') {
    const id = u.pathname.slice(1);
    return id ? { kind: 'iframe', src: `https://www.youtube.com/embed/${id}` } : null;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (u.pathname === '/watch') {
      const id = u.searchParams.get('v');
      return id ? { kind: 'iframe', src: `https://www.youtube.com/embed/${id}` } : null;
    }
    if (u.pathname.startsWith('/embed/')) return { kind: 'iframe', src: `https://www.youtube.com${u.pathname}` };
    if (u.pathname.startsWith('/shorts/')) {
      const id = u.pathname.split('/')[2];
      return id ? { kind: 'iframe', src: `https://www.youtube.com/embed/${id}` } : null;
    }
    return null;
  }

  if (host === 'vimeo.com') {
    const id = u.pathname.split('/').filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? { kind: 'iframe', src: `https://player.vimeo.com/video/${id}` } : null;
  }

  // Google Slides presentations
  if (host === 'docs.google.com' && u.pathname.startsWith('/presentation/')) {
    const match = u.pathname.match(/\/presentation\/d\/([^/]+)/);
    return match ? { kind: 'iframe', src: `https://docs.google.com/presentation/d/${match[1]}/embed` } : null;
  }

  // Google Drive files
  if (host === 'drive.google.com' && u.pathname.startsWith('/file/')) {
    const match = u.pathname.match(/\/file\/d\/([^/]+)/);
    return match ? { kind: 'iframe', src: `https://drive.google.com/file/d/${match[1]}/preview` } : null;
  }

  if (IMAGE_EXTENSIONS.includes(ext)) {
    return { kind: 'image', src: rawUrl.trim() };
  }

  if (ext === '.pdf') {
    return { kind: 'iframe', src: rawUrl.trim() };
  }

  if (OFFICE_EXTENSIONS.includes(ext)) {
    return { kind: 'iframe', src: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(rawUrl.trim())}` };
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

async function deleteBlobIfOwned(url) {
  try {
    const host = new URL(url).hostname;
    if (!host.endsWith('.public.blob.vercel-storage.com')) return;
    const { del } = require('@vercel/blob');
    await del(url);
  } catch (err) {
    console.error('Blob cleanup failed:', err);
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      const { rows } = await client.query(
        'SELECT id, title, video_url, embed_url, kind, created_at FROM videos ORDER BY created_at DESC'
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

    const content = resolveContent(String(url).trim());
    if (!content) {
      res.status(400).json({
        error: 'Link no reconocido. Usa YouTube, Vimeo, Google Slides, Google Drive, o un archivo PDF/imagen/PowerPoint.',
      });
      return;
    }

    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      const { rows } = await client.query(
        'INSERT INTO videos (title, video_url, embed_url, kind) VALUES ($1, $2, $3, $4) RETURNING id, title, video_url, embed_url, kind, created_at',
        [cleanTitle, String(url).trim(), content.src, content.kind]
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
      const { rows } = await client.query('SELECT video_url FROM videos WHERE id = $1', [videoId]);
      await client.query('DELETE FROM videos WHERE id = $1', [videoId]);
      if (rows[0]) await deleteBlobIfOwned(rows[0].video_url);
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
