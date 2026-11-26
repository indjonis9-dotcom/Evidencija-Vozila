import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Prekoracenja({ onZatvori }) {
  const [mesec, setMesec] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [rezultati, setRezultati] = useState([])
  const [detalji, setDetalji] = useState([])
  const [greska, setGreska] = useState(null)
  const [ucitavam, setUcitavam] = useState(false)
  const [provereno, setProvereno] = useState(false)

  const handleProveri = async () => {
    setGreska(null)
    setUcitavam(true)
    setProvereno(false)
    setRezultati([])
    setDetalji([])

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

      // 2. Odredi granice meseca
      const [godina, mesecBroj] = mesec.split('-').map(Number)
      const pocetakMeseca = new Date(godina, mesecBroj - 1, 1).toISOString()
      const krajMeseca = new Date(godina, mesecBroj, 1).toISOString()

      const noviRezultati = []
      const noviDetalji = []

      for (const firma of firme) {
        // 3. Uzmi sve popise te firme u mesecu (samo kamion/kombi/autobus)
        const { data: zapisi, error: errZapisi } = await supabase
          .from('evidencija')
          .select('tablica, vreme, tip_vozila')
          .eq('firma_id', firma.id)
          .eq('tip_unosa', 'popis')
          .in('tip_vozila', ['kamion', 'kombi', 'autobus'])
          .gte('vreme', pocetakMeseca)
          .lt('vreme', krajMeseca)
          .order('vreme', { ascending: true })

        if (errZapisi) throw errZapisi

        if (!zapisi || zapisi.length === 0) continue

        // 4. Grupiši po datumu (YYYY-MM-DD)
        const poDanu = {}
        for (const z of zapisi) {
          const datum = new Date(z.vreme).toISOString().slice(0, 10)
          if (!poDanu[datum]) poDanu[datum] = new Set()
          poDanu[datum].add(z.tablica)
        }

        // 5. Za svaki dan — maksimum vozila u jednom popisu tog dana
        // (pošto su svi popisi tog dana u istom Set-u, uzimamo broj jedinstvenih)
        let ukupnoPrekoracenje = 0
        let maxStvarno = 0
        const detaljiFirme = []

        for (const [datum, tabliceSet] of Object.entries(poDanu)) {
          const brojVozila = tabliceSet.size
          if (brojVozila > maxStvarno) maxStvarno = brojVozila

          if (brojVozila > firma.broj_mesta) {
            const prekoracenje = brojVozila - firma.broj_mesta
            ukupnoPrekoracenje += prekoracenje
            detaljiFirme.push({
              datum,
              stvarno: brojVozila,
              prekoracenje,
            })
          }
        }

        if (ukupnoPrekoracenje > 0) {
          noviRezultati.push({
            firma_id: firma.id,
            naziv: firma.naziv,
            dozvoljeno: firma.broj_mesta,
            max_stvarno: maxStvarno,
            ukupno_prekoracenje: ukupnoPrekoracenje,
            broj_dana: detaljiFirme.length,
          })
          noviDetalji.push({
            naziv: firma.naziv,
            detalji: detaljiFirme.sort((a, b) => a.datum.localeCompare(b.datum)),
          })
        }
      }

      setRezultati(noviRezultati)
      setDetalji(noviDetalji)
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
        const { error } = await supabase
          .from('prekoracenja')
          .upsert({
            firma_id: r.firma_id,
            mesec: mesec,
            dozvoljeno_mesta: r.dozvoljeno,
            stvarno_vozila: r.max_stvarno,
            prekoracenje: r.ukupno_prekoracenje,
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
    <div style={{ padding: 20, maxWidth: 800, margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Provera prekoračenja</h2>
        <button onClick={onZatvori} style={{ padding: '6px 12px' }}>Zatvori</button>
      </div>

      <p style={{ color: '#666', fontSize: 14 }}>
        Računaju se samo <strong>kamion, kombi i autobus</strong>. Putnička vozila se ne računaju.
        Prekoračenje se računa <strong>po danu</strong> — maksimalan broj vozila u jednom popisu tog dana.
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
          <h3>Zbirna tabela prekoračenja</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#eee' }}>
                <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Firma</th>
                <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Dozvoljeno</th>
                <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Max u danu</th>
                <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Dana sa prekoračenjem</th>
                <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Ukupno prekoračenje</th>
              </tr>
            </thead>
            <tbody>
              {rezultati.map((r) => (
                <tr key={r.firma_id}>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}><strong>{r.naziv}</strong></td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{r.dozvoljeno}</td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{r.max_stvarno}</td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{r.broj_dana}</td>
                  <td style={{ border: '1px solid #ccc', padding: 8, color: 'red' }}><strong>{r.ukupno_prekoracenje}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginTop: 30 }}>Detalji po danima</h3>
          {detalji.map((d) => (
            <div key={d.naziv} style={{ marginBottom: 20, padding: 15, border: '1px solid #ddd', borderRadius: 8 }}>
              <h4 style={{ marginTop: 0 }}>{d.naziv}</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Datum</th>
                    <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Broj vozila</th>
                    <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Prekoračenje</th>
                  </tr>
                </thead>
                <tbody>
                  {d.detalji.map((det) => (
                    <tr key={det.datum}>
                      <td style={{ border: '1px solid #ccc', padding: 6 }}>{det.datum}</td>
                      <td style={{ border: '1px solid #ccc', padding: 6 }}>{det.stvarno}</td>
                      <td style={{ border: '1px solid #ccc', padding: 6, color: 'red' }}>{det.prekoracenje}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

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