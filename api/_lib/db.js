// In-memory database for Vercel serverless demo
// Data resets on cold start — fine for demo, will use SQLite on Render later

let _db = null;

function getDB() {
  if (_db) return _db;

  _db = {
    users: [
      { id: 1, name: 'Mesfin Kibret', email: 'mesfin@sheger.com', password_hash: '$2a$10$placeholder', role: 'admin' }
    ],
    phases: [
      { id: 1, name: 'Foundation', sort_order: 1, status: 'not_started' },
      { id: 2, name: 'Structure', sort_order: 2, status: 'not_started' },
      { id: 3, name: 'Masonry & Walls', sort_order: 3, status: 'not_started' },
      { id: 4, name: 'MEP (Electrical & Plumbing)', sort_order: 4, status: 'not_started' },
      { id: 5, name: 'Finishing & Interior', sort_order: 5, status: 'not_started' },
      { id: 6, name: 'Exterior & Landscaping', sort_order: 6, status: 'not_started' },
      { id: 7, name: 'Inspection & Handover', sort_order: 7, status: 'not_started' },
    ],
    milestones: [],
    expenses: [],
    budget: [
      { id: 1, category: 'Materials', allocated: 0 },
      { id: 2, category: 'Labor', allocated: 0 },
      { id: 3, category: 'Permits & Legal', allocated: 0 },
      { id: 4, category: 'Equipment', allocated: 0 },
      { id: 5, category: 'Other', allocated: 0 },
    ],
    apartments: [],
    sales: [],
    payments: [],
    documents: [],
    contacts: [],
    activity_log: [],
    _nextId: {},
  };

  return _db;
}

function nextId(table) {
  const db = getDB();
  if (!db._nextId[table]) db._nextId[table] = (db[table]?.length || 0) + 100;
  return ++db._nextId[table];
}

module.exports = { getDB, nextId };
