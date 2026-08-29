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
  const path = url.pathname.replace('/api/contacts', '');

  if (req.method === 'GET' && path === '') {
    const role = url.searchParams.get('role');
    let contacts = db.contacts;
    if (role) contacts = contacts.filter(c => c.role === role);
    return res.json(contacts.sort((a, b) => a.name.localeCompare(b.name)));
  }

  if (req.method === 'POST' && path === '') {
    const { name, role, phone, email, company, notes } = req.body;
    const contact = { id: nextId('contacts'), name, role, phone, email, company, notes, created_at: new Date().toISOString() };
    db.contacts.push(contact);
    return res.status(201).json({ id: contact.id });
  }

  if (req.method === 'PUT' && path.startsWith('/')) {
    const id = parseInt(path.split('/')[1]);
    const c = db.contacts.find(c => c.id === id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    const { name, role, phone, email, company, notes } = req.body;
    if (name) c.name = name; if (role) c.role = role; if (phone) c.phone = phone;
    if (email) c.email = email; if (company) c.company = company; if (notes) c.notes = notes;
    return res.json({ ok: true });
  }

  if (req.method === 'DELETE' && path.startsWith('/')) {
    const id = parseInt(path.split('/')[1]);
    db.contacts = db.contacts.filter(c => c.id !== id);
    return res.json({ ok: true });
  }

  res.status(404).json({ error: 'Not found' });
};
