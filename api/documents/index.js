const { getDB, nextId } = require('./_lib/db');
const { getAuth } = require('./_lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = getAuth(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDB();
  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname.replace('/api/documents', '');

  if (req.method === 'GET' && path === '') {
    const folder = url.searchParams.get('folder');
    let docs = db.documents;
    if (folder) docs = docs.filter(d => d.folder === folder);
    return res.json(docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  }

  if (req.method === 'POST' && path === '') {
    const { title, folder } = req.body;
    const doc = { id: nextId('documents'), title, folder: folder || 'general', file_path: '/placeholder', file_type: 'application/octet-stream', uploaded_by: user.id, created_at: new Date().toISOString() };
    db.documents.push(doc);
    return res.status(201).json({ id: doc.id, path: doc.file_path });
  }

  if (req.method === 'DELETE' && path.startsWith('/')) {
    const id = parseInt(path.split('/')[1]);
    db.documents = db.documents.filter(d => d.id !== id);
    return res.json({ ok: true });
  }

  res.status(404).json({ error: 'Not found' });
};
