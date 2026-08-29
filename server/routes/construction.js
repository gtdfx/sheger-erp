const express = require('express');
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/photos')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

// --- PHASES ---

// GET /api/construction/phases
router.get('/phases', (req, res) => {
  const db = req.app.locals.db;
  const phases = db.prepare('SELECT * FROM phases ORDER BY sort_order').all();
  phases.forEach(p => {
    p.milestones = db.prepare('SELECT * FROM milestones WHERE phase_id = ? ORDER BY id').all(p.id);
    const total = p.milestones.length;
    const done = p.milestones.filter(m => m.status === 'completed').length;
    p.progress = total > 0 ? Math.round((done / total) * 100) : 0;
  });
  res.json(phases);
});

// PUT /api/construction/phases/:id
router.put('/phases/:id', (req, res) => {
  const db = req.app.locals.db;
  const { status, start_date, end_date } = req.body;
  db.prepare('UPDATE phases SET status = COALESCE(?, status), start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date) WHERE id = ?')
    .run(status, start_date, end_date, req.params.id);

  // Log activity
  db.prepare('INSERT INTO activity_log (action, details, user_id, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)')
    .run('phase_updated', `Phase status changed to ${status}`, req.user.id, 'phase', req.params.id);

  res.json({ ok: true });
});

// --- MILESTONES ---

// POST /api/construction/milestones
router.post('/milestones', (req, res) => {
  const db = req.app.locals.db;
  const { phase_id, title, due_date, assigned_to, notes } = req.body;
  const result = db.prepare(
    'INSERT INTO milestones (phase_id, title, due_date, assigned_to, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(phase_id, title, due_date, assigned_to, notes);

  db.prepare('INSERT INTO activity_log (action, details, user_id, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)')
    .run('milestone_added', `Added milestone: ${title}`, req.user.id, 'milestone', result.lastInsertRowid);

  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/construction/milestones/:id
router.put('/milestones/:id', (req, res) => {
  const db = req.app.locals.db;
  const { status, notes, assigned_to, due_date } = req.body;
  db.prepare(
    "UPDATE milestones SET status = COALESCE(?, status), notes = COALESCE(?, notes), assigned_to = COALESCE(?, assigned_to), due_date = COALESCE(?, due_date), completed_date = CASE WHEN ? = 'completed' THEN datetime('now') ELSE completed_date END WHERE id = ?"
  ).run(status, notes, assigned_to, due_date, status, req.params.id);

  db.prepare('INSERT INTO activity_log (action, details, user_id, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)')
    .run('milestone_updated', `Milestone status: ${status}`, req.user.id, 'milestone', req.params.id);

  res.json({ ok: true });
});

// POST /api/construction/milestones/:id/photo
router.post('/milestones/:id/photo', upload.single('photo'), (req, res) => {
  const db = req.app.locals.db;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const photoPath = '/uploads/photos/' + req.file.filename;
  db.prepare('UPDATE milestones SET photo_path = ? WHERE id = ?').run(photoPath, req.params.id);

  db.prepare('INSERT INTO activity_log (action, details, user_id, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)')
    .run('photo_uploaded', 'Progress photo uploaded', req.user.id, 'milestone', req.params.id);

  res.json({ path: photoPath });
});

// DELETE /api/construction/milestones/:id
router.delete('/milestones/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM milestones WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
