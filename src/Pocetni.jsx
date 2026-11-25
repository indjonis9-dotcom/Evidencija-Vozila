import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import FormaVozila from './FormaVozila'
import Izvestaj from './Izvestaj'
import { nadjiKorisnika, kreirajSmenu, zavrsiSmenu } from './smenaHelper'

export default function Pocetni({ session, onOdjava }) {
  const [mod, setMod] = useState(null)
  const [prikaziFormu, setPrikaziFormu] = useState(false)
  const [popis, setPopis] = useState([])
  const [greska, setGreska] = useState(null)
  const [korisnik, setKorisnik] = useState(null)
  const [smena, setSmena] = useState(null)
  const [ucitavam, setUcitavam] = useState(false)
  const [prikaziIzvestaj, setPrikaziIzvestaj] = useState(false)

  useEffect(() => {
    async function ucitaj() {
      try {
        const k = await nadjiKorisnika(session.user.id)
        setKorisnik(k)
      } catch (e) {
        setGreska('Greška pri učitavanju korisnika: ' + e.message)
      }
    }
    ucitaj()
  }, [session])

  const ucitajPopis = async (smenaId) => {
    if (!smenaId) return
    const { data, error } = await supabase
      .from('evidencija')
      .select('*, firme(naziv)')
      .eq('tip_unosa', 'popis')
      .eq('smena_id', smenaId)
      .order('vreme', { ascending: false })

    if (error) setGreska(error.message)
    else setPopis(data || [])
  }

  const handlePreuzmiSmenu = async () => {
    setGreska(null)
    setUcitavam(true)
    try {
      if (!korisnik) throw new Error('Korisnik nije pronađen u tabeli korisnici.')
      const novaSmena = await kreirajSmenu(korisnik.id)
      setSmena(novaSmena)
      setMod('popis')
      await ucitajPopis(novaSmena.id)
    } catch (e) {
      setGreska(e.message)
    }
    setUcitavam(false)
  }

  const handleZavrsiSmenu = async () => {
    if (!smena) return
    if (!confirm('Da li želiš da završiš smenu?')) return
    try {
      await zavrsiSmenu(smena.id)
      setSmena({ ...smena, status: 'zavrsena', vreme_kraja: new Date().toISOString() })
      setPrikaziIzvestaj(true)
    } catch (e) {
      setGreska(e.message)
    }
  }

  const handleSacuvano = () => {
    setPrikaziFormu(false)
    ucitajPopis(smena?.id)
  }

  const handleZatvoriIzvestaj = () => {
    setPrikaziIzvestaj(false)
    setSmena(null)
    setMod(null)
    setPopis([])
  }

  if (!korisnik && !greska) return <p style={{ padding: 20 }}>Učitavam korisnika...</p>

  if (prikaziIzvestaj && smena) {
    return <Izvestaj smena={smena} popis={popis} korisnik={korisnik} onZatvori={handleZatvoriIzvestaj} />
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <strong>{korisnik?.ime || session.user.email}</strong>
          {korisnik?.uloga && <span style={{ color: '#666' }}> ({korisnik.uloga})</span>}
        </div>
        <button onClick={onOdjava} style={{ padding: '6px 12px' }}>Odjavi se</button>
      </div>

      <hr />
      {greska && <p style={{ color: 'red' }}>{greska}</p>}

      {mod === null && (
        <div style={{ marginTop: 30 }}>
          <h2>Izaberi mod rada</h2>
          <button onClick={handlePreuzmiSmenu} disabled={ucitavam} style={{ display: 'block', width: '100%', padding: 20, marginBottom: 15, fontSize: 18, backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            {ucitavam ? 'Kreiram smenu...' : '🔵 Preuzmi smenu (Popis)'}
          </button>
          <button disabled style={{ display: 'block', width: '100%', padding: 20, fontSize: 18, backgroundColor: '#ccc', color: '#666', border: 'none', borderRadius: 8, cursor: 'not-allowed' }}>
            🟢 Evidencija (Ulaz/Izlaz) — uskoro
          </button>
        </div>
      )}

      {mod === 'popis' && smena && (
        <div style={{ marginTop: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Popis vozila</h2>
            <button onClick={handleZavrsiSmenu} style={{ padding: '6px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: 6 }}>
              Završi smenu
            </button>
          </div>

          <p style={{ color: '#666', fontSize: 14 }}>
            Smena počela: {new Date(smena.vreme_pocetka).toLocaleString('sr-RS')}
          </p>

          {!prikaziFormu && (
            <button onClick={() => setPrikaziFormu(true)} style={{ display: 'block', width: '100%', padding: 15, fontSize: 16, backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', marginBottom: 20 }}>
              ➕ Dodaj vozilo
            </button>
          )}

          {prikaziFormu && (
            <FormaVozila smenaId={smena.id} portirId={korisnik?.id} onSacuvano={handleSacuvano} onOtkazi={() => setPrikaziFormu(false)} />
          )}

          <h3>Popisana vozila ({popis.length})</h3>
          {popis.length === 0 ? (
            <p style={{ color: '#666' }}>Još nema popisanih vozila.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {popis.map((v) => (
                <li key={v.id} style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                  <strong>{v.tablica}</strong> — {v.tip_vozila}
                  {v.firme?.naziv && <> — {v.firme.naziv}</>}
                  {v.napomena && <div style={{ fontSize: 12, color: '#666' }}>{v.napomena}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}