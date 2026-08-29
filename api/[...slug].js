const { getDB, nextId } = require('../_lib/db');
const { signToken, hashPassword, comparePassword, getAuth } = require('../_lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `https://${req.headers.host}`);
  const slug = url.pathname.replace('/api/', '').replace(/\/$/, '');
  const parts = slug.split('/');
  const db = getDB();

  try {
    // === AUTH ===
    if (parts[0] === 'auth') {
      if (req.method === 'POST' && parts[1] === 'login') {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        const user = db.users.find(u => u.email === email);
        if (!user || !comparePassword(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
        return res.json({ token: signToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
      }
      if (req.method === 'POST' && parts[1] === 'register') {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required' });
        if (db.users.find(u => u.email === email)) return res.status(409).json({ error: 'Email exists' });
        const user = { id: db.users.length + 1, name, email, password_hash: hashPassword(password), role: role || 'staff' };
        db.users.push(user);
        return res.status(201).json({ token: signToken(user), user: { id: user.id, name, email, role: user.role } });
      }
      return res.status(404).json({ error: 'Not found' });
    }

    // All other routes require auth
    const user = getAuth(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // === DASHBOARD ===
    if (parts[0] === 'dashboard' && req.method === 'GET') {
      const totalBudget = db.budget.reduce((s, b) => s + b.allocated, 0);
      const totalSpent = db.expenses.reduce((s, e) => s + e.amount, 0);
      const completedMs = db.milestones.filter(m => m.status === 'completed').length;
      const totalMs = db.milestones.length || 1;
      return res.json({
        budget: { total: totalBudget, spent: totalSpent, remaining: totalBudget - totalSpent },
        construction: {
          progress: Math.round((completedMs / totalMs) * 100),
          phases: db.phases.sort((a, b) => a.sort_order - b.sort_order).map(p => {
            const ms = db.milestones.filter(m => m.phase_id === p.id);
            const done = ms.filter(m => m.status === 'completed').length;
            return { ...p, milestones: ms, progress: ms.length > 0 ? Math.round((done / ms.length) * 100) : 0 };
          }),
        },
        sales: { total: db.apartments.length, sold: db.apartments.filter(a => a.status === 'sold').length, reserved: db.apartments.filter(a => a.status === 'reserved').length, available: db.apartments.filter(a => a.status === 'available').length },
        revenue: { total: db.sales.reduce((s, sale) => s + sale.total_price, 0), payments: db.payments.reduce((s, p) => s + p.amount, 0) },
        expensesByCategory: Object.entries(db.expenses.reduce((m, e) => { m[e.category] = (m[e.category] || 0) + e.amount; return m; }, {})).map(([category, total]) => ({ category, total })),
        recentActivity: db.activity_log.slice(-10).reverse().map(a => ({ ...a, user_name: 'System' })),
        upcomingMilestones: db.milestones.filter(m => m.status !== 'completed').slice(0, 5).map(m => ({ ...m, phase_name: db.phases.find(p => p.id === m.phase_id)?.name || '' })),
      });
    }

    // === CONSTRUCTION ===
    if (parts[0] === 'construction') {
      if (parts[1] === 'phases' && req.method === 'GET') {
        return res.json(db.phases.sort((a, b) => a.sort_order - b.sort_order).map(p => {
          const ms = db.milestones.filter(m => m.phase_id === p.id);
          return { ...p, milestones: ms, progress: ms.length > 0 ? Math.round((ms.filter(m => m.status === 'completed').length / ms.length) * 100) : 0 };
        }));
      }
      if (parts[1] === 'phases' && parts[2] && req.method === 'PUT') {
        const phase = db.phases.find(p => p.id === parseInt(parts[2]));
        if (!phase) return res.status(404).json({ error: 'Not found' });
        if (req.body.status) phase.status = req.body.status;
        return res.json({ ok: true });
      }
      if (parts[1] === 'milestones' && req.method === 'POST') {
        const { phase_id, title, due_date, assigned_to, notes } = req.body;
        const ms = { id: nextId('milestones'), phase_id, title, status: 'not_started', due_date, assigned_to, notes, photo_path: null, created_at: new Date().toISOString() };
        db.milestones.push(ms);
        return res.status(201).json({ id: ms.id });
      }
      if (parts[1] === 'milestones' && parts[2] && req.method === 'PUT') {
        const ms = db.milestones.find(m => m.id === parseInt(parts[2]));
        if (!ms) return res.status(404).json({ error: 'Not found' });
        if (req.body.status) ms.status = req.body.status;
        if (req.body.notes) ms.notes = req.body.notes;
        if (req.body.status === 'completed') ms.completed_date = new Date().toISOString();
        return res.json({ ok: true });
      }
      if (parts[1] === 'milestones' && parts[2] && req.method === 'DELETE') {
        db.milestones = db.milestones.filter(m => m.id !== parseInt(parts[2]));
        return res.json({ ok: true });
      }
    }

    // === FINANCE ===
    if (parts[0] === 'finance') {
      if (parts[1] === 'budget' && req.method === 'GET') {
        const spent = {};
        db.expenses.forEach(e => { spent[e.category] = (spent[e.category] || 0) + e.amount; });
        return res.json({ categories: db.budget.map(b => ({ ...b, spent: spent[b.category] || 0, remaining: b.allocated - (spent[b.category] || 0) })), total: db.budget.reduce((s, b) => s + b.allocated, 0) });
      }
      if (parts[1] === 'budget' && parts[2] && req.method === 'PUT') {
        const cat = decodeURIComponent(parts[2]);
        const b = db.budget.find(b => b.category === cat);
        if (b) b.allocated = req.body.allocated || 0;
        return res.json({ ok: true });
      }
      if (parts[1] === 'expenses' && req.method === 'GET') {
        return res.json({ expenses: db.expenses.sort((a, b) => b.date.localeCompare(a.date)), total: db.expenses.reduce((s, e) => s + e.amount, 0) });
      }
      if (parts[1] === 'expenses' && req.method === 'POST') {
        const { category, description, amount, date, notes } = req.body;
        const exp = { id: nextId('expenses'), category, description, amount: parseFloat(amount), currency: 'ETB', date, notes, receipt_path: null, recorded_by: user.id, created_at: new Date().toISOString() };
        db.expenses.push(exp);
        return res.status(201).json({ id: exp.id });
      }
      if (parts[1] === 'expenses' && parts[2] && req.method === 'DELETE') {
        db.expenses = db.expenses.filter(e => e.id !== parseInt(parts[2]));
        return res.json({ ok: true });
      }
      if (parts[1] === 'summary' && req.method === 'GET') {
        const totalBudget = db.budget.reduce((s, b) => s + b.allocated, 0);
        const totalSpent = db.expenses.reduce((s, e) => s + e.amount, 0);
        return res.json({ totalBudget, totalSpent, remaining: totalBudget - totalSpent, byCategory: Object.entries(db.expenses.reduce((m, e) => { m[e.category] = (m[e.category] || 0) + e.amount; return m; }, {})).map(([category, total]) => ({ category, total })), byMonth: [] });
      }
    }

    // === SALES ===
    if (parts[0] === 'sales') {
      if (parts[1] === 'apartments' && req.method === 'GET') return res.json(db.apartments);
      if (parts[1] === 'apartments' && req.method === 'POST') {
        const { unit_number, bedrooms, floor, area_m2, price } = req.body;
        const apt = { id: nextId('apartments'), unit_number, bedrooms, floor, area_m2: parseFloat(area_m2), price: parseFloat(price), status: 'available' };
        db.apartments.push(apt);
        return res.status(201).json({ id: apt.id });
      }
      if (parts[1] === 'apartments' && parts[2] && req.method === 'PUT') {
        const apt = db.apartments.find(a => a.id === parseInt(parts[2]));
        if (!apt) return res.status(404).json({ error: 'Not found' });
        Object.assign(apt, req.body);
        return res.json({ ok: true });
      }
      if (parts[1] === 'apartments' && parts[2] && req.method === 'DELETE') {
        db.apartments = db.apartments.filter(a => a.id !== parseInt(parts[2]));
        return res.json({ ok: true });
      }
      if (!parts[1] && req.method === 'GET') {
        return res.json(db.sales.map(s => {
          const apt = db.apartments.find(a => a.id === s.apartment_id);
          const pmts = db.payments.filter(p => p.sale_id === s.id);
          return { ...s, unit_number: apt?.unit_number, bedrooms: apt?.bedrooms, area_m2: apt?.area_m2, payments: pmts, totalPaid: pmts.reduce((sum, p) => sum + p.amount, 0), remaining: s.total_price - pmts.reduce((sum, p) => sum + p.amount, 0) };
        }));
      }
      if (!parts[1] && req.method === 'POST') {
        const { apartment_id, buyer_name, buyer_phone, sale_date, total_price } = req.body;
        const sale = { id: nextId('sales'), apartment_id, buyer_name, buyer_phone, sale_date, total_price: parseFloat(total_price), created_at: new Date().toISOString() };
        db.sales.push(sale);
        const apt = db.apartments.find(a => a.id === parseInt(apartment_id));
        if (apt) apt.status = 'sold';
        return res.status(201).json({ id: sale.id });
      }
      // Payments: sales/:id/payments
      if (parts[1] && parts[2] === 'payments' && req.method === 'POST') {
        const { amount, date, type, notes } = req.body;
        const pmt = { id: nextId('payments'), sale_id: parseInt(parts[1]), amount: parseFloat(amount), date, type, notes, created_at: new Date().toISOString() };
        db.payments.push(pmt);
        return res.status(201).json({ id: pmt.id });
      }
    }

    // === DOCUMENTS ===
    if (parts[0] === 'documents') {
      if (!parts[1] && req.method === 'GET') {
        return res.json(db.documents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }
      if (!parts[1] && req.method === 'POST') {
        const { title, folder } = req.body;
        const doc = { id: nextId('documents'), title, folder: folder || 'general', file_path: '/placeholder', file_type: 'application/octet-stream', uploaded_by: user.id, created_at: new Date().toISOString() };
        db.documents.push(doc);
        return res.status(201).json({ id: doc.id });
      }
      if (parts[1] && req.method === 'DELETE') {
        db.documents = db.documents.filter(d => d.id !== parseInt(parts[1]));
        return res.json({ ok: true });
      }
    }

    // === CONTACTS ===
    if (parts[0] === 'contacts') {
      if (!parts[1] && req.method === 'GET') return res.json(db.contacts.sort((a, b) => a.name.localeCompare(b.name)));
      if (!parts[1] && req.method === 'POST') {
        const { name, role, phone, email, company, notes } = req.body;
        const c = { id: nextId('contacts'), name, role, phone, email, company, notes, created_at: new Date().toISOString() };
        db.contacts.push(c);
        return res.status(201).json({ id: c.id });
      }
      if (parts[1] && req.method === 'PUT') {
        const c = db.contacts.find(c => c.id === parseInt(parts[1]));
        if (!c) return res.status(404).json({ error: 'Not found' });
        Object.assign(c, req.body);
        return res.json({ ok: true });
      }
      if (parts[1] && req.method === 'DELETE') {
        db.contacts = db.contacts.filter(c => c.id !== parseInt(parts[1]));
        return res.json({ ok: true });
      }
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
