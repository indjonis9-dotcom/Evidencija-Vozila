import { useState } from 'react'
import emailjs from '@emailjs/browser'

export default function Izvestaj({ smena, popis, ulaziIzlazi, korisnik, onZatvori }) {
  const [email, setEmail] = useState('')
  const [saljem, setSaljem] = useState(false)
  const [poruka, setPoruka] = useState(null)

  // Razdvoji ulaze i izlaze
  const ulazi = (ulaziIzlazi || []).filter(u => u.tip_unosa === 'ulaz')
  const izlazi = (ulaziIzlazi || []).filter(u => u.tip_unosa === 'izlaz')

  const handleStampa = () => {
    window.print()
  }

  const handlePosaljiEmail = async () => {
    if (!email.trim()) {
      setPoruka('❌ Unesi email adresu.')
      return
    }

    if ((!popis || popis.length === 0) && ulazi.length === 0 && izlazi.length === 0) {
      setPoruka('❌ Nema podataka u izveštaju.')
      return
    }

    setSaljem(true)
    setPoruka(null)

    try {
      // Tekst popisa
      const tekstPopis = (popis || []).map((v, i) =>
        `${i + 1}. ${v.tablica} | ${v.tip_vozila} | ${v.firme?.naziv || '-'} | ${v.kategorija}${v.napomena ? ' | ' + v.napomena : ''}`
      ).join('\n')

      // Tekst ulaza
      const tekstUlazi = ulazi.map((v, i) =>
        `${i + 1}. ${v.tablica} | ${v.tip_vozila} | ${v.firme?.naziv || '-'} | ${new Date(v.vreme).toLocaleTimeString('sr-RS')}`
      ).join('\n')

      // Tekst izlaza
      const tekstIzlazi = izlazi.map((v, i) =>
        `${i + 1}. ${v.tablica} | ${v.tip_vozila} | ${v.firme?.naziv || '-'} | ${new Date(v.vreme).toLocaleTimeString('sr-RS')}`
      ).join('\n')

      const parametri = {
        to_email: email.trim(),
        datum: new Date(smena.vreme_pocetka).toLocaleDateString('sr-RS'),
        portir: korisnik?.ime || 'Nepoznat',
        broj_vozila: popis?.length || 0,
        lista: tekstPopis || '(nema popisanih vozila)',
        broj_ulaza: ulazi.length,
        ulazi: tekstUlazi || '(nema ulaza)',
        broj_izlaza: izlazi.length,
        izlazi: tekstIzlazi || '(nema izlaza)',
      }

      console.log('EmailJS parametri:', parametri)

      const rezultat = await emailjs.send(
        'service_dwa4e2l',
        'template_ylx64zh',
        parametri,
        'g65RsfyWa79puX1Ea'
      )

      if (rezultat.status === 200) {
        setPoruka('✅ Email je poslat!')
        setEmail('')
      } else {
        setPoruka('⚠️ Nešto nije u redu: ' + JSON.stringify(rezultat))
      }
    } catch (e) {
      console.error('EmailJS greška:', e)
      setPoruka('❌ Greška: ' + (e.text || e.message || JSON.stringify(e)))
    }

    setSaljem(false)
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: 'auto' }}>
      <div id="izvestaj-za-stampu">
        <h2>Izveštaj smene</h2>
        <p>
          <strong>Datum:</strong> {new Date(smena.vreme_pocetka).toLocaleDateString('sr-RS')}<br />
          <strong>Portir:</strong> {korisnik?.ime || '-'}<br />
          <strong>Početak smene:</strong> {new Date(smena.vreme_pocetka).toLocaleString('sr-RS')}<br />
          <strong>Kraj smene:</strong> {smena.vreme_kraja ? new Date(smena.vreme_kraja).toLocaleString('sr-RS') : '-'}
        </p>

        {/* POPIS */}
        <h3>📋 Popis ({popis?.length || 0})</h3>
        {(popis || []).length === 0 ? (
          <p>Nema popisanih vozila.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr style={{ backgroundColor: '#eee' }}>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>#</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Tablica</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Tip</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Firma</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Kategorija</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Napomena</th>
              </tr>
            </thead>
            <tbody>
              {(popis || []).map((v, i) => (
                <tr key={v.id}>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{i + 1}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}><strong>{v.tablica}</strong></td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{v.tip_vozila}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{v.firme?.naziv || '-'}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{v.kategorija}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{v.napomena || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ULAZI */}
        <h3>⬅️ Ulazi ({ulazi.length})</h3>
        {ulazi.length === 0 ? (
          <p>Nema ulaza u ovoj smeni.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr style={{ backgroundColor: '#e8f5e9' }}>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>#</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Tablica</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Tip</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Firma</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Vreme</th>
              </tr>
            </thead>
            <tbody>
              {ulazi.map((v, i) => (
                <tr key={v.id}>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{i + 1}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}><strong>{v.tablica}</strong></td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{v.tip_vozila}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{v.firme?.naziv || '-'}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{new Date(v.vreme).toLocaleTimeString('sr-RS')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* IZLAZI */}
        <h3>➡️ Izlazi ({izlazi.length})</h3>
        {izlazi.length === 0 ? (
          <p>Nema izlaza u ovoj smeni.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#ffebee' }}>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>#</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Tablica</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Tip</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Firma</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Vreme</th>
              </tr>
            </thead>
            <tbody>
              {izlazi.map((v, i) => (
                <tr key={v.id}>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{i + 1}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}><strong>{v.tablica}</strong></td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{v.tip_vozila}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{v.firme?.naziv || '-'}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{new Date(v.vreme).toLocaleTimeString('sr-RS')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Dugmad */}
      <div style={{ marginTop: 30, display: 'flex', gap: 10, flexWrap: 'wrap' }} className="no-print">
        <button onClick={handleStampa} style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          🖨️ Štampaj
        </button>
        <button onClick={onZatvori} style={{ padding: '10px 20px' }}>
          Zatvori
        </button>
      </div>

      {/* Email sekcija */}
      <div style={{ marginTop: 20, padding: 15, border: '1px solid #ddd', borderRadius: 8 }} className="no-print">
        <h3>Pošalji na email</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="email"
            placeholder="email@primer.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ flex: 1, padding: 8 }}
          />
          <button
            onClick={handlePosaljiEmail}
            disabled={saljem}
            style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            {saljem ? 'Šaljem...' : '📧 Pošalji'}
          </button>
        </div>
        {poruka && <p style={{ marginTop: 10 }}>{poruka}</p>}
      </div>
    </div>
  )
}