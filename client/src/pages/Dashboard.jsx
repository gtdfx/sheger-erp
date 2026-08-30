import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Eye, Users, DollarSign, Building2, TrendingUp, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

const COLORS = ['#1e4d8c', '#c4a35a', '#34d399', '#f87171', '#a78bfa', '#fb923c', '#38bdf8']
const tooltipStyle = { background: '#fff', border: '1px solid #d8e0ed', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 14px rgba(15,23,42,0.07)' }

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
  return n.toLocaleString()
}

function KPICard({ icon: Icon, label, value, sub, color }) {
  const colors = { primary: '#1e4d8c', accent: '#c4a35a', green: '#059669', red: '#dc2626' }
  const bgs = { primary: 'rgba(30,77,140,0.12)', accent: 'rgba(196,163,90,0.15)', green: '#ecfdf5', red: '#fef2f2' }
  return (
    <div className="card-hover" style={{ padding: '20px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: bgs[color], display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: colors[color] }}>
        <Icon style={{ width: '20px', height: '20px' }} />
      </div>
      <p style={{ fontSize: '0.7rem', color: '#7d8899', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#141b2d', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</p>
      {sub && <p style={{ fontSize: '0.75rem', color: '#7d8899', margin: '4px 0 0' }}>{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.dashboard().then(setData).catch(console.error).finally(() => setLoading(false)) }, [])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}><div style={{ width: '32px', height: '32px', border: '3px solid rgba(30,77,140,0.12)', borderTopColor: '#1e4d8c', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /></div>
  if (!data) return <div style={{ textAlign: 'center', color: '#7d8899', padding: '80px 0' }}>Failed to load dashboard</div>

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.28rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#7d8899', fontSize: '0.88rem', marginTop: '4px' }}>Project overview and key metrics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        <KPICard icon={Eye} label="Total Budget" value={`${fmt(data.budget.total)} ETB`} sub={`${fmt(data.budget.remaining)} remaining`} color="primary" />
        <KPICard icon={DollarSign} label="Total Spent" value={`${fmt(data.budget.spent)} ETB`} sub={`${data.budget.total > 0 ? Math.round(data.budget.spent / data.budget.total * 100) : 0}% of budget`} color="red" />
        <KPICard icon={Building2} label="Construction" value={`${data.construction.progress}%`} sub="Overall progress" color="accent" />
        <KPICard icon={Users} label="Apartments" value={`${data.sales.sold}/${data.sales.total}`} sub={`${data.sales.available} available`} color="green" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.875rem', margin: '0 0 16px' }}>Expenses by Category</h3>
          {data.expensesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.expensesByCategory} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {data.expensesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v) + ' ETB'} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign: 'center', color: '#7d8899', padding: '80px 0', fontSize: '0.875rem' }}>No expenses recorded yet</div>}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.875rem', margin: '0 0 16px' }}>Sales Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { name: 'Available', value: data.sales.available, fill: '#1e4d8c' },
              { name: 'Reserved', value: data.sales.reserved, fill: '#c4a35a' },
              { name: 'Sold', value: data.sales.sold, fill: '#34d399' },
            ]}>
              <XAxis dataKey="name" tick={{ fill: '#5a6578', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6578', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontWeight: 600, fontSize: '0.875rem', margin: '0 0 16px' }}>Construction Phases</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {data.construction.phases.map(phase => (
            <div key={phase.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '140px', flexShrink: 0 }}><p style={{ fontSize: '0.82rem', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{phase.name}</p></div>
              <div style={{ flex: 1, height: '12px', background: '#f4f6fb', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #1e4d8c, #2563b5)', borderRadius: '99px', transition: 'width 0.7s ease', width: `${phase.progress || 0}%` }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#7d8899', width: '40px', textAlign: 'right', fontWeight: 500 }}>{phase.progress || 0}%</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.875rem', margin: '0 0 16px' }}>Upcoming Milestones</h3>
          {data.upcomingMilestones.length > 0 ? data.upcomingMilestones.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: '#f4f6fb', marginBottom: '8px' }}>
              {m.status === 'completed' ? <CheckCircle2 style={{ width: '16px', height: '16px', color: '#059669' }} /> :
               m.status === 'in_progress' ? <Clock style={{ width: '16px', height: '16px', color: '#c4a35a' }} /> :
               m.status === 'delayed' ? <AlertTriangle style={{ width: '16px', height: '16px', color: '#dc2626' }} /> :
               <Clock style={{ width: '16px', height: '16px', color: '#7d8899' }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</p>
                <p style={{ fontSize: '0.75rem', color: '#7d8899', margin: '2px 0 0' }}>{m.phase_name}</p>
              </div>
              <span className={`badge ${m.status === 'completed' ? 'badge-green' : m.status === 'in_progress' ? 'badge-accent' : m.status === 'delayed' ? 'badge-red' : 'badge-gray'}`}>
                {m.status.replace('_', ' ')}
              </span>
            </div>
          )) : <p style={{ color: '#7d8899', fontSize: '0.875rem', textAlign: 'center', padding: '32px 0' }}>No milestones yet</p>}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.875rem', margin: '0 0 16px' }}>Recent Activity</h3>
          {data.recentActivity.length > 0 ? data.recentActivity.map(a => (
            <div key={a.id} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '8px', background: '#f4f6fb', marginBottom: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(30,77,140,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUp style={{ width: '14px', height: '14px', color: '#1e4d8c' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>{a.details}</p>
                <p style={{ fontSize: '0.75rem', color: '#7d8899', margin: '4px 0 0' }}>{a.user_name} — {new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )) : <p style={{ color: '#7d8899', fontSize: '0.875rem', textAlign: 'center', padding: '32px 0' }}>No activity yet</p>}
        </div>
      </div>
    </div>
  )
}
