import { useState } from 'react'
import AdminSmene from './AdminSmene'
import AdminFirme from './AdminFirme'
import AdminVozila from './AdminVozila'
import AdminKorisnici from './AdminKorisnici'

export default function AdminPanel({ onZatvori }) {
  const [sekcija, setSekcija] = useState('smene')

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>⚙️ Admin panel</h2>
        <button onClick={onZatvori} style={{ padding: '6px 12px' }}>← Nazad</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setSekcija('smene')}
          style={{ padding: '10px 20px', backgroundColor: sekcija === 'smene' ? '#2563eb' : '#eee', color: sekcija === 'smene' ? 'white' : 'black', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          📋 Smene
        </button>
        <button
          onClick={() => setSekcija('firme')}
          style={{ padding: '10px 20px', backgroundColor: sekcija === 'firme' ? '#2563eb' : '#eee', color: sekcija === 'firme' ? 'white' : 'black', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          🏢 Firme
        </button>
        <button
          onClick={() => setSekcija('vozila')}
          style={{ padding: '10px 20px', backgroundColor: sekcija === 'vozila' ? '#2563eb' : '#eee', color: sekcija === 'vozila' ? 'white' : 'black', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          🚛 Vozila
        </button>
        <button
          onClick={() => setSekcija('korisnici')}
          style={{ padding: '10px 20px', backgroundColor: sekcija === 'korisnici' ? '#2563eb' : '#eee', color: sekcija === 'korisnici' ? 'white' : 'black', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          👤 Korisnici
        </button>
      </div>

      {sekcija === 'smene' && <AdminSmene />}
      {sekcija === 'firme' && <AdminFirme />}
      {sekcija === 'vozila' && <AdminVozila />}
      {sekcija === 'korisnici' && <AdminKorisnici />}
    </div>
  )
}