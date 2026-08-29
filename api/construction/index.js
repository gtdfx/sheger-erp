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
  const path = url.pathname.replace('/api/construction', '');

  // GET /api/construction/phases
  if (req.method === 'GET' && path === '/phases') {
    const phases = db.phases.sort((a, b) => a.sort_order - b.sort_order).map(p => {
      const milestones = db.milestones.filter(m => m.phase_id === p.id);
      const done = milestones.filter(m => m.status === 'completed').length;
      return { ...p, milestones, progress: milestones.length > 0 ? Math.round((done / milestones.length) * 100) : 0 };
    });
    return res.json(phases);
  }

  // PUT /api/construction/phases/:id
  if (req.method === 'PUT' && path.startsWith('/phases/')) {
    const id = parseInt(path.split('/')[2]);
    const phase = db.phases.find(p => p.id === id);
    if (!phase) return res.status(404).json({ error: 'Not found' });
    const { status, start_date, end_date } = req.body;
    if (status) phase.status = status;
    if (start_date) phase.start_date = start_date;
    if (end_date) phase.end_date = end_date;
    db.activity_log.push({ id: nextId('activity_log'), action: 'phase_updated', details: `Phase ${phase.name} updated`, user_id: user.id, created_at: new Date().toISOString() });
    return res.json({ ok: true });
  }

  // POST /api/construction/milestones
  if (req.method === 'POST' && path === '/milestones') {
    const { phase_id, title, due_date, assigned_to, notes } = req.body;
    const milestone = { id: nextId('milestones'), phase_id, title, status: 'not_started', due_date, assigned_to, notes, photo_path: null, created_at: new Date().toISOString() };
    db.milestones.push(milestone);
    db.activity_log.push({ id: nextId('activity_log'), action: 'milestone_added', details: `Added: ${title}`, user_id: user.id, created_at: new Date().toISOString() });
    return res.status(201).json({ id: milestone.id });
  }

  // PUT /api/construction/milestones/:id
  if (req.method === 'PUT' && path.startsWith('/milestones/')) {
    const id = parseInt(path.split('/')[2]);
    const ms = db.milestones.find(m => m.id === id);
    if (!ms) return res.status(404).json({ error: 'Not found' });
    const { status, notes, assigned_to, due_date } = req.body;
    if (status) ms.status = status;
    if (notes) ms.notes = notes;
    if (assigned_to) ms.assigned_to = assigned_to;
    if (due_date) ms.due_date = due_date;
    if (status === 'completed') ms.completed_date = new Date().toISOString();
    return res.json({ ok: true });
  }

  // DELETE /api/construction/milestones/:id
  if (req.method === 'DELETE' && path.startsWith('/milestones/')) {
    const id = parseInt(path.split('/')[2]);
    db.milestones = db.milestones.filter(m => m.id !== id);
    return res.json({ ok: true });
  }

  res.status(404).json({ error: 'Not found' });
};
