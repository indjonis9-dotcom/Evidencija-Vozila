import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function AdminSmene() {
  const [smene, setSmene] = useState([])
  const [greska, setGreska] = useState(null)
  const [ucitavam, setUcitavam] = useState(true)
  const [izabranaSmena, setIzabranaSmena] = useState(null)
  const [detalji, setDetalji] = useState([])

  useEffect(() => {
    ucitajSmene()
  }, [])

  const ucitajSmene = async () => {
    setUcitavam(true)
    const { data, error } = await supabase
      .from('smene')
      .select('*, korisnici(ime)')
      .order('vreme_pocetka', { ascending: false })
      .limit(50)

    if (error) setGreska(error.message)
    else setSmene(data || [])
    setUcitavam(false)
  }

  const handleOtvoriSmenu = async (smena) => {
    setIzabranaSmena(smena)
    const { data, error } = await supabase
      .from('evidencija')
      .select('*, firme(naziv)')
      .eq('smena_id', smena.id)
      .order('vreme', { ascending: true })

    if (error) setGreska(error.message)
    else setDetalji(data || [])
  }

  if (ucitavam) return <p>Učitavam smene...</p>

  // Detalji izabrane smene
  if (izabranaSmena) {
    return (
      <div>
        <button onClick={() => setIzabranaSmena(null)} style={{ marginBottom: 15, padding: '6px 12px' }}>← Nazad na listu</button>
        <h3>Smena — {new Date(izabranaSmena.vreme_pocetka).toLocaleString('sr-RS')}</h3>
        <p>
          <strong>Portir:</strong> {izabranaSmena.korisnici?.ime || '-'}<br />
          <strong>Status:</strong> {izabranaSmena.status}<br />
          <strong>Kraj:</strong> {izabranaSmena.vreme_kraja ? new Date(izabranaSmena.vreme_kraja).toLocaleString('sr-RS') : '-'}
        </p>

        <h4>Zapisi ({detalji.length})</h4>
        {detalji.length === 0 ? (
          <p>Nema zapisa.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#eee' }}>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Tip</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Tablica</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Tip vozila</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Firma</th>
                <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Vreme</th>
              </tr>
            </thead>
            <tbody>
              {detalji.map((d) => (
                <tr key={d.id}>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{d.tip_unosa}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}><strong>{d.tablica}</strong></td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{d.tip_vozila}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{d.firme?.naziv || '-'}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{new Date(d.vreme).toLocaleTimeString('sr-RS')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  // Lista smena
  return (
    <div>
      <h3>Sve smene ({smene.length})</h3>
      {greska && <p style={{ color: 'red' }}>{greska}</p>}
      {smene.length === 0 ? (
        <p>Nema smena.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#eee' }}>
              <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Datum</th>
              <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Portir</th>
              <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Početak</th>
              <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Kraj</th>
              <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Status</th>
              <th style={{ border: '1px solid #ccc', padding: 6, textAlign: 'left' }}>Akcija</th>
            </tr>
          </thead>
          <tbody>
            {smene.map((s) => (
              <tr key={s.id}>
                <td style={{ border: '1px solid #ccc', padding: 6 }}>{new Date(s.vreme_pocetka).toLocaleDateString('sr-RS')}</td>
                <td style={{ border: '1px solid #ccc', padding: 6 }}>{s.korisnici?.ime || '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: 6 }}>{new Date(s.vreme_pocetka).toLocaleTimeString('sr-RS')}</td>
                <td style={{ border: '1px solid #ccc', padding: 6 }}>{s.vreme_kraja ? new Date(s.vreme_kraja).toLocaleTimeString('sr-RS') : '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: 6 }}>{s.status}</td>
                <td style={{ border: '1px solid #ccc', padding: 6 }}>
                  <button onClick={() => handleOtvoriSmenu(s)} style={{ padding: '4px 8px' }}>Otvori</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}