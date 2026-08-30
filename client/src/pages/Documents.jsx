import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { FolderOpen, Upload, Trash2, FileText, Image, File } from 'lucide-react'

const folders = [
  { id: 'all', label: 'All Documents' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'permits', label: 'Permits' },
  { id: 'receipts', label: 'Receipts' },
  { id: 'photos', label: 'Photos' },
  { id: 'reports', label: 'Reports' },
]

function fileIcon(type) {
  if (!type) return <File className="w-5 h-5 text-[#141b2d]-muted" />
  if (type.startsWith('image')) return <Image className="w-5 h-5 text-[#2563eb]" />
  if (type.includes('pdf')) return <FileText className="w-5 h-5 text-[#dc2626]" />
  return <File className="w-5 h-5 text-[#1e4d8c]" />
}

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFolder, setActiveFolder] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', folder: 'contracts' })

  const load = () => { const folder = activeFolder === 'all' ? '' : activeFolder; api.documents(folder).then(setDocs).catch(console.error).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [activeFolder])

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file || !form.title) return
    setUploading(true); await api.uploadDocument(form.title, form.folder, file)
    setForm({ title: '', folder: 'contracts' }); setUploading(false); e.target.value = ''; load()
  }
  async function deleteDoc(id) { if (!confirm('Delete?')) return; await api.deleteDocument(id); load() }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-[3px] border-[rgba(30,77,140,0.12)] border-t-[#1e4d8c] rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.28rem] font-bold tracking-tight">Document Vault</h1>
        <p className="text-[#141b2d]-muted text-[0.88rem] mt-0.5">Organize contracts, permits, receipts, and photos</p>
      </div>

      <div className="card p-5">
        <h3 className="font-display font-semibold text-sm mb-3">Upload Document</h3>
        <div className="flex flex-col gap-3">
          <input placeholder="Document title" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="input text-sm flex-1" />
          <select value={form.folder} onChange={e => setForm(f => ({...f, folder: e.target.value}))} className="select-input text-sm w-40">
            {folders.filter(f => f.id !== 'all').map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
          <label className="btn-primary text-sm cursor-pointer">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Choose File'}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading || !form.title} />
          </label>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {folders.map(f => (
          <button key={f.id} onClick={() => setActiveFolder(f.id)}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors ${activeFolder === f.id ? 'bg-[rgba(30,77,140,0.12)] text-[#1e4d8c] border border-[#1e4d8c]/20' : 'text-[#141b2d]-muted hover:text-[#141b2d] hover:bg-[#f4f6fb] border border-transparent'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {docs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {docs.map(doc => (
            <div key={doc.id} className="card-hover p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-sm bg-[#f4f6fb] flex items-center justify-center flex-shrink-0">{fileIcon(doc.file_type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#141b2d] truncate">{doc.title}</p>
                <p className="text-xs text-[#141b2d]-muted mt-0.5 capitalize">{doc.folder} · {new Date(doc.created_at).toLocaleDateString()}</p>
                <a href={doc.file_path} target="_blank" rel="noopener" className="text-xs text-[#1e4d8c] hover:text-[#1e4d8c]-hover mt-1 inline-block font-medium">Open file</a>
              </div>
              <button onClick={() => deleteDoc(doc.id)} className="p-1 text-[#141b2d]-muted hover:text-[#dc2626]"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16"><FolderOpen className="w-12 h-12 text-[#141b2d]-muted/30 mx-auto mb-3" /><p className="text-[#141b2d]-muted text-sm">No documents in this folder</p></div>
      )}
    </div>
  )
}
