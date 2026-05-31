import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:8000/api'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await axios.post(`${API}/auth/register`, { email, password, phone })
      setSuccess('Registered! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>✦ TaskFlow</h1>
        <p style={styles.subtitle}>Create your account</p>
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}
        <form onSubmit={handleRegister} style={styles.form}>
          <input style={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <input style={styles.input} type="tel" placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} />
          <button style={styles.button} type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Register'}</button>
        </form>
        <p style={styles.link}>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0f1a, #1a1a2e)' },
  card: { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '48px', width: '100%', maxWidth: '400px', color: '#fff' },
  title: { fontSize: '2rem', fontWeight: '700', marginBottom: '8px', background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { color: '#94a3b8', marginBottom: '32px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  input: { padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '1rem', outline: 'none' },
  button: { padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', color: '#fff', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  error: { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px', color: '#fca5a5', marginBottom: '16px' },
  success: { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '12px', color: '#86efac', marginBottom: '16px' },
  link: { marginTop: '24px', color: '#94a3b8', textAlign: 'center' }
}