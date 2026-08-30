import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Plus, Camera, Clock, AlertTriangle, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'

const statusColors = { completed: 'badge-green', in_progress: 'badge-accent', delayed: 'badge-red', not_started: 'badge-gray' }
const statusLabels = { completed: 'Completed', in_progress: 'In Progress', delayed: 'Delayed', not_started: 'Not Started' }

export default function Construction() {
  const [phases, setPhases] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [showAdd, setShowAdd] = useState(null)
  const [newMilestone, setNewMilestone] = useState({ title: '', due_date: '', assigned_to: '', notes: '' })

  const load = () => api.phases().then(setPhases).catch(console.error).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  async function updatePhaseStatus(id, status) { await api.updatePhase(id, { status }); load() }
  async function addMilestone(phaseId) {
    if (!newMilestone.title) return
    await api.addMilestone({ phase_id: phaseId, ...newMilestone })
    setNewMilestone({ title: '', due_date: '', assigned_to: '', notes: '' }); setShowAdd(null); load()
  }
  async function updateMilestone(id, status) { await api.updateMilestone(id, { status }); load() }
  async function deleteMilestone(id) { if (!confirm('Delete this milestone?')) return; await api.deleteMilestone(id); load() }
  async function uploadPhoto(milestoneId, file) { await api.uploadMilestonePhoto(milestoneId, file); load() }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-[3px] border-[rgba(30,77,140,0.12)] border-t-[#1e4d8c] rounded-full animate-spin" /></div>

  const totalMs = phases.reduce((s, p) => s + p.milestones.length, 0)
  const completedMs = phases.reduce((s, p) => s + p.milestones.filter(m => m.status === 'completed').length, 0)
  const overallProgress = totalMs > 0 ? Math.round((completedMs / totalMs) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.28rem] font-bold tracking-tight">Construction Tracker</h1>
        <p className="text-[#141b2d]-muted text-[0.88rem] mt-0.5">Track phases, milestones, and site progress</p>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-semibold text-sm text-[#141b2d]">Overall Progress</p>
          <p className="font-display text-[#1e4d8c] font-bold">{overallProgress}%</p>
        </div>
        <div className="h-4 bg-[#f4f6fb] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#1e4d8c] to-[#2563b5] rounded-full transition-all duration-700" style={{ width: `${overallProgress}%` }} />
        </div>
        <p className="text-xs text-[#141b2d]-muted mt-2">{completedMs} of {totalMs} milestones completed</p>
      </div>

      <div className="space-y-3">
        {phases.map(phase => (
          <div key={phase.id} className="card overflow-hidden">
            <button className="w-full text-left hover:bg-[#f4f6fb]/50 transition-colors p-4"
              onClick={() => setExpanded(e => ({ ...e, [phase.id]: !e[phase.id] }))}
            >
              <div className="flex items-center gap-3">
                {expanded[phase.id] ? <ChevronDown className="w-4 h-4 text-[#141b2d]-muted flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-[#141b2d]-muted flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm text-[#141b2d] truncate">{phase.name}</p>
                  <p className="text-xs text-[#141b2d]-muted mt-0.5">{phase.milestones.length} milestones · {phase.progress}% complete</p>
                </div>
                <div className="w-20 h-2 bg-[#f4f6fb] rounded-full overflow-hidden flex-shrink-0">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${phase.progress}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 ml-7">
                <select value={phase.status} onChange={e => { e.stopPropagation(); updatePhaseStatus(phase.id, e.target.value) }}
                  onClick={e => e.stopPropagation()} className="select-input text-xs py-1.5 px-2 w-auto"
                >
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </button>

            {expanded[phase.id] && (
              <div className="border-t border-[#d8e0ed]-light p-4 space-y-2 bg-[#f4f6fb]/30">
                {phase.milestones.map(m => (
                  <div key={m.id} className="p-3 rounded-sm bg-elevated border border-[#d8e0ed]-light">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#141b2d] truncate">{m.title}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#141b2d]-muted">
                          {m.due_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due: {m.due_date}</span>}
                          {m.assigned_to && <span>Assigned: {m.assigned_to}</span>}
                          {m.photo_path && <a href={m.photo_path} target="_blank" rel="noopener" className="text-[#1e4d8c] hover:underline">View Photo</a>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#d8e0ed]-light">
                      <select value={m.status} onChange={e => updateMilestone(m.id, e.target.value)} className="select-input text-xs py-1.5 px-2 flex-1 min-w-0">
                        {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <label className="p-1.5 text-[#141b2d]-muted hover:text-[#1e4d8c] cursor-pointer transition-colors rounded-sm hover:bg-[#1e4d8c]/5 flex-shrink-0">
                        <Camera className="w-4 h-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadPhoto(m.id, e.target.files[0])} />
                      </label>
                      <button onClick={() => deleteMilestone(m.id)} className="p-1.5 text-[#141b2d]-muted hover:text-[#dc2626] transition-colors rounded-sm hover:bg-[#fef2f2] flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {showAdd === phase.id ? (
                  <div className="p-4 rounded-sm bg-elevated border border-[#d8e0ed]-light space-y-3">
                    <input placeholder="Milestone title" value={newMilestone.title} onChange={e => setNewMilestone(n => ({ ...n, title: e.target.value }))} className="input text-sm" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="date" value={newMilestone.due_date} onChange={e => setNewMilestone(n => ({ ...n, due_date: e.target.value }))} className="input text-sm" />
                      <input placeholder="Assigned to" value={newMilestone.assigned_to} onChange={e => setNewMilestone(n => ({ ...n, assigned_to: e.target.value }))} className="input text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => addMilestone(phase.id)} className="btn-primary text-xs py-2">Add Milestone</button>
                      <button onClick={() => setShowAdd(null)} className="btn-secondary text-xs py-2">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAdd(phase.id)} className="flex items-center gap-2 text-xs text-[#1e4d8c] hover:text-[#1e4d8c]-hover font-medium transition-colors mt-2">
                    <Plus className="w-3.5 h-3.5" /> Add Milestone
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
