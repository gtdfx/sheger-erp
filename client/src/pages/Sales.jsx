import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Plus, Home, User, Phone, DollarSign, ChevronDown, ChevronRight } from 'lucide-react'

function fmt(n) { return n.toLocaleString() }
const statusBadge = { available: 'badge-blue', reserved: 'badge-accent', sold: 'badge-green' }
const statusLabel = { available: 'Available', reserved: 'Reserved', sold: 'Sold' }

export default function Sales() {
  const [apartments, setApartments] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('apartments')
  const [showAddApt, setShowAddApt] = useState(false)
  const [showAddSale, setShowAddSale] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(null)
  const [aptForm, setAptForm] = useState({ unit_number: '', bedrooms: 1, floor: 1, area_m2: '', price: '' })
  const [saleForm, setSaleForm] = useState({ apartment_id: '', buyer_name: '', buyer_phone: '', buyer_email: '', sale_date: new Date().toISOString().slice(0,10), total_price: '' })
  const [payForm, setPayForm] = useState({ amount: '', date: new Date().toISOString().slice(0,10), type: 'deposit', notes: '' })
  const [expandedSale, setExpandedSale] = useState({})

  const load = () => Promise.all([api.apartments(), api.sales()]).then(([a, s]) => { setApartments(a); setSales(s) }).catch(console.error).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  async function addApartment() { if (!aptForm.unit_number || !aptForm.area_m2 || !aptForm.price) return; await api.addApartment(aptForm); setAptForm({ unit_number: '', bedrooms: 1, floor: 1, area_m2: '', price: '' }); setShowAddApt(false); load() }
  async function addSale() { if (!saleForm.apartment_id || !saleForm.buyer_name || !saleForm.total_price) return; await api.addSale(saleForm); setShowAddSale(false); load() }
  async function addPayment(saleId) { if (!payForm.amount) return; await api.addPayment(saleId, payForm); setPayForm({ amount: '', date: new Date().toISOString().slice(0,10), type: 'deposit', notes: '' }); setShowAddPayment(null); load() }
  async function updateAptStatus(id, status) { await api.updateApartment(id, { status }); load() }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-[3px] border-[rgba(30,77,140,0.12)] border-t-[#1e4d8c] rounded-full animate-spin" /></div>

  const availableApts = apartments.filter(a => a.status === 'available')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.28rem] font-bold tracking-tight">Sales Management</h1>
        <p className="text-[#141b2d]-muted text-[0.88rem] mt-0.5">Manage apartments, sales, and payments</p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        <button onClick={() => setTab('apartments')} className={`px-4 py-2 rounded-sm text-sm font-semibold transition-colors whitespace-nowrap ${tab === 'apartments' ? 'bg-[rgba(30,77,140,0.12)] text-[#1e4d8c] border border-[#1e4d8c]/20' : 'text-[#141b2d]-muted hover:text-[#141b2d] hover:bg-[#f4f6fb]'}`}>
          <Home className="w-4 h-4 inline mr-1.5" /> Apartments ({apartments.length})
        </button>
        <button onClick={() => setTab('sales')} className={`px-4 py-2 rounded-sm text-sm font-semibold transition-colors whitespace-nowrap ${tab === 'sales' ? 'bg-[rgba(30,77,140,0.12)] text-[#1e4d8c] border border-[#1e4d8c]/20' : 'text-[#141b2d]-muted hover:text-[#141b2d] hover:bg-[#f4f6fb]'}`}>
          <DollarSign className="w-4 h-4 inline mr-1.5" /> Sales ({sales.length})
        </button>
      </div>

      {tab === 'apartments' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={() => setShowAddApt(!showAddApt)} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Add Apartment</button></div>
          {showAddApt && (
            <div className="card p-5 space-y-3">
              <h3 className="font-display font-semibold text-sm">New Apartment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <input placeholder="Unit # (e.g. 1A)" value={aptForm.unit_number} onChange={e => setAptForm(f => ({...f, unit_number: e.target.value}))} className="input text-sm" />
                <select value={aptForm.bedrooms} onChange={e => setAptForm(f => ({...f, bedrooms: parseInt(e.target.value)}))} className="select-input text-sm">
                  <option value={1}>1 Bedroom</option><option value={2}>2 Bedroom</option><option value={3}>3 Bedroom</option>
                </select>
                <input type="number" placeholder="Floor" value={aptForm.floor} onChange={e => setAptForm(f => ({...f, floor: parseInt(e.target.value)}))} className="input text-sm" />
                <input type="number" placeholder="Area (m²)" value={aptForm.area_m2} onChange={e => setAptForm(f => ({...f, area_m2: e.target.value}))} className="input text-sm" />
                <input type="number" placeholder="Price (ETB)" value={aptForm.price} onChange={e => setAptForm(f => ({...f, price: e.target.value}))} className="input text-sm" />
              </div>
              <div className="flex gap-2"><button onClick={addApartment} className="btn-primary text-sm">Save</button><button onClick={() => setShowAddApt(false)} className="btn-secondary text-sm">Cancel</button></div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {apartments.map(apt => (
              <div key={apt.id} className="card-hover p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-[#1e4d8c]" />
                    <span className="font-display font-semibold text-[#141b2d]">Unit {apt.unit_number}</span>
                  </div>
                  <select value={apt.status} onChange={e => updateAptStatus(apt.id, e.target.value)} className={`text-xs rounded-full px-2 py-0.5 bg-transparent border-0 outline-none cursor-pointer font-semibold ${statusBadge[apt.status]}`}>
                    {Object.entries(statusLabel).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1 text-sm text-[#141b2d]-secondary">
                  <p>{apt.bedrooms} Bedroom · Floor {apt.floor} · {apt.area_m2} m²</p>
                  <p className="font-display font-bold text-[#1e4d8c] text-lg">{fmt(apt.price)} ETB</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'sales' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={() => setShowAddSale(!showAddSale)} className="btn-primary"><Plus className="w-4 h-4" /> Record Sale</button></div>
          {showAddSale && (
            <div className="card p-5 space-y-3">
              <h3 className="font-display font-semibold text-sm">New Sale</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select value={saleForm.apartment_id} onChange={e => setSaleForm(f => ({...f, apartment_id: e.target.value}))} className="select-input text-sm">
                  <option value="">Select apartment</option>
                  {availableApts.map(a => <option key={a.id} value={a.id}>Unit {a.unit_number} — {a.bedrooms}BR — {fmt(a.price)} ETB</option>)}
                </select>
                <input placeholder="Buyer name" value={saleForm.buyer_name} onChange={e => setSaleForm(f => ({...f, buyer_name: e.target.value}))} className="input text-sm" />
                <input placeholder="Buyer phone" value={saleForm.buyer_phone} onChange={e => setSaleForm(f => ({...f, buyer_phone: e.target.value}))} className="input text-sm" />
                <input type="number" placeholder="Sale price (ETB)" value={saleForm.total_price} onChange={e => setSaleForm(f => ({...f, total_price: e.target.value}))} className="input text-sm" />
                <input type="date" value={saleForm.sale_date} onChange={e => setSaleForm(f => ({...f, sale_date: e.target.value}))} className="input text-sm" />
              </div>
              <div className="flex gap-2"><button onClick={addSale} className="btn-primary text-sm">Save Sale</button><button onClick={() => setShowAddSale(false)} className="btn-secondary text-sm">Cancel</button></div>
            </div>
          )}
          {sales.length > 0 ? (
            <div className="space-y-3">
              {sales.map(sale => (
                <div key={sale.id} className="card p-5">
                  <div className="flex items-start gap-3">
                    <button onClick={() => setExpandedSale(e => ({...e, [sale.id]: !e[sale.id]}))} className="text-[#141b2d]-muted mt-1 flex-shrink-0">
                      {expandedSale[sale.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold text-[#141b2d]">Unit {sale.unit_number}</span>
                        <span className="badge-green text-[0.65rem]">Sold</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm text-[#141b2d]-secondary">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 flex-shrink-0" />{sale.buyer_name}</span>
                        {sale.buyer_phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{sale.buyer_phone}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-display font-bold text-[#1e4d8c] text-sm sm:text-base">{fmt(sale.total_price)} ETB</p>
                      <p className="text-xs text-[#141b2d]-muted">Paid: {fmt(sale.totalPaid)} · Remaining: {fmt(sale.remaining)}</p>
                    </div>
                  </div>
                  {expandedSale[sale.id] && (
                    <div className="mt-4 pt-4 border-t border-[#d8e0ed]-light space-y-3">
                      <h4 className="text-xs text-[#141b2d]-muted uppercase tracking-wider font-semibold">Payment History</h4>
                      {sale.payments?.length > 0 ? sale.payments.map(p => (
                        <div key={p.id} className="flex items-center gap-3 p-2 rounded-sm bg-[#f4f6fb]/50 text-sm">
                          <span className="text-[#141b2d]-secondary">{p.date}</span>
                          <span className="badge-primary text-[0.6rem]">{p.type}</span>
                          <span className="font-semibold text-[#1e4d8c]">{fmt(p.amount)} ETB</span>
                          {p.notes && <span className="text-[#141b2d]-muted">{p.notes}</span>}
                        </div>
                      )) : <p className="text-[#141b2d]-muted text-sm">No payments recorded</p>}
                      {showAddPayment === sale.id ? (
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                          <input type="number" placeholder="Amount" value={payForm.amount} onChange={e => setPayForm(f => ({...f, amount: e.target.value}))} className="input text-sm w-32" />
                          <input type="date" value={payForm.date} onChange={e => setPayForm(f => ({...f, date: e.target.value}))} className="input text-sm" />
                          <select value={payForm.type} onChange={e => setPayForm(f => ({...f, type: e.target.value}))} className="select-input text-sm w-32">
                            <option value="deposit">Deposit</option><option value="milestone">Milestone</option><option value="final">Final</option><option value="other">Other</option>
                          </select>
                          <button onClick={() => addPayment(sale.id)} className="btn-primary text-xs py-2">Save</button>
                          <button onClick={() => setShowAddPayment(null)} className="btn-secondary text-xs py-2">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setShowAddPayment(sale.id)} className="flex items-center gap-1 text-xs text-[#1e4d8c] hover:text-[#1e4d8c]-hover font-medium"><Plus className="w-3.5 h-3.5" /> Add Payment</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-[#141b2d]-muted text-sm text-center py-12">No sales recorded yet</p>}
        </div>
      )}
    </div>
  )
}
