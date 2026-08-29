const { getDB } = require('./_lib/db');
const { getAuth } = require('./_lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = getAuth(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDB();
  const totalBudget = db.budget.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = db.expenses.reduce((s, e) => s + e.amount, 0);
  const uniqueVisitors = new Set(db.sales.map(s => s.apartment_id)).size;
  const completedMs = db.milestones.filter(m => m.status === 'completed').length;
  const totalMs = db.milestones.length || 1;

  res.json({
    budget: { total: totalBudget, spent: totalSpent, remaining: totalBudget - totalSpent },
    construction: {
      progress: Math.round((completedMs / totalMs) * 100),
      phases: db.phases.sort((a, b) => a.sort_order - b.sort_order).map(p => ({
        ...p,
        milestones: db.milestones.filter(m => m.phase_id === p.id),
        progress: 0,
      })),
    },
    sales: {
      total: db.apartments.length,
      sold: db.apartments.filter(a => a.status === 'sold').length,
      reserved: db.apartments.filter(a => a.status === 'reserved').length,
      available: db.apartments.filter(a => a.status === 'available').length,
    },
    revenue: { total: db.sales.reduce((s, sale) => s + sale.total_price, 0), payments: db.payments.reduce((s, p) => s + p.amount, 0) },
    expensesByCategory: Object.entries(db.expenses.reduce((m, e) => { m[e.category] = (m[e.category] || 0) + e.amount; return m; }, {})).map(([category, total]) => ({ category, total })),
    recentActivity: db.activity_log.slice(-10).reverse().map(a => ({ ...a, user_name: 'System' })),
    upcomingMilestones: db.milestones.filter(m => m.status !== 'completed').slice(0, 5).map(m => ({
      ...m,
      phase_name: db.phases.find(p => p.id === m.phase_id)?.name || 'Unknown',
    })),
  });
};
