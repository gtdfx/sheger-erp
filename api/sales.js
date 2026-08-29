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
  const path = url.pathname.replace('/api/sales', '');

  // GET /api/sales/apartments
  if (req.method === 'GET' && path === '/apartments') {
    return res.json(db.apartments);
  }

  // POST /api/sales/apartments
  if (req.method === 'POST' && path === '/apartments') {
    const { unit_number, bedrooms, floor, area_m2, price } = req.body;
    const apt = { id: nextId('apartments'), unit_number, bedrooms, floor, area_m2: parseFloat(area_m2), price: parseFloat(price), status: 'available' };
    db.apartments.push(apt);
    return res.status(201).json({ id: apt.id });
  }

  // PUT /api/sales/apartments/:id
  if (req.method === 'PUT' && path.startsWith('/apartments/')) {
    const id = parseInt(path.split('/')[2]);
    const apt = db.apartments.find(a => a.id === id);
    if (!apt) return res.status(404).json({ error: 'Not found' });
    const { unit_number, bedrooms, floor, area_m2, price, status } = req.body;
    if (unit_number) apt.unit_number = unit_number;
    if (bedrooms) apt.bedrooms = bedrooms;
    if (floor) apt.floor = floor;
    if (area_m2) apt.area_m2 = parseFloat(area_m2);
    if (price) apt.price = parseFloat(price);
    if (status) apt.status = status;
    return res.json({ ok: true });
  }

  // DELETE /api/sales/apartments/:id
  if (req.method === 'DELETE' && path.startsWith('/apartments/')) {
    const id = parseInt(path.split('/')[2]);
    db.apartments = db.apartments.filter(a => a.id !== id);
    return res.json({ ok: true });
  }

  // GET /api/sales (list sales)
  if (req.method === 'GET' && path === '') {
    const sales = db.sales.map(s => {
      const apt = db.apartments.find(a => a.id === s.apartment_id);
      const payments = db.payments.filter(p => p.sale_id === s.id);
      return { ...s, unit_number: apt?.unit_number, bedrooms: apt?.bedrooms, area_m2: apt?.area_m2, payments, totalPaid: payments.reduce((sum, p) => sum + p.amount, 0), remaining: s.total_price - payments.reduce((sum, p) => sum + p.amount, 0) };
    });
    return res.json(sales);
  }

  // POST /api/sales (create sale)
  if (req.method === 'POST' && path === '') {
    const { apartment_id, buyer_name, buyer_phone, buyer_email, sale_date, total_price, notes } = req.body;
    const sale = { id: nextId('sales'), apartment_id, buyer_name, buyer_phone, buyer_email, sale_date, total_price: parseFloat(total_price), notes, created_at: new Date().toISOString() };
    db.sales.push(sale);
    const apt = db.apartments.find(a => a.id === parseInt(apartment_id));
    if (apt) apt.status = 'sold';
    db.activity_log.push({ id: nextId('activity_log'), action: 'sale_created', details: `Sold to ${buyer_name} for ${total_price} ETB`, user_id: user.id, created_at: new Date().toISOString() });
    return res.status(201).json({ id: sale.id });
  }

  // POST /api/sales/:id/payments
  if (req.method === 'POST' && path.match(/^\/\d+\/payments$/)) {
    const saleId = parseInt(path.split('/')[1]);
    const { amount, date, type, notes } = req.body;
    const payment = { id: nextId('payments'), sale_id: saleId, amount: parseFloat(amount), date, type, notes, created_at: new Date().toISOString() };
    db.payments.push(payment);
    db.activity_log.push({ id: nextId('activity_log'), action: 'payment_received', details: `Payment of ${amount} ETB`, user_id: user.id, created_at: new Date().toISOString() });
    return res.status(201).json({ id: payment.id });
  }

  res.status(404).json({ error: 'Not found' });
};
