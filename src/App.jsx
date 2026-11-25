import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Proveri trenutnu sesiju
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Slušaj promene (prijava/odjava)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return <Auth />
  }

  // Ovde je tvoj postojeći sadržaj (lista firmi)
  return (
    <div style={{ padding: 20 }}>
      <p>Ulogovan kao: {session.user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>Odjavi se</button>
      <h1>Lista firmi</h1>
      {/* Ovde će ići tvoja lista firmi, možeš je ostaviti ili je privremeno ukloniti */}
    </div>
  )
}

export default App