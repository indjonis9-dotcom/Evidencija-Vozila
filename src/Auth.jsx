import { useState } from 'react'
import { supabase } from './supabaseClient' // Prilagodićemo ovo u koraku 2

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false) // Za prebacivanje između prijave i registracije

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    let error
    if (isSignUp) {
      // Registracija novog korisnika
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })
      error = signUpError
      if (!error) alert('Proveri email za potvrdu registracije!')
    } else {
      // Prijava postojećeg korisnika
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      error = signInError
    }

    if (error) {
      alert(error.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: 'auto' }}>
      <h2>{isSignUp ? 'Registracija' : 'Prijava'}</h2>
      <form onSubmit={handleAuth}>
        <div style={{ marginBottom: 10 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <input
            type="password"
            placeholder="Šifra"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? 'Učitavam...' : (isSignUp ? 'Registruj se' : 'Prijavi se')}
        </button>
      </form>
      <p style={{ marginTop: 10, textAlign: 'center' }}>
        {isSignUp ? 'Već imaš nalog?' : 'Nemaš nalog?'}{' '}
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
        >
          {isSignUp ? 'Prijavi se' : 'Registruj se'}
        </button>
      </p>
    </div>
  )
}