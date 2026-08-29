const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// --- APARTMENTS ---

// GET /api/sales/apartments
router.get('/apartments', (req, res) => {
  const db = req.app.locals.db;
  const apartments = db.prepare('SELECT * FROM apartments ORDER BY floor, unit_number').all();
  res.json(apartments);
});

// POST /api/sales/apartments
router.post('/apartments', (req, res) => {
  const db = req.app.locals.db;
  const { unit_number, bedrooms, floor, area_m2, price } = req.body;
  const result = db.prepare(
    'INSERT INTO apartments (unit_number, bedrooms, floor, area_m2, price) VALUES (?, ?, ?, ?, ?)'
  ).run(unit_number, bedrooms, floor, area_m2, price);
  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/sales/apartments/:id
router.put('/apartments/:id', (req, res) => {
  const db = req.app.locals.db;
  const { unit_number, bedrooms, floor, area_m2, price, status } = req.body;
  db.prepare(
    'UPDATE apartments SET unit_number = COALESCE(?, unit_number), bedrooms = COALESCE(?, bedrooms), floor = COALESCE(?, floor), area_m2 = COALESCE(?, area_m2), price = COALESCE(?, price), status = COALESCE(?, status) WHERE id = ?'
  ).run(unit_number, bedrooms, floor, area_m2, price, status, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/sales/apartments/:id
router.delete('/apartments/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM apartments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- SALES ---

// GET /api/sales
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const sales = db.prepare(
    'SELECT s.*, a.unit_number, a.bedrooms, a.area_m2 FROM sales s JOIN apartments a ON s.apartment_id = a.id ORDER BY s.sale_date DESC'
  ).all();

  // Attach payments to each sale
  sales.forEach(s => {
    s.payments = db.prepare('SELECT * FROM payments WHERE sale_id = ? ORDER BY date').all(s.id);
    s.totalPaid = s.payments.reduce((sum, p) => sum + p.amount, 0);
    s.remaining = s.total_price - s.totalPaid;
  });

  res.json(sales);
});

// POST /api/sales
router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const { apartment_id, buyer_name, buyer_phone, buyer_email, sale_date, total_price, notes } = req.body;

  const result = db.prepare(
    'INSERT INTO sales (apartment_id, buyer_name, buyer_phone, buyer_email, sale_date, total_price, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(apartment_id, buyer_name, buyer_phone, buyer_email, sale_date, total_price, notes);

  // Update apartment status
  db.prepare("UPDATE apartments SET status = 'sold' WHERE id = ?").run(apartment_id);

  db.prepare('INSERT INTO activity_log (action, details, user_id, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)')
    .run('sale_created', `Sold apartment to ${buyer_name} for ${total_price} ETB`, req.user.id, 'sale', result.lastInsertRowid);

  res.status(201).json({ id: result.lastInsertRowid });
});

// --- PAYMENTS ---

// GET /api/sales/:id/payments
router.get('/:id/payments', (req, res) => {
  const db = req.app.locals.db;
  const payments = db.prepare('SELECT * FROM payments WHERE sale_id = ? ORDER BY date').all(req.params.id);
  res.json(payments);
});

// POST /api/sales/:id/payments
router.post('/:id/payments', (req, res) => {
  const db = req.app.locals.db;
  const { amount, date, type, notes } = req.body;

  const result = db.prepare(
    'INSERT INTO payments (sale_id, amount, date, type, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.id, amount, date, type, notes);

  db.prepare('INSERT INTO activity_log (action, details, user_id, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)')
    .run('payment_received', `Payment of ${amount} ETB received`, req.user.id, 'payment', result.lastInsertRowid);

  res.status(201).json({ id: result.lastInsertRowid });
});

module.exports = router;
