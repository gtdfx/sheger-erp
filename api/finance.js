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
  const path = url.pathname.replace('/api/finance', '');

  // GET /api/finance/budget
  if (req.method === 'GET' && path === '/budget') {
    const spent = {};
    db.expenses.forEach(e => { spent[e.category] = (spent[e.category] || 0) + e.amount; });
    const categories = db.budget.map(b => ({ ...b, spent: spent[b.category] || 0, remaining: b.allocated - (spent[b.category] || 0) }));
    return res.json({ categories, total: db.budget.reduce((s, b) => s + b.allocated, 0) });
  }

  // PUT /api/finance/budget/:category
  if (req.method === 'PUT' && path.startsWith('/budget/')) {
    const category = decodeURIComponent(path.split('/budget/')[1]);
    const b = db.budget.find(b => b.category === category);
    if (!b) return res.status(404).json({ error: 'Not found' });
    b.allocated = req.body.allocated || 0;
    return res.json({ ok: true });
  }

  // GET /api/finance/expenses
  if (req.method === 'GET' && path === '/expenses') {
    const category = url.searchParams.get('category');
    let expenses = db.expenses;
    if (category) expenses = expenses.filter(e => e.category === category);
    expenses = expenses.sort((a, b) => b.date.localeCompare(a.date));
    return res.json({ expenses, total: expenses.reduce((s, e) => s + e.amount, 0) });
  }

  // POST /api/finance/expenses
  if (req.method === 'POST' && path === '/expenses') {
    const { category, description, amount, currency, date, notes } = req.body;
    const expense = { id: nextId('expenses'), category, description, amount: parseFloat(amount), currency: currency || 'ETB', date, notes, receipt_path: null, recorded_by: user.id, created_at: new Date().toISOString() };
    db.expenses.push(expense);
    db.activity_log.push({ id: nextId('activity_log'), action: 'expense_added', details: `${description} - ${amount} ETB`, user_id: user.id, created_at: new Date().toISOString() });
    return res.status(201).json({ id: expense.id });
  }

  // DELETE /api/finance/expenses/:id
  if (req.method === 'DELETE' && path.startsWith('/expenses/')) {
    const id = parseInt(path.split('/expenses/')[1]);
    db.expenses = db.expenses.filter(e => e.id !== id);
    return res.json({ ok: true });
  }

  // GET /api/finance/summary
  if (req.method === 'GET' && path === '/summary') {
    const totalBudget = db.budget.reduce((s, b) => s + b.allocated, 0);
    const totalSpent = db.expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory = Object.entries(db.expenses.reduce((m, e) => { m[e.category] = (m[e.category] || 0) + e.amount; return m; }, {})).map(([category, total]) => ({ category, total }));
    return res.json({ totalBudget, totalSpent, remaining: totalBudget - totalSpent, byCategory, byMonth: [] });
  }

  res.status(404).json({ error: 'Not found' });
};
