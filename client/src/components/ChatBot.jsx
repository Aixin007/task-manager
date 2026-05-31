import { useState, useRef, useEffect } from 'react'

const SYSTEM_PROMPT = `You are TaskFlow Assistant — a warm, friendly, and knowledgeable AI helper built into the TaskFlow Kanban app.

You help users with:

1. APP FEATURES:
   - Kanban board: drag cards between Todo, In Progress, Done columns
   - Creating tasks: click the + button, fill title/description/stage/priority/dates/next step
   - Priority levels: Low, Medium, High, Critical
   - Archive bin: deleted tasks go here for 10 days, can be restored or permanently deleted
   - Progress tracking: link a VSCode folder to a task

2. VSCODE TRACKING SETUP:
   - Open vscode-extension folder, press F5 → VS Code Extension Development
   - In new window: open project folder, Ctrl+Shift+P → TaskFlow: Link folder to task
   - Enter task ID, target file count, JWT token (from localStorage.getItem('token'))
   - Save any file → progress updates on the card automatically

3. STRESS SUPPORT: Be warm, empathetic, calm. Offer breathing exercises, perspective, encouragement.

4. RUBBER DUCK DEBUGGING: Help them think through problems step by step.

5. SCREENSHOT ANALYSIS: If user shares a screenshot, analyze errors, UI issues, code problems.

Keep responses concise, warm, helpful. Use emojis naturally.`

const CSS = `
  .chatbot-container { position: fixed; bottom: 100px; right: 28px; z-index: 999; font-family: 'Inter', sans-serif; }
  .chatbot-bubble { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #a78bfa, #60a5fa); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; box-shadow: 0 4px 20px rgba(167,139,250,0.4); transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
  .chatbot-bubble:hover { transform: scale(1.15); box-shadow: 0 8px 30px rgba(167,139,250,0.6); }
  .chatbot-window { position: absolute; bottom: 60px; right: 0; width: 370px; height: 520px; background: linear-gradient(135deg, #13131f, #1a1a2e); border: 1px solid rgba(167,139,250,0.2); border-radius: 20px; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.6); overflow: hidden; animation: slideUpBot 0.3s cubic-bezier(0.34,1.56,0.64,1); }
  @keyframes slideUpBot { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes fadeInMsg { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  .chat-header { padding: 14px 16px; background: rgba(167,139,250,0.08); border-bottom: 1px solid rgba(167,139,250,0.15); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
  .chat-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
  .chat-messages::-webkit-scrollbar { width: 4px; }
  .chat-messages::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.2); border-radius: 10px; }
  .msg { max-width: 88%; padding: 10px 13px; border-radius: 14px; font-size: 0.81rem; line-height: 1.6; animation: fadeInMsg 0.2s ease; }
  .msg.user { background: linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.15)); border: 1px solid rgba(167,139,250,0.2); color: #e2e8f0; margin-left: auto; border-bottom-right-radius: 4px; }
  .msg.bot { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; border-bottom-left-radius: 4px; }
  .msg.typing { color: #64748b; font-style: italic; }
  .msg img { max-width: 100%; border-radius: 8px; margin-top: 6px; display: block; }
  .chat-input-area { padding: 10px 12px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
  .image-preview { position: relative; display: inline-block; }
  .image-preview img { height: 60px; width: auto; border-radius: 8px; border: 1px solid rgba(167,139,250,0.3); }
  .image-preview .remove-img { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: #ef4444; border: none; color: #fff; font-size: 0.6rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .input-row { display: flex; gap: 6px; align-items: flex-end; }
  .chat-input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 9px 12px; color: #f1f5f9; font-size: 0.81rem; outline: none; font-family: 'Inter', sans-serif; resize: none; line-height: 1.4; }
  .chat-input:focus { border-color: rgba(167,139,250,0.4); }
  .chat-input::placeholder { color: #334155; }
  .attach-btn { width: 34px; height: 34px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; transition: all 0.2s; flex-shrink: 0; }
  .attach-btn:hover { background: rgba(167,139,250,0.15); color: #a78bfa; border-color: rgba(167,139,250,0.3); }
  .send-btn { width: 34px; height: 34px; border-radius: 10px; border: none; background: linear-gradient(135deg, #a78bfa, #60a5fa); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; transition: all 0.2s; flex-shrink: 0; }
  .send-btn:hover { transform: scale(1.1); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .close-chat-btn { background: none; border: none; color: #64748b; cursor: pointer; font-size: 1rem; transition: color 0.2s; }
  .close-chat-btn:hover { color: #fca5a5; }
  .suggestion-chips { display: flex; flex-wrap: wrap; gap: 5px; padding: 0 14px 8px; flex-shrink: 0; }
  .chip { background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.2); border-radius: 20px; padding: 3px 10px; font-size: 0.7rem; color: #a78bfa; cursor: pointer; transition: all 0.2s; white-space: nowrap; font-family: 'Inter', sans-serif; }
  .chip:hover { background: rgba(167,139,250,0.2); }
`

const SUGGESTIONS = [
  '🗂️ How do I use the board?',
  '📁 VSCode tracking setup',
  '😮‍💨 I\'m feeling stressed',
  '🦆 Rubber duck debug',
  '⏰ Help me prioritize',
]

export default function ChatBot({ tasks }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hey! 👋 I\'m your TaskFlow assistant. I can help with any feature, set up VSCode tracking, manage stress, debug problems, or just chat. You can also share screenshots! What\'s up?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [pendingImage, setPendingImage] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = CSS
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const buildTaskContext = () => {
    if (!tasks || tasks.length === 0) return 'No tasks yet.'
    return tasks.map(t =>
      `- "${t.title}" [${t.stage}] priority:${['Low','Medium','High','Critical'][t.priority||0]} progress:${t.progress||0}%${t.end_date ? ` due:${t.end_date}` : ''}`
    ).join('\n')
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      setPendingImage({ base64, mediaType: file.type, previewUrl: reader.result })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText && !pendingImage) return
    if (loading) return

    const imgToSend = pendingImage
    setInput('')
    setPendingImage(null)
    setShowSuggestions(false)

    setMessages(prev => [...prev, {
      role: 'user',
      content: userText || '(screenshot)',
      imageUrl: imgToSend?.previewUrl || null
    }])
    setLoading(true)

    try {
      const taskContext = buildTaskContext()
      const fullPrompt = `${SYSTEM_PROMPT}\n\nCurrent user tasks:\n${taskContext}\n\nConversation history:\n${messages.map(m => `${m.role === 'bot' ? 'Assistant' : 'User'}: ${m.content}`).join('\n')}\n\nUser: ${userText || '(sent a screenshot)'}`

      const parts = []
      if (imgToSend) {
        parts.push({ inlineData: { mimeType: imgToSend.mediaType, data: imgToSend.base64 } })
      }
      parts.push({ text: fullPrompt })

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts }] })
        }
      )

      const data = await response.json()
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '⚠️ No response received.'
      setMessages(prev => [...prev, { role: 'bot', content: reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: '⚠️ Something went wrong. Check your Gemini API key in .env!' }])
    }
    setLoading(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="chatbot-container">
      {open && (
        <div className="chatbot-window">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>✦</div>
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#e2e8f0' }}>TaskFlow Assistant</div>
                <div style={{ fontSize: '0.65rem', color: '#34d399' }}>● Always here for you</div>
              </div>
            </div>
            <button className="close-chat-btn" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.role}`}>
                {msg.imageUrl && <img src={msg.imageUrl} alt="screenshot" />}
                {msg.content && msg.content.split('\n').map((line, j) => (
                  <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
                ))}
              </div>
            ))}
            {loading && <div className="msg bot typing">✦ Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>

          {showSuggestions && (
            <div className="suggestion-chips">
              {SUGGESTIONS.map(s => (
                <button key={s} className="chip" onClick={() => sendMessage(s)}>{s}</button>
              ))}
            </div>
          )}

          <div className="chat-input-area">
            {pendingImage && (
              <div className="image-preview">
                <img src={pendingImage.previewUrl} alt="pending" />
                <button className="remove-img" onClick={() => setPendingImage(null)}>✕</button>
              </div>
            )}
            <div className="input-row">
              <textarea
                ref={inputRef}
                className="chat-input"
                placeholder={pendingImage ? "Add a message..." : "Ask me anything... (Enter to send)"}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                style={{ maxHeight: 80 }}
              />
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
              <button className="attach-btn" onClick={() => fileInputRef.current?.click()} title="Attach screenshot">📎</button>
              <button className="send-btn" onClick={() => sendMessage()} disabled={loading || (!input.trim() && !pendingImage)}>➤</button>
            </div>
          </div>
        </div>
      )}

      <button className="chatbot-bubble" onClick={() => setOpen(!open)} title="TaskFlow Assistant">
        {open ? '✕' : '✦'}
      </button>
    </div>
  )
}