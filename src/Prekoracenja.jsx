import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Prekoracenja({ onZatvori }) {
  const [mesec, setMesec] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [rezultati, setRezultati] = useState([])
  const [greska, setGreska] = useState(null)
  const [ucitavam, setUcitavam] = useState(false)
  const [provereno, setProvereno] = useState(false)

  const handleProveri = async () => {
    setGreska(null)
    setUcitavam(true)
    setProvereno(false)
    setRezultati([])

    try {
      // 1. Nađi sve firme sa broj_mesta (mesečni)
      const { data: firme, error: errFirme } = await supabase
        .from('firme')
        .select('id, naziv, broj_mesta')
        .not('broj_mesta', 'is', null)
        .eq('kategorija', 'mesecni')

      if (errFirme) throw errFirme

      if (!firme || firme.length === 0) {
        setGreska('Nema firmi sa definisanim brojem mesta.')
        setUcitavam(false)
        return
      }

      // 2. Za svaku firmu, prebroj jedinstvena vozila u mesecu
      const pocetakMeseca = `${mesec}-01T00:00:00`
      const [godina, mesecBroj] = mesec.split('-').map(Number)
      const krajMeseca = new Date(godina, mesecBroj, 1).toISOString()

      const noviRezultati = []

      for (const firma of firme) {
        const { data: vozila, error: errVozila } = await supabase
          .from('evidencija')
          .select('tablica, tip_vozila')
          .eq('firma_id', firma.id)
          .eq('tip_unosa', 'popis')
          .in('tip_vozila', ['kamion', 'kombi', 'autobus'])
          .gte('vreme', pocetakMeseca)
          .lt('vreme', krajMeseca)

        if (errVozila) throw errVozila

        // Jedinstvene tablice
        const jedinstvene = new Set((vozila || []).map(v => v.tablica))
        const brojVozila = jedinstvene.size

        if (brojVozila > firma.broj_mesta) {
          noviRezultati.push({
            firma_id: firma.id,
            naziv: firma.naziv,
            dozvoljeno: firma.broj_mesta,
            stvarno: brojVozila,
            prekoracenje: brojVozila - firma.broj_mesta,
          })
        }
      }

      setRezultati(noviRezultati)
      setProvereno(true)
    } catch (e) {
      setGreska(e.message)
    }

    setUcitavam(false)
  }

  const handleSacuvaj = async () => {
    if (rezultati.length === 0) return

    setUcitavam(true)
    try {
      for (const r of rezultati) {
        // Upsert — ako postoji, ažuriraj; ako ne, dodaj
        const { error } = await supabase
          .from('prekoracenja')
          .upsert({
            firma_id: r.firma_id,
            mesec: mesec,
            dozvoljeno_mesta: r.dozvoljeno,
            stvarno_vozila: r.stvarno,
            prekoracenje: r.prekoracenje,
          }, { onConflict: 'firma_id,mesec' })

        if (error) throw error
      }
      alert('Prekoračenja su sačuvana u bazu.')
    } catch (e) {
      setGreska(e.message)
    }
    setUcitavam(false)
  }

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Provera prekoračenja</h2>
        <button onClick={onZatvori} style={{ padding: '6px 12px' }}>Zatvori</button>
      </div>

      <p style={{ color: '#666', fontSize: 14 }}>
        Računaju se samo <strong>kamion, kombi i autobus</strong>. Putnička vozila se ne računaju u mesečna mesta.
      </p>

      <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <label><strong>Mesec:</strong></label>
        <input
          type="month"
          value={mesec}
          onChange={(e) => setMesec(e.target.value)}
          style={{ padding: 8 }}
        />
        <button
          onClick={handleProveri}
          disabled={ucitavam}
          style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          {ucitavam ? 'Proveravam...' : 'Proveri prekoračenja'}
        </button>
      </div>

      {greska && <p style={{ color: 'red' }}>{greska}</p>}

      {provereno && rezultati.length === 0 && (
        <p style={{ color: 'green' }}>✅ Nema prekoračenja za izabrani mesec.</p>
      )}

      {rezultati.length > 0 && (
        <>
          <h3>Prekoračenja ({rezultati.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#eee' }}>
                <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Firma</th>
                <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Dozvoljeno</th>
                <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Stvarno</th>
                <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Prekoračenje</th>
              </tr>
            </thead>
            <tbody>
              {rezultati.map((r) => (
                <tr key={r.firma_id}>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}><strong>{r.naziv}</strong></td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{r.dozvoljeno}</td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{r.stvarno}</td>
                  <td style={{ border: '1px solid #ccc', padding: 8, color: 'red' }}><strong>{r.prekoracenje}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleSacuvaj}
            disabled={ucitavam}
            style={{ marginTop: 20, padding: '10px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            💾 Sačuvaj u bazu
          </button>
        </>
      )}
    </div>
  )
}