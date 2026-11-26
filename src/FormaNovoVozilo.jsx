import { useState } from 'react'
import { supabase } from './supabaseClient'
import PretragaFirmi from './PretragaFirmi'

export default function FormaNovoVozilo({ onSacuvano, onOtkazi }) {
  const [tablica, setTablica] = useState('')
  const [firmaId, setFirmaId] = useState('')
  const [tipVozila, setTipVozila] = useState('')
  const [kategorija, setKategorija] = useState('mesecni')
  const [napomena, setNapomena] = useState('')
  const [greska, setGreska] = useState(null)
  const [cuvam, setCuvam] = useState(false)

  const handleSacuvaj = async (e) => {
    e.preventDefault()
    setGreska(null)

    if (!tablica.trim()) { setGreska('Tablica je obavezna.'); return }
    if (!tipVozila) { setGreska('Tip vozila je obavezan.'); return }

    setCuvam(true)

    const { error } = await supabase.from('vozila').insert({
      tablica: tablica.trim().toUpperCase(),
      firma_id: firmaId || null,
      tip_vozila: tipVozila,
      kategorija: kategorija,
      napomena: napomena.trim() || null,
      aktivan: true,
    })

    setCuvam(false)

    if (error) {
      setGreska(error.message)
      return
    }

    setTablica('')
    setFirmaId('')
    setTipVozila('')
    setKategorija('mesecni')
    setNapomena('')
    onSacuvano()
  }

  return (
    <form onSubmit={handleSacuvaj} style={{ marginTop: 20, padding: 20, border: '2px solid #16a34a', borderRadius: 8, backgroundColor: '#f0fdf4' }}>
      <h3>Novo vozilo u bazi</h3>
      {greska && <p style={{ color: 'red' }}>{greska}</p>}

      <div style={{ marginBottom: 10 }}>
        <label>Tablica *</label>
        <input type="text" value={tablica} onChange={(e) => setTablica(e.target.value)} placeholder="npr. BG123AB" style={{ width: '100%', padding: 8, marginTop: 4 }} required />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Firma</label>
        <PretragaFirmi vrednost={firmaId} onPromena={setFirmaId} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Tip vozila *</label>
        <select value={tipVozila} onChange={(e) => setTipVozila(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required>
          <option value="">— izaberi tip —</option>
          <option value="kamion">Kamion</option>
          <option value="kombi">Kombi</option>
          <option value="putnicko">Putničko vozilo</option>
          <option value="autobus">Autobus</option>
        </select>
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
        <label>Napomena</label>
        <input type="text" value={napomena} onChange={(e) => setNapomena(e.target.value)} placeholder="opciono" style={{ width: '100%', padding: 8, marginTop: 4 }} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={cuvam} style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          {cuvam ? 'Čuvam...' : 'Sačuvaj vozilo'}
        </button>
        <button type="button" onClick={onOtkazi} style={{ padding: '10px 20px' }}>Otkaži</button>
      </div>
    </form>
  )
}