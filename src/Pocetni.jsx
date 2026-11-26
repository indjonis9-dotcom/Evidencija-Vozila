import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import FormaVozila from './FormaVozila'
import FormaFirma from './FormaFirma'
import FormaNovoVozilo from './FormaNovoVozilo'
import FormaUlazIzlaz from './FormaUlazIzlaz'
import Izvestaj from './Izvestaj'
import Prekoracenja from './Prekoracenja'
import { nadjiKorisnika, kreirajSmenu, zavrsiSmenu } from './smenaHelper'

export default function Pocetni({ session, onOdjava }) {
  const [mod, setMod] = useState(null)
  const [podmod, setPodmod] = useState(null) // 'ulaz' ili 'izlaz'
  const [prikaziFormu, setPrikaziFormu] = useState(false)
  const [prikaziFormuFirme, setPrikaziFormuFirme] = useState(false)
  const [prikaziFormuVozila, setPrikaziFormuVozila] = useState(false)
  const [prikaziPrekoracenja, setPrikaziPrekoracenja] = useState(false)
  const [popis, setPopis] = useState([])
  const [ulaziIzlazi, setUlaziIzlazi] = useState([])
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

  const ucitajPodatke = async (smenaId) => {
    if (!smenaId) return

    // Popis
    const { data: popisData, error: errPopis } = await supabase
      .from('evidencija')
      .select('*, firme(naziv)')
      .eq('tip_unosa', 'popis')
      .eq('smena_id', smenaId)
      .order('vreme', { ascending: false })

    if (errPopis) setGreska(errPopis.message)
    else setPopis(popisData || [])

    // Ulazi i izlazi
    const { data: uiData, error: errUI } = await supabase
      .from('evidencija')
      .select('*, firme(naziv)')
      .in('tip_unosa', ['ulaz', 'izlaz'])
      .eq('smena_id', smenaId)
      .order('vreme', { ascending: false })

    if (errUI) setGreska(errUI.message)
    else setUlaziIzlazi(uiData || [])
  }

  const handlePreuzmiSmenu = async () => {
    setGreska(null)
    setUcitavam(true)
    try {
      if (!korisnik) throw new Error('Korisnik nije pronađen u tabeli korisnici.')
      const novaSmena = await kreirajSmenu(korisnik.id)
      setSmena(novaSmena)
      await ucitajPodatke(novaSmena.id)
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
    ucitajPodatke(smena?.id)
  }

  const handleZatvoriIzvestaj = () => {
    setPrikaziIzvestaj(false)
    setSmena(null)
    setMod(null)
    setPodmod(null)
    setPopis([])
    setUlaziIzlazi([])
  }

  if (!korisnik && !greska) return <p style={{ padding: 20 }}>Učitavam korisnika...</p>

  if (prikaziIzvestaj && smena) {
    return <Izvestaj smena={smena} popis={popis} ulaziIzlazi={ulaziIzlazi} korisnik={korisnik} onZatvori={handleZatvoriIzvestaj} />
  }

  if (prikaziPrekoracenja) {
    return <Prekoracenja onZatvori={() => setPrikaziPrekoracenja(false)} />
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

      {/* Ako nema smene — izbor moda */}
      {!smena && (
        <div style={{ marginTop: 30 }}>
          <h2>Izaberi mod rada</h2>
          <button onClick={handlePreuzmiSmenu} disabled={ucitavam} style={{ display: 'block', width: '100%', padding: 20, marginBottom: 15, fontSize: 18, backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            {ucitavam ? 'Kreiram smenu...' : '🔵 Preuzmi smenu (Popis + Evidencija)'}
          </button>

          <hr style={{ margin: '30px 0' }} />
          <h3>Baza podataka</h3>
          <p style={{ fontSize: 14, color: '#666' }}>Dodaj novu firmu ili vozilo u bazu (opciono):</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setPrikaziFormuFirme(!prikaziFormuFirme)} style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              ➕ Dodaj firmu
            </button>
            <button onClick={() => setPrikaziFormuVozila(!prikaziFormuVozila)} style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              ➕ Dodaj vozilo
            </button>
            <button onClick={() => setPrikaziPrekoracenja(true)} style={{ padding: '10px 20px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              📊 Proveri prekoračenja
            </button>
          </div>

          {prikaziFormuFirme && (
            <FormaFirma onSacuvano={() => setPrikaziFormuFirme(false)} onOtkazi={() => setPrikaziFormuFirme(false)} />
          )}
          {prikaziFormuVozila && (
            <FormaNovoVozilo onSacuvano={() => setPrikaziFormuVozila(false)} onOtkazi={() => setPrikaziFormuVozila(false)} />
          )}
        </div>
      )}

      {/* Ako ima smene — prikaz modova i formi */}
      {smena && (
        <div style={{ marginTop: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2>Smena u toku</h2>
            <button onClick={handleZavrsiSmenu} style={{ padding: '6px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: 6 }}>
              Završi smenu
            </button>
          </div>

          <p style={{ color: '#666', fontSize: 14 }}>
            Smena počela: {new Date(smena.vreme_pocetka).toLocaleString('sr-RS')}
          </p>

          {/* Izbor moda */}
          {!mod && (
            <div style={{ marginBottom: 20 }}>
              <h3>Izaberi šta radiš:</h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setMod('popis')} style={{ padding: '15px 25px', fontSize: 16, backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  📋 Popis (zatečeno stanje)
                </button>
                <button onClick={() => setMod('evidencija')} style={{ padding: '15px 25px', fontSize: 16, backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  🔄 Evidencija (Ulaz/Izlaz)
                </button>
              </div>
            </div>
          )}

          {/* MOD: POPIS */}
          {mod === 'popis' && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>📋 Popis vozila</h3>
                <button onClick={() => { setMod(null); setPrikaziFormu(false) }} style={{ padding: '4px 10px' }}>← Nazad</button>
              </div>

              {!prikaziFormu && (
                <button onClick={() => setPrikaziFormu(true)} style={{ display: 'block', width: '100%', padding: 15, fontSize: 16, backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', marginBottom: 20 }}>
                  ➕ Dodaj vozilo u popis
                </button>
              )}

              {prikaziFormu && (
                <FormaVozila smenaId={smena.id} portirId={korisnik?.id} onSacuvano={handleSacuvano} onOtkazi={() => setPrikaziFormu(false)} />
              )}

              <h4>Popisana vozila ({popis.length})</h4>
              {popis.length === 0 ? (
                <p style={{ color: '#666' }}>Još nema popisanih vozila.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {popis.map((v) => (
                    <li key={v.id} style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                      <strong>{v.tablica}</strong> — {v.tip_vozila}
                      {v.firme?.naziv && <> — {v.firme.naziv}</>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* MOD: EVIDENCIJA */}
          {mod === 'evidencija' && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>🔄 Evidencija ulaza/izlaza</h3>
                <button onClick={() => { setMod(null); setPodmod(null); setPrikaziFormu(false) }} style={{ padding: '4px 10px' }}>← Nazad</button>
              </div>

              {!podmod && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <button onClick={() => { setPodmod('ulaz'); setPrikaziFormu(true) }} style={{ flex: 1, padding: 20, fontSize: 18, backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                    ⬅️ ULAZ
                  </button>
                  <button onClick={() => { setPodmod('izlaz'); setPrikaziFormu(true) }} style={{ flex: 1, padding: 20, fontSize: 18, backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                    ➡️ IZLAZ
                  </button>
                </div>
              )}

              {podmod && prikaziFormu && (
                <FormaUlazIzlaz
                  smenaId={smena.id}
                  portirId={korisnik?.id}
                  tipUnosa={podmod}
                  onSacuvano={handleSacuvano}
                  onOtkazi={() => { setPodmod(null); setPrikaziFormu(false) }}
                />
              )}

              <h4>Ulazi i izlazi ({ulaziIzlazi.length})</h4>
              {ulaziIzlazi.length === 0 ? (
                <p style={{ color: '#666' }}>Još nema ulaza/izlaza.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {ulaziIzlazi.map((v) => (
                    <li key={v.id} style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                      <span style={{ color: v.tip_unosa === 'ulaz' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                        {v.tip_unosa === 'ulaz' ? '⬅️ ULAZ' : '➡️ IZLAZ'}
                      </span>
                      {' '}— <strong>{v.tablica}</strong> — {v.tip_vozila}
                      {v.firme?.naziv && <> — {v.firme.naziv}</>}
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {new Date(v.vreme).toLocaleString('sr-RS')}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}