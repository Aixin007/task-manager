import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:8000/api'

export default function Login() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await axios.post(`${API}/auth/login`, { email, password })
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    }
    setLoading(false)
  }

  const handleOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API}/auth/verify-otp`, { email, otp })
      localStorage.setItem('token', res.data.access_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP')
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>✦ TaskFlow</h1>
        <p style={styles.subtitle}>{step === 1 ? 'Welcome back' : 'Enter your OTP'}</p>
        {error && <div style={styles.error}>{error}</div>}
        {step === 1 ? (
          <form onSubmit={handleLogin} style={styles.form}>
            <input style={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input style={styles.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button style={styles.button} type="submit" disabled={loading}>{loading ? 'Loading...' : 'Continue'}</button>
          </form>
        ) : (
          <form onSubmit={handleOTP} style={styles.form}>
            <p style={styles.hint}>Check your terminal for the OTP code</p>
            <input style={styles.input} type="text" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} required />
            <button style={styles.button} type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</button>
          </form>
        )}
        <p style={styles.link}>Don't have an account? <Link to="/register">Register</Link></p>
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
  hint: { color: '#94a3b8', fontSize: '0.875rem' },
  link: { marginTop: '24px', color: '#94a3b8', textAlign: 'center' }
}