import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Pocetni from './Pocetni'

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleOdjava = async () => {
    await supabase.auth.signOut()
  }

  if (!session) {
    return <Auth />
  }

  return <Pocetni session={session} onOdjava={handleOdjava} />
}

export default App