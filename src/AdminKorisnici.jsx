import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function AdminKorisnici() {
  const [korisnici, setKorisnici] = useState([])
  const [greska, setGreska] = useState(null)
  const [poruka, setPoruka] = useState(null)
  const [ucitavam, setUcitavam] = useState(true)
  const [forma, setForma] = useState({ email: '', ime: '', uloga: 'portir' })
  const [dodajem, setDodajem] = useState(false)

  useEffect(() => {
    ucitajKorisnike()
  }, [])

  const ucitajKorisnike = async () => {
    setUcitavam(true)
    const { data, error } = await supabase.from('korisnici').select('*').order('ime')
    if (error) setGreska(error.message)
    else setKorisnici(data || [])
    setUcitavam(false)
  }

  const handleDodaj = async (e) => {
    e.preventDefault()
    setGreska(null)
    setPoruka(null)
    setDodajem(true)

    try {
      // Napomena: Za kreiranje korisnika je potreban Supabase Auth admin API
      // Ovo je pojednostavljena verzija — dodaje samo u tabelu korisnici
      const { error } = await supabase.from('korisnici').insert({
        ime: forma.ime.trim(),
        uloga: forma.uloga,
        aktivan: true,
        // auth_id se popunjava kada se korisnik prvi put prijavi
      })

      if (error) throw error

      setPoruka(`✅ Korisnik "${forma.ime}" dodat. Portir treba da se registruje sa email-om: ${forma.email}`)
      setForma({ email: '', ime: '', uloga: 'portir' })
      ucitajKorisnike()
    } catch (e) {
      setGreska(e.message)
    }
    setDodajem(false)
  }

  const handleDeaktiviraj = async (k) => {
    if (!confirm(`Deaktivirati korisnika "${k.ime}"?`)) return
    const { error } = await supabase.from('korisnici').update({ aktivan: false }).eq('id', k.id)
    if (error) setGreska(error.message)
    else ucitajKorisnike()
  }

  const handleAktiviraj = async (k) => {
    const { error } = await supabase.from('korisnici').update({ aktivan: true }).eq('id', k.id)
    if (error) setGreska(error.message)
    else ucitajKorisnike()
  }

  if (ucitavam) return <p>Učitavam korisnike...</p>

  return (
    <div>
      <h3>Korisnici ({korisnici.length})</h3>
      {greska && <p style={{ color: 'red' }}>{greska}</p>}
      {poruka && <p style={{ color: 'green' }}>{poruka}</p>}

      <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#fff9e6', border: '1px solid #ffcc00', borderRadius: 8 }}>
        <strong>⚠️ Napomena:</strong> Za dodavanje novog portira, prvo ga dodajte ovde, a zatim u <strong>Supabase → Authentication → Users → Add user</strong> sa istim email-om. Kada se portir prvi put prijavi, automatski će se povezati sa ovim unosom.
      </div>

      <form onSubmit={handleDodaj} style={{ marginBottom: 20, padding: 15, border: '1px solid #ddd', borderRadius: 8 }}>
        <h4>Novi korisnik</h4>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input placeholder="Ime i prezime" value={forma.ime} onChange={(e) => setForma({ ...forma, ime: e.target.value })} required style={{ flex: 1, padding: 6 }} />
          <input type="email" placeholder="Email (za registraciju)" value={forma.email} onChange={(e) => setForma({ ...forma, email: e.target.value })} required style={{ flex: 1, padding: 6 }} />
          <select value={forma.uloga} onChange={(e) => setForma({ ...forma, uloga: e.target.value })} style={{ padding: 6 }}>
            <option value="portir">Portir</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" disabled={dodajem} style={{ padding: '6px 15px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 4 }}>
            {dodajem ? 'Dodajem...' : 'Dodaj'}
          </button>
        </div>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#eee' }}>
            <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Ime</th>
            <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Uloga</th>
            <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Status</th>
            <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Akcije</th>
          </tr>
        </thead>
        <tbody>
          {korisnici.map((k) => (
            <tr key={k.id}>
              <td style={{ border: '1px solid #ccc', padding: 6 }}>{k.ime}</td>
              <td style={{ border: '1px solid #ccc', padding: 6 }}>{k.uloga}</td>
              <td style={{ border: '1px solid #ccc', padding: 6 }}>{k.aktivan ? '✅ Aktivan' : '❌ Neaktivan'}</td>
              <td style={{ border: '1px solid #ccc', padding: 6 }}>
                {k.aktivan ? (
                  <button onClick={() => handleDeaktiviraj(k)} style={{ padding: '4px 8px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: 4 }}>Deaktiviraj</button>
                ) : (
                  <button onClick={() => handleAktiviraj(k)} style={{ padding: '4px 8px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 4 }}>Aktiviraj</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}