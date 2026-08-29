const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/contacts
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { role } = req.query;
  let query = 'SELECT * FROM contacts';
  const params = [];
  if (role) {
    query += ' WHERE role = ?';
    params.push(role);
  }
  query += ' ORDER BY name';
  const contacts = db.prepare(query).all(...params);
  res.json(contacts);
});

// POST /api/contacts
router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const { name, role, phone, email, company, notes } = req.body;
  const result = db.prepare(
    'INSERT INTO contacts (name, role, phone, email, company, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, role, phone, email, company, notes);
  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/contacts/:id
router.put('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { name, role, phone, email, company, notes } = req.body;
  db.prepare(
    'UPDATE contacts SET name = COALESCE(?, name), role = COALESCE(?, role), phone = COALESCE(?, phone), email = COALESCE(?, email), company = COALESCE(?, company), notes = COALESCE(?, notes) WHERE id = ?'
  ).run(name, role, phone, email, company, notes, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/contacts/:id
router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
