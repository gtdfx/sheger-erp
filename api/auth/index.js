const { getDB } = require('./_lib/db');
const { signToken, hashPassword, comparePassword } = require('./_lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname.replace('/api/auth', '');

  if (req.method === 'POST' && path === '/login') {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const db = getDB();
    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = comparePassword(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  }

  if (req.method === 'POST' && path === '/register') {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });

    const db = getDB();
    if (db.users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });

    const hash = hashPassword(password);
    const id = db.users.length + 1;
    const user = { id, name, email, password_hash: hash, role: role || 'staff' };
    db.users.push(user);

    const token = signToken(user);
    return res.status(201).json({ token, user: { id, name, email, role: role || 'staff' } });
  }

  res.status(404).json({ error: 'Not found' });
};
