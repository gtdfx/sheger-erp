const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
const { wrapper: dbWrapper, setDB } = require('./db/wrapper');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Database ---
const dbPath = path.join(__dirname, 'db', 'sheger.db');
let sqlDb;

function saveDB() {
  if (!sqlDb) return;
  const data = sqlDb.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

async function initDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(buf);
  } else {
    sqlDb = new SQL.Database();
  }
  sqlDb.run('PRAGMA foreign_keys = ON');

  // Run schema
  const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  sqlDb.run(schema);
  saveDB();

  setDB(sqlDb, saveDB);
  app.locals.db = dbWrapper;
}

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
['photos', 'receipts', 'documents'].forEach(sub => {
  const dir = path.join(uploadsDir, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// --- Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/construction', require('./routes/construction'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/contacts', require('./routes/contacts'));

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Start ---
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Sheger ERP server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
