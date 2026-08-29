const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/dashboard
router.get('/', (req, res) => {
  const db = req.app.locals.db;

  // Budget summary
  const budget = db.prepare('SELECT SUM(allocated) as total FROM budget').get();
  const expenses = db.prepare('SELECT SUM(amount) as total FROM expenses').get();
  const totalBudget = budget?.total || 0;
  const totalSpent = expenses?.total || 0;
  const remaining = totalBudget - totalSpent;

  // Construction progress
  const phases = db.prepare('SELECT * FROM phases ORDER BY sort_order').all();
  const totalMilestones = db.prepare('SELECT COUNT(*) as count FROM milestones').get();
  const completedMilestones = db.prepare("SELECT COUNT(*) as count FROM milestones WHERE status = 'completed'").get();
  const constructionProgress = totalMilestones.count > 0
    ? Math.round((completedMilestones.count / totalMilestones.count) * 100)
    : 0;

  // Sales summary
  const totalUnits = db.prepare('SELECT COUNT(*) as count FROM apartments').get();
  const soldUnits = db.prepare("SELECT COUNT(*) as count FROM apartments WHERE status = 'sold'").get();
  const reservedUnits = db.prepare("SELECT COUNT(*) as count FROM apartments WHERE status = 'reserved'").get();
  const availableUnits = db.prepare("SELECT COUNT(*) as count FROM apartments WHERE status = 'available'").get();

  // Revenue
  const totalRevenue = db.prepare('SELECT SUM(total_price) as total FROM sales').get();
  const totalPayments = db.prepare('SELECT SUM(amount) as total FROM payments').get();

  // Expense by category
  const expensesByCategory = db.prepare(
    'SELECT category, SUM(amount) as total FROM expenses GROUP BY category ORDER BY total DESC'
  ).all();

  // Recent activity
  const recentActivity = db.prepare(
    'SELECT a.*, u.name as user_name FROM activity_log a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT 10'
  ).all();

  // Upcoming milestones
  const upcomingMilestones = db.prepare(
    "SELECT m.*, p.name as phase_name FROM milestones m JOIN phases p ON m.phase_id = p.id WHERE m.status != 'completed' ORDER BY m.due_date ASC LIMIT 5"
  ).all();

  res.json({
    budget: { total: totalBudget, spent: totalSpent, remaining },
    construction: { progress: constructionProgress, phases },
    sales: {
      total: totalUnits.count,
      sold: soldUnits.count,
      reserved: reservedUnits.count,
      available: availableUnits.count
    },
    revenue: { total: totalRevenue?.total || 0, payments: totalPayments?.total || 0 },
    expensesByCategory,
    recentActivity,
    upcomingMilestones
  });
});

module.exports = router;
