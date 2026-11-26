import { useState } from 'react'
import emailjs from '@emailjs/browser'

export default function Izvestaj({ smena, popis, korisnik, onZatvori }) {
  const [email, setEmail] = useState('')
  const [saljem, setSaljem] = useState(false)
  const [poruka, setPoruka] = useState(null)

  const handleStampa = () => {
    window.print()
  }

  const handlePosaljiEmail = async () => {
    // 1. Provera email adrese
    if (!email.trim()) {
      setPoruka('❌ Unesi email adresu.')
      return
    }

    // 2. Provera da li ima vozila
    if (!popis || popis.length === 0) {
      setPoruka('❌ Nema vozila u izveštaju.')
      return
    }

    setSaljem(true)
    setPoruka(null)

    try {
      // 3. Napravi tekst izveštaja
      const tekst = popis.map((v, i) =>
        `${i + 1}. ${v.tablica} | ${v.tip_vozila} | ${v.firme?.naziv || '-'} | ${v.kategorija}${v.napomena ? ' | ' + v.napomena : ''}`
      ).join('\n')

      // 4. Parametri za EmailJS
      const parametri = {
        to_email: email.trim(),
        datum: new Date(smena.vreme_pocetka).toLocaleDateString('sr-RS'),
        portir: korisnik?.ime || 'Nepoznat',
        broj_vozila: popis.length,
        lista: tekst,
      }

      // 5. Debug — vidi šta se šalje
      console.log('EmailJS parametri:', parametri)

      // 6. Pošalji
      const rezultat = await emailjs.send(
        'service_dwa4e2l',
        'template_ylx64zh',
        parametri,
        'g65RsfyWa79puX1Ea'
      )

      console.log('EmailJS odgovor:', rezultat)

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
    <div style={{ padding: 20, maxWidth: 700, margin: 'auto' }}>
      {/* Deo koji se štampa */}
      <div id="izvestaj-za-stampu">
        <h2>Izveštaj popisa</h2>
        <p>
          <strong>Datum:</strong> {new Date(smena.vreme_pocetka).toLocaleDateString('sr-RS')}<br />
          <strong>Portir:</strong> {korisnik?.ime || '-'}<br />
          <strong>Početak smene:</strong> {new Date(smena.vreme_pocetka).toLocaleString('sr-RS')}<br />
          <strong>Kraj smene:</strong> {smena.vreme_kraja ? new Date(smena.vreme_kraja).toLocaleString('sr-RS') : '-'}<br />
          <strong>Broj vozila:</strong> {popis.length}
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
          <thead>
            <tr style={{ backgroundColor: '#eee' }}>
              <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>#</th>
              <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Tablica</th>
              <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Tip</th>
              <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Firma</th>
              <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Kategorija</th>
              <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>Napomena</th>
            </tr>
          </thead>
          <tbody>
            {popis.map((v, i) => (
              <tr key={v.id}>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{i + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}><strong>{v.tablica}</strong></td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{v.tip_vozila}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{v.firme?.naziv || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{v.kategorija}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{v.napomena || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
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