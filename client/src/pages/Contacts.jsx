import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Plus, Phone, Mail, Building2, Trash2, Edit3 } from 'lucide-react'

const roles = ['all', 'contractor', 'worker', 'supplier', 'lawyer', 'other']

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeRole, setActiveRole] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', role: 'contractor', phone: '', email: '', company: '', notes: '' })

  const load = () => { const role = activeRole === 'all' ? '' : activeRole; api.contacts(role).then(setContacts).catch(console.error).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [activeRole])

  async function addContact() { if (!form.name) return; await api.addContact(form); setForm({ name: '', role: 'contractor', phone: '', email: '', company: '', notes: '' }); setShowAdd(false); load() }
  async function updateContact() { if (!form.name) return; await api.updateContact(editing, form); setEditing(null); setForm({ name: '', role: 'contractor', phone: '', email: '', company: '', notes: '' }); load() }
  async function deleteContact(id) { if (!confirm('Delete?')) return; await api.deleteContact(id); load() }
  function startEdit(c) { setEditing(c.id); setForm({ name: c.name, role: c.role, phone: c.phone || '', email: c.email || '', company: c.company || '', notes: c.notes || '' }); setShowAdd(true) }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-[3px] border-[rgba(30,77,140,0.12)] border-t-[#1e4d8c] rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.28rem] font-bold tracking-tight">Team & Contacts</h1>
          <p className="text-[#141b2d]-muted text-[0.88rem] mt-0.5">Workers, contractors, suppliers, and legal</p>
        </div>
        <button onClick={() => { setShowAdd(!showAdd); setEditing(null); setForm({ name: '', role: 'contractor', phone: '', email: '', company: '', notes: '' }) }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {roles.map(r => (
          <button key={r} onClick={() => setActiveRole(r)}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold capitalize transition-colors ${activeRole === r ? 'bg-[rgba(30,77,140,0.12)] text-[#1e4d8c] border border-[#1e4d8c]/20' : 'text-[#141b2d]-muted hover:text-[#141b2d] hover:bg-[#f4f6fb] border border-transparent'}`}>
            {r === 'all' ? 'All' : r}
          </button>
        ))}
      </div>

      {showAdd && (
        <div className="card p-5 space-y-3">
          <h3 className="font-display font-semibold text-sm">{editing ? 'Edit Contact' : 'New Contact'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Full name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="input text-sm" />
            <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} className="select-input text-sm capitalize">
              {roles.filter(r => r !== 'all').map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="input text-sm" />
            <input placeholder="Email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="input text-sm" />
            <input placeholder="Company" value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} className="input text-sm" />
            <input placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="input text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={editing ? updateContact : addContact} className="btn-primary text-sm">{editing ? 'Update' : 'Save'}</button>
            <button onClick={() => { setShowAdd(false); setEditing(null) }} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map(c => (
            <div key={c.id} className="card-hover p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[rgba(30,77,140,0.12)] flex items-center justify-center text-[#1e4d8c] font-bold text-sm">{c.name.charAt(0)}</div>
                  <div>
                    <p className="font-display font-semibold text-sm text-[#141b2d]">{c.name}</p>
                    <p className="text-xs text-[#141b2d]-muted capitalize">{c.role || 'Contact'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(c)} className="p-1 text-[#141b2d]-muted hover:text-[#1e4d8c]"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteContact(c.id)} className="p-1 text-[#141b2d]-muted hover:text-[#dc2626]"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-[#141b2d]-secondary">
                {c.phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#141b2d]-muted" /> {c.phone}</p>}
                {c.email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#141b2d]-muted" /> {c.email}</p>}
                {c.company && <p className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-[#141b2d]-muted" /> {c.company}</p>}
                {c.notes && <p className="text-xs text-[#141b2d]-muted mt-2">{c.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16"><div className="w-12 h-12 rounded-full bg-[#f4f6fb] mx-auto mb-3 flex items-center justify-center"><Plus className="w-6 h-6 text-[#141b2d]-muted/30" /></div><p className="text-[#141b2d]-muted text-sm">No contacts yet</p></div>
      )}
    </div>
  )
}
