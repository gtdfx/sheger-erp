const express = require('express');
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/receipts')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

// --- BUDGET ---

// GET /api/finance/budget
router.get('/budget', (req, res) => {
  const db = req.app.locals.db;
  const budget = db.prepare('SELECT * FROM budget ORDER BY category').all();
  const total = budget.reduce((sum, b) => sum + b.allocated, 0);

  // Get spent per category
  const spent = db.prepare('SELECT category, SUM(amount) as spent FROM expenses GROUP BY category').all();
  const spentMap = {};
  spent.forEach(s => spentMap[s.category] = s.spent);

  const result = budget.map(b => ({
    ...b,
    spent: spentMap[b.category] || 0,
    remaining: b.allocated - (spentMap[b.category] || 0)
  }));

  res.json({ categories: result, total });
});

// PUT /api/finance/budget/:category
router.put('/budget/:category', (req, res) => {
  const db = req.app.locals.db;
  const { allocated } = req.body;
  db.prepare('UPDATE budget SET allocated = ?, updated_at = datetime("now") WHERE category = ?')
    .run(allocated, req.params.category);
  res.json({ ok: true });
});

// --- EXPENSES ---

// GET /api/finance/expenses
router.get('/expenses', (req, res) => {
  const db = req.app.locals.db;
  const { category, limit } = req.query;
  let query = 'SELECT e.*, u.name as recorded_by_name FROM expenses e LEFT JOIN users u ON e.recorded_by = u.id';
  const params = [];

  if (category) {
    query += ' WHERE e.category = ?';
    params.push(category);
  }
  query += ' ORDER BY e.date DESC';
  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit));
  }

  const expenses = db.prepare(query).all(...params);
  const total = db.prepare('SELECT SUM(amount) as total FROM expenses' + (category ? ' WHERE category = ?' : '')).get(...(category ? [category] : []));

  res.json({ expenses, total: total?.total || 0 });
});

// POST /api/finance/expenses
router.post('/expenses', upload.single('receipt'), (req, res) => {
  const db = req.app.locals.db;
  const { category, description, amount, currency, date, notes } = req.body;
  const receiptPath = req.file ? '/uploads/receipts/' + req.file.filename : null;

  const result = db.prepare(
    'INSERT INTO expenses (category, description, amount, currency, date, receipt_path, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(category, description, parseFloat(amount), currency || 'ETB', date, receiptPath, notes, req.user.id);

  db.prepare('INSERT INTO activity_log (action, details, user_id, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)')
    .run('expense_added', `New expense: ${description} - ${amount} ${currency || 'ETB'}`, req.user.id, 'expense', result.lastInsertRowid);

  res.status(201).json({ id: result.lastInsertRowid });
});

// DELETE /api/finance/expenses/:id
router.delete('/expenses/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/finance/summary
router.get('/summary', (req, res) => {
  const db = req.app.locals.db;
  const totalBudget = db.prepare('SELECT SUM(allocated) as total FROM budget').get();
  const totalSpent = db.prepare('SELECT SUM(amount) as total FROM expenses').get();
  const byCategory = db.prepare('SELECT category, SUM(amount) as total FROM expenses GROUP BY category ORDER BY total DESC').all();
  const byMonth = db.prepare(
    "SELECT strftime('%Y-%m', date) as month, SUM(amount) as total FROM expenses GROUP BY month ORDER BY month DESC LIMIT 12"
  ).all();

  res.json({
    totalBudget: totalBudget?.total || 0,
    totalSpent: totalSpent?.total || 0,
    remaining: (totalBudget?.total || 0) - (totalSpent?.total || 0),
    byCategory,
    byMonth
  });
});

module.exports = router;
