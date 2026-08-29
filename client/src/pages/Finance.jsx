import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Trash2, Edit3 } from 'lucide-react'

function fmt(n) { return n.toLocaleString() }
const categories = ['Materials', 'Labor', 'Permits & Legal', 'Equipment', 'Other']
const tooltipStyle = { background: '#fff', border: '1px solid #d8e0ed', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 14px rgba(15,23,42,0.07)' }

export default function Finance() {
  const [budget, setBudget] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ category: 'Materials', description: '', amount: '', date: new Date().toISOString().slice(0,10), notes: '' })
  const [editingBudget, setEditingBudget] = useState(null)

  const load = () => Promise.all([api.budget(), api.expenses(), api.financeSummary()]).then(([b, e, s]) => { setBudget(b); setExpenses(e.expenses); setSummary(s) }).catch(console.error).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  async function addExpense() {
    if (!form.description || !form.amount) return
    await api.addExpense(form); setForm({ category: 'Materials', description: '', amount: '', date: new Date().toISOString().slice(0,10), notes: '' }); setShowAdd(false); load()
  }
  async function deleteExpense(id) { if (!confirm('Delete?')) return; await api.deleteExpense(id); load() }
  async function saveBudget(category, value) { await api.updateBudget(category, parseFloat(value) || 0); setEditingBudget(null); load() }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-[3px] border-[rgba(30,77,140,0.12)] border-t-[#1e4d8c] rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.28rem] font-bold tracking-tight">Budget & Finance</h1>
          <p className="text-[#141b2d]-muted text-[0.88rem] mt-0.5">Track project budget and expenses</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary"><Plus className="w-4 h-4" /> Add Expense</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Budget', value: summary?.totalBudget || 0, color: 'text-[#1e4d8c]' },
          { label: 'Total Spent', value: summary?.totalSpent || 0, color: 'text-[#dc2626]' },
          { label: 'Remaining', value: summary?.remaining || 0, color: 'text-[#059669]' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <p className="text-[0.7rem] text-[#141b2d]-muted uppercase tracking-wider font-semibold">{s.label}</p>
            <p className={`font-display text-2xl font-bold mt-1 ${s.color}`}>{fmt(s.value)} ETB</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h3 className="font-display font-semibold text-sm mb-4">Budget Allocation</h3>
        <div className="space-y-3">
          {budget?.categories.map(cat => (
            <div key={cat.category} className="flex items-center gap-4 p-3 rounded-sm bg-[#f4f6fb]/50">
              <div className="w-32 flex-shrink-0"><p className="text-sm font-medium text-[#141b2d]">{cat.category}</p></div>
              <div className="flex-1 h-3 bg-border-light rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#1e4d8c] to-[#2563b5] rounded-full" style={{ width: `${cat.allocated > 0 ? Math.min((cat.spent / cat.allocated) * 100, 100) : 0}%` }} />
              </div>
              {editingBudget === cat.category ? (
                <div className="flex items-center gap-2">
                  <input type="number" defaultValue={cat.allocated} className="input text-xs w-28 py-1.5" id={`budget-${cat.category}`} />
                  <button onClick={() => saveBudget(cat.category, document.getElementById(`budget-${cat.category}`).value)} className="btn-primary text-xs py-1.5 px-3">Save</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[#141b2d]-muted">
                  <span>{fmt(cat.spent)} / {fmt(cat.allocated)} ETB</span>
                  <button onClick={() => setEditingBudget(cat.category)} className="p-1 hover:text-[#1e4d8c]"><Edit3 className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {summary?.byMonth?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Monthly Spending</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={summary.byMonth.reverse()}>
              <XAxis dataKey="month" tick={{ fill: '#5a6578', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6578', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => fmt(v) + ' ETB'} contentStyle={tooltipStyle} />
              <Bar dataKey="total" fill="#1e4d8c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {showAdd && (
        <div className="card p-5 space-y-3">
          <h3 className="font-display font-semibold text-sm">New Expense</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="select-input text-sm">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="number" placeholder="Amount (ETB)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="input text-sm" />
            <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input text-sm" />
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input text-sm" />
          </div>
          <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input text-sm" />
          <div className="flex gap-2">
            <button onClick={addExpense} className="btn-primary text-sm">Save Expense</button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="card p-5">
        <h3 className="font-display font-semibold text-sm mb-4">Recent Expenses</h3>
        {expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#d8e0ed]">
                <th className="text-left py-2 px-3 text-[0.65rem] text-[#141b2d]-muted uppercase tracking-wider font-semibold">Date</th>
                <th className="text-left py-2 px-3 text-[0.65rem] text-[#141b2d]-muted uppercase tracking-wider font-semibold">Description</th>
                <th className="text-left py-2 px-3 text-[0.65rem] text-[#141b2d]-muted uppercase tracking-wider font-semibold">Category</th>
                <th className="text-right py-2 px-3 text-[0.65rem] text-[#141b2d]-muted uppercase tracking-wider font-semibold">Amount</th>
                <th className="text-right py-2 px-3"></th>
              </tr></thead>
              <tbody>{expenses.map(exp => (
                <tr key={exp.id} className="border-b border-[#d8e0ed]-light hover:bg-[#f4f6fb]/50">
                  <td className="py-2.5 px-3 text-[#141b2d]-secondary">{exp.date}</td>
                  <td className="py-2.5 px-3 text-[#141b2d]">{exp.description}</td>
                  <td className="py-2.5 px-3"><span className="badge-primary text-[0.65rem]">{exp.category}</span></td>
                  <td className="py-2.5 px-3 text-right font-display font-semibold text-[#1e4d8c]">{fmt(exp.amount)} ETB</td>
                  <td className="py-2.5 px-3 text-right"><button onClick={() => deleteExpense(exp.id)} className="p-1 text-[#141b2d]-muted hover:text-[#dc2626]"><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="text-[#141b2d]-muted text-sm text-center py-8">No expenses recorded yet</p>}
      </div>
    </div>
  )
}
