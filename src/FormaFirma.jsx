import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function FormaFirma({ onSacuvano, onOtkazi }) {
  const [naziv, setNaziv] = useState('')
  const [kategorija, setKategorija] = useState('mesecni')
  const [brojMesta, setBrojMesta] = useState('')
  const [greska, setGreska] = useState(null)
  const [cuvam, setCuvam] = useState(false)

  const handleSacuvaj = async (e) => {
    e.preventDefault()
    setGreska(null)

    if (!naziv.trim()) {
      setGreska('Naziv firme je obavezan.')
      return
    }

    setCuvam(true)

    const { error } = await supabase.from('firme').insert({
      naziv: naziv.trim(),
      kategorija: kategorija,
      broj_mesta: brojMesta ? parseInt(brojMesta) : null,
      aktivan: true,
    })

    setCuvam(false)

    if (error) {
      setGreska(error.message)
      return
    }

    setNaziv('')
    setKategorija('mesecni')
    setBrojMesta('')
    onSacuvano()
  }

  return (
    <form onSubmit={handleSacuvaj} style={{ marginTop: 20, padding: 20, border: '2px solid #2563eb', borderRadius: 8, backgroundColor: '#f0f7ff' }}>
      <h3>Nova firma</h3>
      {greska && <p style={{ color: 'red' }}>{greska}</p>}

      <div style={{ marginBottom: 10 }}>
        <label>Naziv firme *</label>
        <input
          type="text"
          value={naziv}
          onChange={(e) => setNaziv(e.target.value)}
          placeholder="npr. Transport DOO"
          style={{ width: '100%', padding: 8, marginTop: 4 }}
          required
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Kategorija</label>
        <select value={kategorija} onChange={(e) => setKategorija(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }}>
          <option value="mesecni">Mesečni</option>
          <option value="dnevni">Dnevni</option>
          <option value="gost">Gost</option>
          <option value="utovar_istovar">Utovar/Istovar</option>
        </select>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Broj mesečnih mesta (opciono)</label>
        <input
          type="number"
          value={brojMesta}
          onChange={(e) => setBrojMesta(e.target.value)}
          placeholder="npr. 5"
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={cuvam} style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          {cuvam ? 'Čuvam...' : 'Sačuvaj firmu'}
        </button>
        <button type="button" onClick={onOtkazi} style={{ padding: '10px 20px' }}>Otkaži</button>
      </div>
    </form>
  )
}