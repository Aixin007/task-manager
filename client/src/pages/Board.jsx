import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import ChatBot from '../components/ChatBot'

const API = 'http://localhost:8000/api'
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' })

const STAGES = ['Todo', 'In Progress', 'Done']
const STAGE_CFG = {
  'Todo': { gradient: 'linear-gradient(135deg,rgba(251,191,36,0.12),rgba(245,158,11,0.06))', border: 'rgba(251,191,36,0.25)', glow: 'rgba(251,191,36,0.2)', dot: '#fbbf24', countBg: 'rgba(251,191,36,0.18)', countColor: '#fbbf24', icon: '📋', empty: 'No tasks yet — add one!' },
  'In Progress': { gradient: 'linear-gradient(135deg,rgba(96,165,250,0.12),rgba(59,130,246,0.06))', border: 'rgba(96,165,250,0.25)', glow: 'rgba(96,165,250,0.2)', dot: '#60a5fa', countBg: 'rgba(96,165,250,0.18)', countColor: '#60a5fa', icon: '⚡', empty: 'Drag tasks here to start!' },
  'Done': { gradient: 'linear-gradient(135deg,rgba(52,211,153,0.12),rgba(16,185,129,0.06))', border: 'rgba(52,211,153,0.25)', glow: 'rgba(52,211,153,0.2)', dot: '#34d399', countBg: 'rgba(52,211,153,0.18)', countColor: '#34d399', icon: '✅', empty: 'Completed tasks appear here!' }
}

const NEXT_STEPS = [
  'Pass to design team','Pass to engineering team','Pass to QA team',
  'Pass to data team','Send for review','Schedule meeting',
  'Awaiting feedback','Ready to deploy','Needs more research','Other (custom)'
]

const PRIORITY_CFG = [
  { label: 'Low', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  { label: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 10px; }
  ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.3); border-radius: 10px; }
  @keyframes float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }
  @keyframes fadeIn { from{opacity:0}to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(40px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes progressAnim { from{width:0} }
  .orb { position:fixed;border-radius:50%;pointer-events:none;z-index:0;animation:float 6s ease-in-out infinite; }
  .task-card { background:rgba(255,255,255,0.04);border-radius:14px;padding:14px;border:1px solid rgba(255,255,255,0.07);cursor:grab;position:relative;backdrop-filter:blur(10px);transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);user-select:none; }
  .task-card:hover { transform:translateY(-3px) scale(1.02);box-shadow:0 16px 40px rgba(0,0,0,0.4),0 0 0 1px rgba(167,139,250,0.2); }
  .task-card:active { cursor:grabbing;transform:scale(0.97); }
  .task-card.dragging { opacity:0.3; }
  .card-actions { display:flex;gap:4px;opacity:0;transition:opacity 0.2s; }
  .task-card:hover .card-actions { opacity:1; }
  .action-btn { cursor:pointer;font-size:0.78rem;padding:4px 7px;border-radius:8px;transition:transform 0.15s;border:1px solid; }
  .action-btn:hover { transform:scale(1.2); }
  .edit-btn { background:rgba(96,165,250,0.1);border-color:rgba(96,165,250,0.2); }
  .del-btn { background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.2); }
  .col-empty { color:#334155;font-size:0.78rem;text-align:center;padding:28px 16px;border:2px dashed rgba(255,255,255,0.06);border-radius:14px;transition:all 0.3s;line-height:1.6; }
  .col-empty.drag-over { border-color:rgba(167,139,250,0.4)!important;background:rgba(167,139,250,0.05)!important; }
  .logout-btn:hover { background:rgba(239,68,68,0.12)!important;border-color:rgba(239,68,68,0.3)!important;color:#fca5a5!important; }
  .fab:hover { transform:scale(1.15) rotate(90deg)!important;box-shadow:0 12px 40px rgba(167,139,250,0.6)!important; }
  .fab:active { transform:scale(0.9)!important; }
  .nav-btn { transition:all 0.2s; }
  .nav-btn:hover { background:rgba(167,139,250,0.15)!important;color:#a78bfa!important; }
  .nav-btn.active { background:rgba(167,139,250,0.2)!important;color:#a78bfa!important;border-color:rgba(167,139,250,0.4)!important; }
  .form-input:focus { border-color:rgba(167,139,250,0.5)!important;box-shadow:0 0 0 3px rgba(167,139,250,0.1)!important;outline:none; }
  .form-input::placeholder { color:#334155; }
  .form-input option { background:#1a1a2e;color:#fff; }
  input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(1) opacity(0.5);cursor:pointer; }
  .progress-bar { height:4px;border-radius:10px;background:rgba(255,255,255,0.06);overflow:hidden;margin-top:8px; }
  .progress-fill { height:100%;border-radius:10px;transition:width 0.6s cubic-bezier(0.34,1.56,0.64,1);animation:progressAnim 0.6s ease; }
  .archive-card { background:rgba(255,255,255,0.03);border-radius:14px;padding:16px;border:1px solid rgba(255,255,255,0.07);transition:all 0.2s; }
  .archive-card:hover { background:rgba(255,255,255,0.05);border-color:rgba(239,68,68,0.2); }
  .restore-btn:hover { background:rgba(52,211,153,0.2)!important; }
  .perm-del-btn:hover { background:rgba(239,68,68,0.2)!important; }
  .toast { position:fixed;bottom:90px;right:28px;z-index:200;background:rgba(30,30,50,0.95);border:1px solid rgba(167,139,250,0.2);border-radius:12px;padding:12px 18px;font-size:0.82rem;color:#a78bfa;backdrop-filter:blur(20px);box-shadow:0 8px 30px rgba(0,0,0,0.4);animation:slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1); }
  .column { flex:1;min-width:280px;border-radius:20px;padding:18px;border:1px solid;display:flex;flex-direction:column;gap:12px;backdrop-filter:blur(10px);transition:all 0.3s ease; }
  .priority-badge { font-size:0.62rem;padding:2px 8px;border-radius:20px;font-weight:700;letter-spacing:0.03em; }
  .priority-num { width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:800; }
  .folder-btn:hover { background:rgba(167,139,250,0.2)!important;border-color:rgba(167,139,250,0.4)!important; }
  .cancel-btn:hover { background:rgba(255,255,255,0.05)!important; }
  .submit-btn:hover { opacity:0.9;transform:translateY(-1px); }
  .close-btn:hover { background:rgba(239,68,68,0.1)!important;color:#fca5a5!important; }
`

function getDaysLeft(endDate) {
  if (!endDate) return null
  const diff = Math.ceil((new Date(endDate) - new Date().setHours(0,0,0,0)) / 86400000)
  return diff
}

function TimeChip({ endDate }) {
  const days = getDaysLeft(endDate)
  if (days === null) return null
  const cfg = days < 0 ? { bg:'rgba(239,68,68,0.15)', color:'#fca5a5', label:`${Math.abs(days)}d overdue` }
    : days === 0 ? { bg:'rgba(251,191,36,0.2)', color:'#fbbf24', label:'Due today' }
    : days <= 3 ? { bg:'rgba(251,191,36,0.15)', color:'#fbbf24', label:`${days}d left` }
    : { bg:'rgba(52,211,153,0.15)', color:'#34d399', label:`${days}d left` }
  return <span style={{ fontSize:'0.62rem', padding:'2px 8px', borderRadius:20, fontWeight:600, background:cfg.bg, color:cfg.color }}>⏱ {cfg.label}</span>
}

export default function Board() {
  const [tasks, setTasks] = useState([])
  const [archived, setArchived] = useState([])
  const [view, setView] = useState('board')
  const [showModal, setShowModal] = useState(false)
  const [editTaskId, setEditTaskId] = useState(null)
  const [form, setForm] = useState({ title:'', description:'', stage:'Todo', start_date:'', end_date:'', next_step:'', next_step_custom:'', folder_path:'', target_files:10, priority:0 })
  const [error, setError] = useState('')
  const [greeting, setGreeting] = useState('')
  const [toast, setToast] = useState({ show:false, msg:'' })
  const [dragTask, setDragTask] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const toastTimer = useRef(null)
  const pollTimer = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = CSS
    document.head.appendChild(style)
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning ☀️' : h < 17 ? 'Good afternoon 🌤️' : 'Good evening 🌙')
    return () => document.head.removeChild(style)
  }, [])

  const showToast = (msg) => {
    setToast({ show:true, msg })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show:false, msg:'' }), 2200)
  }

  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/tasks/`, { headers: getHeaders() })
      setTasks(res.data)
    } catch(e) {
      if (e?.response?.status === 401) navigate('/login')
    }
  }, [navigate])

  const fetchArchived = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/tasks/archive`, { headers: getHeaders() })
      setArchived(res.data)
    } catch {}
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])
  useEffect(() => { if (view === 'archive') fetchArchived() }, [view, fetchArchived])

  // Poll every 8 seconds for progress updates from VSCode extension
  useEffect(() => {
    pollTimer.current = setInterval(fetchTasks, 8000)
    return () => clearInterval(pollTimer.current)
  }, [fetchTasks])

  const progress = tasks.length > 0 ? Math.round((tasks.filter(t => t.stage === 'Done').length / tasks.length) * 100) : 0
  const done = tasks.filter(t => t.stage === 'Done').length

  // Priority auto-assignment based on position in column
  const getTasksWithPriority = (stageTasks) => stageTasks.map((t, i) => ({ ...t, _autoRank: i + 1 }))

  const handleDragStart = (e, task) => {
    setDragTask(task)
    const ghost = document.createElement('div')
    ghost.style.cssText = 'position:absolute;top:-1000px;left:-1000px;background:rgba(167,139,250,0.12);border:1px solid rgba(167,139,250,0.4);border-radius:14px;padding:14px;color:#f1f5f9;font-size:0.88rem;font-weight:600;min-width:200px;transform:rotate(3deg);font-family:Inter,sans-serif;'
    ghost.textContent = task.title
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 60, 30)
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => { document.body.removeChild(ghost); e.target.classList.add('dragging') }, 0)
  }

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging')
    setDragTask(null)
    setDragOverStage(null)
  }

  const handleDrop = async (e, newStage) => {
    e.preventDefault()
    setDragOverStage(null)
    if (!dragTask || dragTask.stage === newStage) return
    const updated = { ...dragTask, stage: newStage }
    setTasks(prev => prev.map(t => t.id === dragTask.id ? updated : t))
    showToast(`Moved to ${newStage} ${STAGE_CFG[newStage].icon}`)
    try { await axios.put(`${API}/tasks/${dragTask.id}`, updated, { headers: getHeaders() }) }
    catch { fetchTasks() }
    setDragTask(null)
  }

  const openModal = (task = null) => {
    if (task) {
      setEditTaskId(task.id)
      const isCustom = task.next_step && !NEXT_STEPS.slice(0,-1).includes(task.next_step)
      setForm({
        title: task.title, description: task.description || '',
        stage: task.stage, start_date: task.start_date || '',
        end_date: task.end_date || '',
        next_step: isCustom ? 'Other (custom)' : (task.next_step || ''),
        next_step_custom: isCustom ? task.next_step : '',
        folder_path: task.folder_path || '',
        target_files: task.target_files || 10,
        priority: task.priority || 0
      })
    } else {
      setEditTaskId(null)
      setForm({ title:'', description:'', stage:'Todo', start_date:'', end_date:'', next_step:'', next_step_custom:'', folder_path:'', target_files:10, priority:0 })
    }
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    setError('')
    const finalNextStep = form.next_step === 'Other (custom)' ? form.next_step_custom : form.next_step
    const payload = {
      title: form.title, description: form.description, stage: form.stage,
      start_date: form.start_date || null, end_date: form.end_date || null,
      next_step: finalNextStep || null,
      folder_path: form.folder_path || null,
      target_files: parseInt(form.target_files) || 10,
      priority: parseInt(form.priority) || 0
    }
    try {
      if (editTaskId) {
        await axios.put(`${API}/tasks/${editTaskId}`, payload, { headers: getHeaders() })
        setTasks(prev => prev.map(t => t.id === editTaskId ? { ...t, ...payload } : t))
        showToast('Task updated ✏️')
      } else {
        const res = await axios.post(`${API}/tasks/`, payload, { headers: getHeaders() })
        setTasks(prev => [...prev, res.data])
        showToast('Task created ✦')
      }
      setShowModal(false)
    } catch { setError('Something went wrong. Try again.') }
  }

  const archiveTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    showToast('Task archived 🗑️')
    try { await axios.delete(`${API}/tasks/${id}`, { headers: getHeaders() }) }
    catch { fetchTasks() }
  }

  const restoreTask = async (id) => {
    try {
      await axios.post(`${API}/tasks/archive/${id}/restore`, {}, { headers: getHeaders() })
      setArchived(prev => prev.filter(t => t.id !== id))
      fetchTasks()
      showToast('Task restored ✦')
    } catch {}
  }

  const permanentDelete = async (id) => {
    try {
      await axios.delete(`${API}/tasks/archive/${id}/delete`, { headers: getHeaders() })
      setArchived(prev => prev.filter(t => t.id !== id))
      showToast('Permanently deleted 🗑️')
    } catch {}
  }

  const inputStyle = { padding:'11px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.05)', color:'#f1f5f9', fontSize:'0.9rem', width:'100%', transition:'all 0.2s', fontFamily:'Inter, sans-serif' }
  const labelStyle = { fontSize:'0.7rem', color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6, display:'block' }

  return (
    <div style={{ minHeight:'100vh', background:'radial-gradient(ellipse at top left, #13102a 0%, #0a0a14 40%, #0d1117 100%)', color:'#fff', fontFamily:'Inter, sans-serif', position:'relative', overflowX:'hidden' }}>

      <div className="orb" style={{ width:180, height:180, background:'radial-gradient(circle,rgba(167,139,250,0.07),transparent)', top:'8%', left:'4%', animationDuration:'7s' }} />
      <div className="orb" style={{ width:240, height:240, background:'radial-gradient(circle,rgba(96,165,250,0.05),transparent)', top:'55%', left:'78%', animationDelay:'1.5s', animationDuration:'8s' }} />
      <div className="orb" style={{ width:140, height:140, background:'radial-gradient(circle,rgba(52,211,153,0.05),transparent)', top:'25%', left:'45%', animationDelay:'3s', animationDuration:'6s' }} />

      {/* Navbar */}
      <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)', backdropFilter:'blur(24px)', background:'rgba(10,10,20,0.75)', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <span style={{ fontSize:'1.3rem', background:'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>✦</span>
          <span style={{ fontSize:'1.25rem', fontWeight:800, background:'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-0.5px' }}>TaskFlow</span>
          <span style={{ fontSize:'0.75rem', color:'#475569', marginLeft:10, paddingLeft:10, borderLeft:'1px solid rgba(255,255,255,0.1)' }}>{greeting}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:'0.8rem', color:'#a78bfa', fontWeight:600 }}>{progress}% complete</span>
          <div style={{ width:150, height:6, background:'rgba(255,255,255,0.07)', borderRadius:10, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#a78bfa,#34d399)', borderRadius:10, width:`${progress}%`, transition:'width 0.7s cubic-bezier(0.34,1.56,0.64,1)' }} />
          </div>
          <span style={{ fontSize:'0.72rem', color:'#334155' }}>{done}/{tasks.length}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button className={`nav-btn${view==='board'?' active':''}`} style={{ padding:'7px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:'#94a3b8', cursor:'pointer', fontSize:'0.8rem', fontFamily:'Inter, sans-serif' }} onClick={() => setView('board')}>📋 Board</button>
          <button className={`nav-btn${view==='archive'?' active':''}`} style={{ padding:'7px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:'#94a3b8', cursor:'pointer', fontSize:'0.8rem', fontFamily:'Inter, sans-serif', position:'relative' }} onClick={() => setView('archive')}>
            🗑️ Archive
            {archived.length > 0 && <span style={{ position:'absolute', top:-4, right:-4, background:'#ef4444', color:'#fff', borderRadius:'50%', width:16, height:16, fontSize:'0.6rem', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{archived.length}</span>}
          </button>
          <button className="logout-btn" style={{ padding:'7px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:'#94a3b8', cursor:'pointer', fontSize:'0.8rem', fontFamily:'Inter, sans-serif', transition:'all 0.2s' }} onClick={() => { localStorage.removeItem('token'); navigate('/login') }}>Sign out</button>
        </div>
      </nav>

      {/* Board */}
      {view === 'board' && (
        <div style={{ display:'flex', gap:18, padding:'24px 28px', minHeight:'calc(100vh - 65px)', overflowX:'auto', position:'relative', zIndex:1 }}>
          {STAGES.map(stage => {
            const cfg = STAGE_CFG[stage]
            const stageTasks = getTasksWithPriority(tasks.filter(t => t.stage === stage).sort((a,b) => (b.priority||0)-(a.priority||0)))
            const isOver = dragOverStage === stage
            return (
              <div key={stage} className="column"
                style={{ background:cfg.gradient, borderColor:isOver?'rgba(167,139,250,0.6)':cfg.border, boxShadow:isOver?`0 0 40px ${cfg.glow}`:'none', transform:isOver?'scale(1.012)':'scale(1)' }}
                onDragOver={e => { e.preventDefault(); setDragOverStage(stage) }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={e => handleDrop(e, stage)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <span>{cfg.icon}</span>
                    <span style={{ fontWeight:700, fontSize:'0.92rem', color:'#e2e8f0' }}>{stage}</span>
                  </div>
                  <span style={{ borderRadius:20, padding:'3px 11px', fontSize:'0.72rem', fontWeight:700, background:cfg.countBg, color:cfg.countColor }}>{stageTasks.length}</span>
                </div>
                <div style={{ height:1, background:'rgba(255,255,255,0.06)' }} />
                <div style={{ display:'flex', flexDirection:'column', gap:9, minHeight:80, flex:1 }}>
                  {stageTasks.map((task, idx) => {
                    const pcfg = PRIORITY_CFG[Math.min(task.priority||0, 3)]
                    const hasFolder = !!task.folder_path
                    const prog = task.progress || 0
                    const progColor = prog >= 100 ? '#34d399' : prog >= 60 ? '#60a5fa' : prog >= 30 ? '#fbbf24' : '#a78bfa'
                    return (
                      <div key={task.id} className="task-card" draggable onDragStart={e => handleDragStart(e, task)} onDragEnd={handleDragEnd}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ color:'#1e293b', fontSize:'1rem' }}>⠿</span>
                            <span className="priority-num" style={{ background:pcfg.bg, color:pcfg.color }}>#{idx+1}</span>
                            <span className="priority-badge" style={{ background:pcfg.bg, color:pcfg.color }}>{pcfg.label}</span>
                          </div>
                          <span style={{ width:8, height:8, borderRadius:'50%', background:cfg.dot, boxShadow:`0 0 8px ${cfg.dot}`, display:'inline-block' }} />
                        </div>
                        <div style={{ fontSize:'0.88rem', fontWeight:600, color:'#f1f5f9', marginBottom:5 }}>{task.title}</div>
                        {task.description && <div style={{ fontSize:'0.75rem', color:'#475569', marginBottom:8, lineHeight:1.6 }}>{task.description}</div>}

                        {/* Dates */}
                        {(task.start_date || task.end_date) && (
                          <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
                            {task.start_date && <span style={{ fontSize:'0.62rem', color:'#64748b', background:'rgba(255,255,255,0.05)', padding:'2px 8px', borderRadius:20 }}>📅 {task.start_date}</span>}
                            {task.end_date && <span style={{ fontSize:'0.62rem', color:'#64748b', background:'rgba(255,255,255,0.05)', padding:'2px 8px', borderRadius:20 }}>🏁 {task.end_date}</span>}
                            <TimeChip endDate={task.end_date} />
                          </div>
                        )}

                        {/* Next step */}
                        {task.next_step && (
                          <div style={{ fontSize:'0.68rem', color:'#a78bfa', background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.2)', borderRadius:8, padding:'4px 10px', marginBottom:8 }}>
                            ➡️ {task.next_step}
                          </div>
                        )}

                        {/* Folder tracker */}
                        {hasFolder && (
                          <div style={{ marginBottom:8 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                              <span style={{ fontSize:'0.62rem', color:'#64748b' }}>📁 {task.folder_path.split(/[/\\]/).pop()}</span>
                              <span style={{ fontSize:'0.62rem', fontWeight:700, color:progColor }}>{prog}%</span>
                            </div>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width:`${prog}%`, background:`linear-gradient(90deg, #a78bfa, ${progColor})` }} />
                            </div>
                            <div style={{ fontSize:'0.6rem', color:'#334155', marginTop:3 }}>
                              {prog < 30 ? '🟡 Not started' : prog < 100 ? '🔵 In progress' : '🟢 Complete'}
                            </div>
                          </div>
                        )}

                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:'0.65rem', padding:'3px 9px', borderRadius:20, fontWeight:600, background:cfg.countBg, color:cfg.countColor }}>{cfg.icon} {task.stage}</span>
                          <div className="card-actions">
                            <button className="action-btn edit-btn" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); openModal(task) }}>✏️</button>
                            <button className="action-btn del-btn" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); archiveTask(task.id) }}>🗑️</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {stageTasks.length === 0 && <div className={`col-empty${isOver?' drag-over':''}`}>{isOver ? '✨\nDrop here!' : `${cfg.icon}\n${cfg.empty}`}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Archive */}
      {view === 'archive' && (
        <div style={{ padding:'24px 28px', position:'relative', zIndex:1 }}>
          <div style={{ marginBottom:24 }}>
            <h2 style={{ fontSize:'1.2rem', fontWeight:700, color:'#e2e8f0', marginBottom:6 }}>🗑️ Archive Bin</h2>
            <p style={{ fontSize:'0.8rem', color:'#475569' }}>Archived tasks are automatically deleted after 10 days.</p>
          </div>
          {archived.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:'#334155' }}>
              <div style={{ fontSize:'3rem', marginBottom:16 }}>🗑️</div>
              <div style={{ fontSize:'0.9rem' }}>Archive is empty</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:14 }}>
              {archived.map(task => {
                const daysLeft = task.archived_at ? Math.max(0, 10 - Math.ceil((Date.now() - new Date(task.archived_at)) / 86400000)) : 10
                return (
                  <div key={task.id} className="archive-card">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div style={{ fontSize:'0.88rem', fontWeight:600, color:'#94a3b8' }}>{task.title}</div>
                      <span style={{ fontSize:'0.65rem', color:daysLeft<=2?'#fca5a5':'#64748b', background:daysLeft<=2?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.05)', padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap', marginLeft:8 }}>{daysLeft}d left</span>
                    </div>
                    {task.description && <div style={{ fontSize:'0.75rem', color:'#475569', marginBottom:10 }}>{task.description}</div>}
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="restore-btn" style={{ flex:1, padding:'7px', borderRadius:9, border:'1px solid rgba(52,211,153,0.2)', background:'rgba(52,211,153,0.08)', color:'#34d399', cursor:'pointer', fontSize:'0.78rem', fontFamily:'Inter, sans-serif', transition:'all 0.2s' }} onClick={() => restoreTask(task.id)}>↩️ Restore</button>
                      <button className="perm-del-btn" style={{ flex:1, padding:'7px', borderRadius:9, border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.08)', color:'#fca5a5', cursor:'pointer', fontSize:'0.78rem', fontFamily:'Inter, sans-serif', transition:'all 0.2s' }} onClick={() => permanentDelete(task.id)}>🗑️ Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {view === 'board' && (
        <button className="fab" style={{ position:'fixed', bottom:28, right:28, width:54, height:54, borderRadius:'50%', border:'none', background:'linear-gradient(135deg,#a78bfa,#60a5fa)', color:'#fff', fontSize:'1.8rem', cursor:'pointer', zIndex:40, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 30px rgba(167,139,250,0.4)', transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', fontFamily:'Inter, sans-serif' }} onClick={() => openModal()}>+</button>
      )}

      {toast.show && <div className="toast">{toast.msg}</div>}

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, backdropFilter:'blur(8px)', animation:'fadeIn 0.2s ease' }} onClick={() => setShowModal(false)}>
          <div style={{ background:'linear-gradient(135deg,#13131f 0%,#1a1a2e 100%)', border:'1px solid rgba(167,139,250,0.2)', borderRadius:24, padding:28, width:'100%', maxWidth:520, boxShadow:'0 40px 100px rgba(0,0,0,0.7)', animation:'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)', maxHeight:'90vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
              <span style={{ fontSize:'1.1rem', fontWeight:700, background:'linear-gradient(135deg,#e2e8f0,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{editTaskId ? '✏️ Edit Task' : '✦ New Task'}</span>
              <button className="close-btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#64748b', cursor:'pointer', width:30, height:30, borderRadius:8, fontSize:'0.82rem', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif' }} onClick={() => setShowModal(false)}>✕</button>
            </div>

            {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:10, color:'#fca5a5', fontSize:'0.82rem', marginBottom:14 }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={labelStyle}>Task Title</label>
                <input className="form-input" style={inputStyle} placeholder="What needs to be done?" value={form.title} onChange={e => setForm({...form, title:e.target.value})} required />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea className="form-input" style={{...inputStyle, height:80, resize:'none'}} placeholder="Add more details..." value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={labelStyle}>Stage</label>
                  <select className="form-input" style={{...inputStyle, color:'#fff', cursor:'pointer'}} value={form.stage} onChange={e => setForm({...form, stage:e.target.value})}>
                    <option value="Todo" style={{background:'#1a1a2e'}}>📋 Todo</option>
                    <option value="In Progress" style={{background:'#1a1a2e'}}>⚡ In Progress</option>
                    <option value="Done" style={{background:'#1a1a2e'}}>✅ Done</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select className="form-input" style={{...inputStyle, color:'#fff', cursor:'pointer'}} value={form.priority} onChange={e => setForm({...form, priority:parseInt(e.target.value)})}>
                    <option value={0} style={{background:'#1a1a2e'}}>🟢 Low</option>
                    <option value={1} style={{background:'#1a1a2e'}}>🟡 Medium</option>
                    <option value={2} style={{background:'#1a1a2e'}}>🟠 High</option>
                    <option value={3} style={{background:'#1a1a2e'}}>🔴 Critical</option>
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={labelStyle}>📅 Start Date</label>
                  <input type="date" className="form-input" style={{...inputStyle, colorScheme:'dark'}} value={form.start_date} onChange={e => setForm({...form, start_date:e.target.value})} />
                </div>
                <div>
                  <label style={labelStyle}>🏁 End Date</label>
                  <input type="date" className="form-input" style={{...inputStyle, colorScheme:'dark'}} value={form.end_date} onChange={e => setForm({...form, end_date:e.target.value})} />
                </div>
              </div>
              {form.start_date && form.end_date && (
                <div style={{ fontSize:'0.75rem', color:'#64748b', background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'8px 12px' }}>
                  ⏱ {Math.ceil((new Date(form.end_date)-new Date(form.start_date))/86400000)} days duration · <TimeChip endDate={form.end_date} />
                </div>
              )}
              <div>
                <label style={labelStyle}>➡️ Next Step</label>
                <select className="form-input" style={{...inputStyle, color:'#fff', cursor:'pointer'}} value={form.next_step} onChange={e => setForm({...form, next_step:e.target.value})}>
                  <option value="" style={{background:'#1a1a2e'}}>— Select next step —</option>
                  {NEXT_STEPS.map(s => <option key={s} value={s} style={{background:'#1a1a2e'}}>{s}</option>)}
                </select>
              </div>
              {form.next_step === 'Other (custom)' && (
                <div>
                  <label style={labelStyle}>Custom Next Step</label>
                  <input className="form-input" style={inputStyle} placeholder="e.g. Pass to legal team" value={form.next_step_custom} onChange={e => setForm({...form, next_step_custom:e.target.value})} />
                </div>
              )}

              {/* VSCode Folder Tracker */}
              <div style={{ background:'rgba(167,139,250,0.06)', border:'1px solid rgba(167,139,250,0.15)', borderRadius:14, padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <span style={{ fontSize:'1rem' }}>📁</span>
                  <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#a78bfa', textTransform:'uppercase', letterSpacing:'0.05em' }}>VSCode Folder Tracker</span>
                  <span style={{ fontSize:'0.65rem', color:'#475569', background:'rgba(255,255,255,0.05)', padding:'2px 8px', borderRadius:20 }}>optional</span>
                </div>
                <div style={{ marginBottom:10 }}>
                  <label style={labelStyle}>Folder Path</label>
                  <input className="form-input" style={inputStyle} placeholder="e.g. C:\Users\You\my-project" value={form.folder_path} onChange={e => setForm({...form, folder_path:e.target.value})} />
                  <div style={{ fontSize:'0.68rem', color:'#334155', marginTop:6 }}>
                    💡 In VSCode: right-click folder → Copy Path. Then use <strong style={{color:'#a78bfa'}}>Ctrl+Shift+P → TaskFlow: Link folder to task</strong> with Task ID to auto-track.
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Target file count (= 100%)</label>
                  <input type="number" className="form-input" style={{...inputStyle, width:100}} min={1} max={100} value={form.target_files} onChange={e => setForm({...form, target_files:e.target.value})} />
                </div>
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
                <button type="button" className="cancel-btn" style={{ padding:'10px 20px', borderRadius:11, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'#64748b', cursor:'pointer', fontWeight:500, fontSize:'0.88rem', fontFamily:'Inter, sans-serif', transition:'all 0.2s' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn" style={{ padding:'10px 24px', borderRadius:11, border:'none', background:'linear-gradient(135deg,#a78bfa,#60a5fa)', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:'0.88rem', fontFamily:'Inter, sans-serif', boxShadow:'0 4px 20px rgba(167,139,250,0.3)', transition:'all 0.2s' }}>
                  {editTaskId ? 'Save Changes' : 'Create Task ✦'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ChatBot tasks={tasks} />
    </div>
  )
}
