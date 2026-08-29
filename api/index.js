const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWT_SECRET = process.env.JWT_SECRET || 'sheger-erp-2024';

// === In-memory DB ===
let _db = null;
function getDB() {
  if (_db) return _db;
  _db = {
    users: [{ id: 1, name: 'Mesfin Kibret', email: 'mesfin@sheger.com', password_hash: bcrypt.hashSync('Mesfin@1080', 10), role: 'admin' }],
    phases: [
      { id: 1, name: 'Foundation', sort_order: 1, status: 'not_started' },
      { id: 2, name: 'Structure', sort_order: 2, status: 'not_started' },
      { id: 3, name: 'Masonry & Walls', sort_order: 3, status: 'not_started' },
      { id: 4, name: 'MEP (Electrical & Plumbing)', sort_order: 4, status: 'not_started' },
      { id: 5, name: 'Finishing & Interior', sort_order: 5, status: 'not_started' },
      { id: 6, name: 'Exterior & Landscaping', sort_order: 6, status: 'not_started' },
      { id: 7, name: 'Inspection & Handover', sort_order: 7, status: 'not_started' },
    ],
    milestones: [], expenses: [],
    budget: [
      { id: 1, category: 'Materials', allocated: 0 },
      { id: 2, category: 'Labor', allocated: 0 },
      { id: 3, category: 'Permits & Legal', allocated: 0 },
      { id: 4, category: 'Equipment', allocated: 0 },
      { id: 5, category: 'Other', allocated: 0 },
    ],
    apartments: [], sales: [], payments: [], documents: [], contacts: [], activity_log: [],
    _nid: 100,
  };
  return _db;
}
function nid(t) { const db = getDB(); return ++db._nid; }
function auth(req) { const h = req.headers.authorization; if (!h || !h.startsWith('Bearer ')) return null; try { return jwt.verify(h.split(' ')[1], JWT_SECRET); } catch { return null; } }

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `https://${req.headers.host}`);
  let slug = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
  if (!slug) slug = '';
  const p = slug ? slug.split('/') : [''];
  const db = getDB();
  const body = req.body || {};

  try {
    // AUTH
    if (p[0] === 'auth' && req.method === 'POST' && p[1] === 'login') {
      const user = db.users.find(u => u.email === body.email);
      if (!user || !bcrypt.compareSync(body.password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
      return res.json({ token: jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' }), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
    if (p[0] === 'auth' && req.method === 'POST' && p[1] === 'register') {
      if (db.users.find(u => u.email === body.email)) return res.status(409).json({ error: 'Email exists' });
      const user = { id: db.users.length + 1, name: body.name, email: body.email, password_hash: bcrypt.hashSync(body.password, 10), role: body.role || 'staff' };
      db.users.push(user);
      return res.status(201).json({ token: jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' }), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }

    const u = auth(req);
    if (!u) return res.status(401).json({ error: 'Unauthorized' });

    // DASHBOARD
    if (p[0] === 'dashboard' && req.method === 'GET') {
      const tb = db.budget.reduce((s, b) => s + b.allocated, 0);
      const ts = db.expenses.reduce((s, e) => s + e.amount, 0);
      const cm = db.milestones.filter(m => m.status === 'completed').length;
      const tm = db.milestones.length || 1;
      return res.json({
        budget: { total: tb, spent: ts, remaining: tb - ts },
        construction: { progress: Math.round((cm / tm) * 100), phases: db.phases.sort((a, b) => a.sort_order - b.sort_order).map(ph => { const ms = db.milestones.filter(m => m.phase_id === ph.id); return { ...ph, milestones: ms, progress: ms.length ? Math.round((ms.filter(m => m.status === 'completed').length / ms.length) * 100) : 0 }; }) },
        sales: { total: db.apartments.length, sold: db.apartments.filter(a => a.status === 'sold').length, reserved: db.apartments.filter(a => a.status === 'reserved').length, available: db.apartments.filter(a => a.status === 'available').length },
        revenue: { total: db.sales.reduce((s, x) => s + x.total_price, 0), payments: db.payments.reduce((s, x) => s + x.amount, 0) },
        expensesByCategory: Object.entries(db.expenses.reduce((m, e) => { m[e.category] = (m[e.category] || 0) + e.amount; return m; }, {})).map(([category, total]) => ({ category, total })),
        recentActivity: db.activity_log.slice(-10).reverse().map(a => ({ ...a, user_name: 'System' })),
        upcomingMilestones: db.milestones.filter(m => m.status !== 'completed').slice(0, 5).map(m => ({ ...m, phase_name: db.phases.find(ph => ph.id === m.phase_id)?.name || '' })),
      });
    }

    // CONSTRUCTION
    if (p[0] === 'construction') {
      if (p[1] === 'phases' && req.method === 'GET') return res.json(db.phases.sort((a, b) => a.sort_order - b.sort_order).map(ph => { const ms = db.milestones.filter(m => m.phase_id === ph.id); return { ...ph, milestones: ms, progress: ms.length ? Math.round((ms.filter(m => m.status === 'completed').length / ms.length) * 100) : 0 }; }));
      if (p[1] === 'phases' && p[2] && req.method === 'PUT') { const ph = db.phases.find(x => x.id === parseInt(p[2])); if (ph && body.status) ph.status = body.status; return res.json({ ok: true }); }
      if (p[1] === 'milestones' && req.method === 'POST') { const ms = { id: nid(), phase_id: body.phase_id, title: body.title, status: 'not_started', due_date: body.due_date, assigned_to: body.assigned_to, notes: body.notes, photo_path: null }; db.milestones.push(ms); return res.status(201).json({ id: ms.id }); }
      if (p[1] === 'milestones' && p[2] && req.method === 'PUT') { const ms = db.milestones.find(x => x.id === parseInt(p[2])); if (ms) { if (body.status) ms.status = body.status; if (body.status === 'completed') ms.completed_date = new Date().toISOString(); } return res.json({ ok: true }); }
      if (p[1] === 'milestones' && p[2] && req.method === 'DELETE') { db.milestones = db.milestones.filter(x => x.id !== parseInt(p[2])); return res.json({ ok: true }); }
    }

    // FINANCE
    if (p[0] === 'finance') {
      if (p[1] === 'budget' && req.method === 'GET') { const sp = {}; db.expenses.forEach(e => { sp[e.category] = (sp[e.category] || 0) + e.amount; }); return res.json({ categories: db.budget.map(b => ({ ...b, spent: sp[b.category] || 0, remaining: b.allocated - (sp[b.category] || 0) })), total: db.budget.reduce((s, b) => s + b.allocated, 0) }); }
      if (p[1] === 'budget' && p[2] && req.method === 'PUT') { const b = db.budget.find(x => x.category === decodeURIComponent(p[2])); if (b) b.allocated = body.allocated || 0; return res.json({ ok: true }); }
      if (p[1] === 'expenses' && req.method === 'GET') return res.json({ expenses: db.expenses.sort((a, b) => b.date.localeCompare(a.date)), total: db.expenses.reduce((s, e) => s + e.amount, 0) });
      if (p[1] === 'expenses' && req.method === 'POST') { const e = { id: nid(), category: body.category, description: body.description, amount: parseFloat(body.amount), date: body.date, notes: body.notes, recorded_by: u.id }; db.expenses.push(e); return res.status(201).json({ id: e.id }); }
      if (p[1] === 'expenses' && p[2] && req.method === 'DELETE') { db.expenses = db.expenses.filter(x => x.id !== parseInt(p[2])); return res.json({ ok: true }); }
      if (p[1] === 'summary' && req.method === 'GET') { const tb = db.budget.reduce((s, b) => s + b.allocated, 0); const ts = db.expenses.reduce((s, e) => s + e.amount, 0); return res.json({ totalBudget: tb, totalSpent: ts, remaining: tb - ts, byCategory: Object.entries(db.expenses.reduce((m, e) => { m[e.category] = (m[e.category] || 0) + e.amount; return m; }, {})).map(([category, total]) => ({ category, total })), byMonth: [] }); }
    }

    // SALES
    if (p[0] === 'sales') {
      if (p[1] === 'apartments' && req.method === 'GET') return res.json(db.apartments);
      if (p[1] === 'apartments' && req.method === 'POST') { const a = { id: nid(), unit_number: body.unit_number, bedrooms: body.bedrooms, floor: body.floor, area_m2: parseFloat(body.area_m2), price: parseFloat(body.price), status: 'available' }; db.apartments.push(a); return res.status(201).json({ id: a.id }); }
      if (p[1] === 'apartments' && p[2] && req.method === 'PUT') { const a = db.apartments.find(x => x.id === parseInt(p[2])); if (a) Object.assign(a, body); return res.json({ ok: true }); }
      if (p[1] === 'apartments' && p[2] && req.method === 'DELETE') { db.apartments = db.apartments.filter(x => x.id !== parseInt(p[2])); return res.json({ ok: true }); }
      if (!p[1] && req.method === 'GET') return res.json(db.sales.map(s => { const a = db.apartments.find(x => x.id === s.apartment_id); const pm = db.payments.filter(x => x.sale_id === s.id); return { ...s, unit_number: a?.unit_number, payments: pm, totalPaid: pm.reduce((x, p) => x + p.amount, 0), remaining: s.total_price - pm.reduce((x, p) => x + p.amount, 0) }; }));
      if (!p[1] && req.method === 'POST') { const s = { id: nid(), apartment_id: body.apartment_id, buyer_name: body.buyer_name, buyer_phone: body.buyer_phone, sale_date: body.sale_date, total_price: parseFloat(body.total_price) }; db.sales.push(s); const a = db.apartments.find(x => x.id === parseInt(body.apartment_id)); if (a) a.status = 'sold'; return res.status(201).json({ id: s.id }); }
      if (p[1] && p[2] === 'payments' && req.method === 'POST') { const pm = { id: nid(), sale_id: parseInt(p[1]), amount: parseFloat(body.amount), date: body.date, type: body.type, notes: body.notes }; db.payments.push(pm); return res.status(201).json({ id: pm.id }); }
    }

    // DOCUMENTS
    if (p[0] === 'documents') {
      if (!p[1] && req.method === 'GET') return res.json(db.documents);
      if (!p[1] && req.method === 'POST') { const d = { id: nid(), title: body.title, folder: body.folder || 'general', file_path: '/placeholder', uploaded_by: u.id, created_at: new Date().toISOString() }; db.documents.push(d); return res.status(201).json({ id: d.id }); }
      if (p[1] && req.method === 'DELETE') { db.documents = db.documents.filter(x => x.id !== parseInt(p[1])); return res.json({ ok: true }); }
    }

    // CONTACTS
    if (p[0] === 'contacts') {
      if (!p[1] && req.method === 'GET') return res.json(db.contacts);
      if (!p[1] && req.method === 'POST') { const c = { id: nid(), ...body }; db.contacts.push(c); return res.status(201).json({ id: c.id }); }
      if (p[1] && req.method === 'PUT') { const c = db.contacts.find(x => x.id === parseInt(p[1])); if (c) Object.assign(c, body); return res.json({ ok: true }); }
      if (p[1] && req.method === 'DELETE') { db.contacts = db.contacts.filter(x => x.id !== parseInt(p[1])); return res.json({ ok: true }); }
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
