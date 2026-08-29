const express = require('express');
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/documents')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

// GET /api/documents
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { folder } = req.query;
  let query = 'SELECT d.*, u.name as uploaded_by_name FROM documents d LEFT JOIN users u ON d.uploaded_by = u.id';
  const params = [];
  if (folder) {
    query += ' WHERE d.folder = ?';
    params.push(folder);
  }
  query += ' ORDER BY d.created_at DESC';
  const docs = db.prepare(query).all(...params);
  res.json(docs);
});

// POST /api/documents
router.post('/', upload.single('file'), (req, res) => {
  const db = req.app.locals.db;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { title, folder } = req.body;
  const filePath = '/uploads/documents/' + req.file.filename;
  const fileType = req.file.mimetype;

  const result = db.prepare(
    'INSERT INTO documents (title, folder, file_path, file_type, uploaded_by) VALUES (?, ?, ?, ?, ?)'
  ).run(title, folder || 'general', filePath, fileType, req.user.id);

  db.prepare('INSERT INTO activity_log (action, details, user_id, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)')
    .run('document_uploaded', `Uploaded: ${title}`, req.user.id, 'document', result.lastInsertRowid);

  res.status(201).json({ id: result.lastInsertRowid, path: filePath });
});

// DELETE /api/documents/:id
router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
