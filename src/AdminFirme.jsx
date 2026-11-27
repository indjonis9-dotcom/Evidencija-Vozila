import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function AdminFirme() {
  const [firme, setFirme] = useState([])
  const [greska, setGreska] = useState(null)
  const [ucitavam, setUcitavam] = useState(true)
  const [izmena, setIzmena] = useState(null) // firma koja se menja
  const [forma, setForma] = useState({ naziv: '', kategorija: 'mesecni', broj_mesta: '', napomena: '' })

  useEffect(() => {
    ucitajFirme()
  }, [])

  const ucitajFirme = async () => {
    setUcitavam(true)
    const { data, error } = await supabase.from('firme').select('*').order('naziv')
    if (error) setGreska(error.message)
    else setFirme(data || [])
    setUcitavam(false)
  }

  const handleIzmeni = (f) => {
    setIzmena(f)
    setForma({
      naziv: f.naziv,
      kategorija: f.kategorija,
      broj_mesta: f.broj_mesta || '',
      napomena: f.napomena || '',
    })
  }

  const handleSacuvaj = async (e) => {
    e.preventDefault()
    setGreska(null)

    const podaci = {
      naziv: forma.naziv.trim(),
      kategorija: forma.kategorija,
      broj_mesta: forma.broj_mesta ? parseInt(forma.broj_mesta) : null,
      napomena: forma.napomena.trim() || null,
    }

    let error
    if (izmena) {
      const res = await supabase.from('firme').update(podaci).eq('id', izmena.id)
      error = res.error
    } else {
      const res = await supabase.from('firme').insert({ ...podaci, aktivan: true })
      error = res.error
    }

    if (error) {
      setGreska(error.message)
      return
    }

    setIzmena(null)
    setForma({ naziv: '', kategorija: 'mesecni', broj_mesta: '', napomena: '' })
    ucitajFirme()
  }

  const handleObrisi = async (f) => {
    if (!confirm(`Obrisati firmu "${f.naziv}"?`)) return
    const { error } = await supabase.from('firme').delete().eq('id', f.id)
    if (error) setGreska(error.message)
    else ucitajFirme()
  }

  if (ucitavam) return <p>Učitavam firme...</p>

  return (
    <div>
      <h3>Firme ({firme.length})</h3>
      {greska && <p style={{ color: 'red' }}>{greska}</p>}

      {/* Forma za dodavanje/izmenu */}
      <form onSubmit={handleSacuvaj} style={{ marginBottom: 20, padding: 15, border: '1px solid #ddd', borderRadius: 8 }}>
        <h4>{izmena ? `Izmena: ${izmena.naziv}` : 'Nova firma'}</h4>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input placeholder="Naziv" value={forma.naziv} onChange={(e) => setForma({ ...forma, naziv: e.target.value })} required style={{ flex: 2, padding: 6 }} />
          <select value={forma.kategorija} onChange={(e) => setForma({ ...forma, kategorija: e.target.value })} style={{ padding: 6 }}>
            <option value="mesecni">Mesečni</option>
            <option value="dnevni">Dnevni</option>
            <option value="gost">Gost</option>
            <option value="utovar_istovar">Utovar/Istovar</option>
          </select>
          <input type="number" placeholder="Broj mesta" value={forma.broj_mesta} onChange={(e) => setForma({ ...forma, broj_mesta: e.target.value })} style={{ width: 120, padding: 6 }} />
          <input placeholder="Napomena" value={forma.napomena} onChange={(e) => setForma({ ...forma, napomena: e.target.value })} style={{ flex: 1, padding: 6 }} />
          <button type="submit" style={{ padding: '6px 15px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 4 }}>
            {izmena ? 'Sačuvaj izmenu' : 'Dodaj'}
          </button>
          {izmena && <button type="button" onClick={() => { setIzmena(null); setForma({ naziv: '', kategorija: 'mesecni', broj_mesta: '', napomena: '' }) }} style={{ padding: '6px 15px' }}>Otkaži</button>}
        </div>
      </form>

      {/* Tabela */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#eee' }}>
            <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Naziv</th>
            <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Kategorija</th>
            <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Mesta</th>
            <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Akcije</th>
          </tr>
        </thead>
        <tbody>
          {firme.map((f) => (
            <tr key={f.id}>
              <td style={{ border: '1px solid #ccc', padding: 6 }}>{f.naziv}</td>
              <td style={{ border: '1px solid #ccc', padding: 6 }}>{f.kategorija}</td>
              <td style={{ border: '1px solid #ccc', padding: 6 }}>{f.broj_mesta || '-'}</td>
              <td style={{ border: '1px solid #ccc', padding: 6 }}>
                <button onClick={() => handleIzmeni(f)} style={{ marginRight: 5, padding: '4px 8px' }}>Izmeni</button>
                <button onClick={() => handleObrisi(f)} style={{ padding: '4px 8px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: 4 }}>Obriši</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}