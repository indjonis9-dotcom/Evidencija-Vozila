import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import PretragaFirmi from './PretragaFirmi'

export default function AdminVozila() {
  const [vozila, setVozila] = useState([])
  const [greska, setGreska] = useState(null)
  const [ucitavam, setUcitavam] = useState(true)
  const [izmena, setIzmena] = useState(null)
  const [forma, setForma] = useState({ tablica: '', firma_id: '', tip_vozila: 'kamion', kategorija: 'mesecni', napomena: '' })
  const [pretraga, setPretraga] = useState('')

  useEffect(() => {
    ucitajVozila()
  }, [])

  const ucitajVozila = async () => {
    setUcitavam(true)
    const { data, error } = await supabase.from('vozila').select('*, firme(naziv)').order('tablica')
    if (error) setGreska(error.message)
    else setVozila(data || [])
    setUcitavam(false)
  }

  const handleIzmeni = (v) => {
    setIzmena(v)
    setForma({
      tablica: v.tablica,
      firma_id: v.firma_id || '',
      tip_vozila: v.tip_vozila,
      kategorija: v.kategorija,
      napomena: v.napomena || '',
    })
  }

  const handleSacuvaj = async (e) => {
    e.preventDefault()
    setGreska(null)

    const podaci = {
      tablica: forma.tablica.trim().toUpperCase(),
      firma_id: forma.firma_id || null,
      tip_vozila: forma.tip_vozila,
      kategorija: forma.kategorija,
      napomena: forma.napomena.trim() || null,
    }

    let error
    if (izmena) {
      const res = await supabase.from('vozila').update(podaci).eq('id', izmena.id)
      error = res.error
    } else {
      const res = await supabase.from('vozila').insert({ ...podaci, aktivan: true })
      error = res.error
    }

    if (error) {
      setGreska(error.message)
      return
    }

    setIzmena(null)
    setForma({ tablica: '', firma_id: '', tip_vozila: 'kamion', kategorija: 'mesecni', napomena: '' })
    ucitajVozila()
  }

  const handleObrisi = async (v) => {
    if (!confirm(`Obrisati vozilo "${v.tablica}"?`)) return
    const { error } = await supabase.from('vozila').delete().eq('id', v.id)
    if (error) setGreska(error.message)
    else ucitajVozila()
  }

  if (ucitavam) return <p>Učitavam vozila...</p>

  const filtrirana = pretraga.trim()
    ? vozila.filter(v => v.tablica.toLowerCase().includes(pretraga.toLowerCase()))
    : vozila

  return (
    <div>
      <h3>Vozila ({vozila.length})</h3>
      {greska && <p style={{ color: 'red' }}>{greska}</p>}

      {/* Forma */}
      <form onSubmit={handleSacuvaj} style={{ marginBottom: 20, padding: 15, border: '1px solid #ddd', borderRadius: 8 }}>
        <h4>{izmena ? `Izmena: ${izmena.tablica}` : 'Novo vozilo'}</h4>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <input placeholder="Tablica" value={forma.tablica} onChange={(e) => setForma({ ...forma, tablica: e.target.value })} required style={{ width: 150, padding: 6 }} />
          <select value={forma.tip_vozila} onChange={(e) => setForma({ ...forma, tip_vozila: e.target.value })} style={{ padding: 6 }}>
            <option value="kamion">Kamion</option>
            <option value="kombi">Kombi</option>
            <option value="putnicko">Putničko</option>
            <option value="autobus">Autobus</option>
          </select>
          <select value={forma.kategorija} onChange={(e) => setForma({ ...forma, kategorija: e.target.value })} style={{ padding: 6 }}>
            <option value="mesecni">Mesečni</option>
            <option value="dnevni">Dnevni</option>
            <option value="gost">Gost</option>
            <option value="utovar_istovar">Utovar/Istovar</option>
          </select>
          <input placeholder="Napomena" value={forma.napomena} onChange={(e) => setForma({ ...forma, napomena: e.target.value })} style={{ flex: 1, padding: 6 }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ marginRight: 10 }}>Firma:</label>
          <PretragaFirmi vrednost={forma.firma_id} onPromena={(id) => setForma({ ...forma, firma_id: id })} />
        </div>
        <button type="submit" style={{ padding: '6px 15px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 4 }}>
          {izmena ? 'Sačuvaj izmenu' : 'Dodaj'}
        </button>
        {izmena && <button type="button" onClick={() => { setIzmena(null); setForma({ tablica: '', firma_id: '', tip_vozila: 'kamion', kategorija: 'mesecni', napomena: '' }) }} style={{ marginLeft: 10, padding: '6px 15px' }}>Otkaži</button>}
      </form>

      {/* Pretraga */}
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Pretraži po tablici..."
          value={pretraga}
          onChange={(e) => setPretraga(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
      </div>

      {/* Tabela */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#eee' }}>
            <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Tablica</th>
            <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Tip</th>
            <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Firma</th>
            <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Kategorija</th>
            <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Akcije</th>
          </tr>
        </thead>
        <tbody>
          {filtrirana.map((v) => (
            <tr key={v.id}>
              <td style={{ border: '1px solid #ccc', padding: 6 }}><strong>{v.tablica}</strong></td>
              <td style={{ border: '1px solid #ccc', padding: 6 }}>{v.tip_vozila}</td>
              <td style={{ border: '1px solid #ccc', padding: 6 }}>{v.firme?.naziv || '-'}</td>
              <td style={{ border: '1px solid #ccc', padding: 6 }}>{v.kategorija}</td>
              <td style={{ border: '1px solid #ccc', padding: 6 }}>
                <button onClick={() => handleIzmeni(v)} style={{ marginRight: 5, padding: '4px 8px' }}>Izmeni</button>
                <button onClick={() => handleObrisi(v)} style={{ padding: '4px 8px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: 4 }}>Obriši</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}