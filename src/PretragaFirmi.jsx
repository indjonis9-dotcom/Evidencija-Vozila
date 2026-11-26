import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

export default function PretragaFirmi({ vrednost, onPromena, placeholder = 'Ukucaj naziv firme...' }) {
  const [tekst, setTekst] = useState('')
  const [firme, setFirme] = useState([])
  const [prikaziListu, setPrikaziListu] = useState(false)
  const [izabranaFirma, setIzabranaFirma] = useState(null)
  const wrapperRef = useRef(null)

  // Učitaj sve firme jednom (za 50+ firmi je ok)
  useEffect(() => {
    async function ucitaj() {
      const { data, error } = await supabase
        .from('firme')
        .select('id, naziv')
        .eq('aktivan', true)
        .order('naziv')
      if (!error) setFirme(data || [])
    }
    ucitaj()
  }, [])

  // Ako je vrednost promenjena spolja (npr. reset forme)
  useEffect(() => {
    if (!vrednost) {
      setTekst('')
      setIzabranaFirma(null)
    } else {
      const f = firme.find(x => x.id === vrednost)
      if (f) {
        setIzabranaFirma(f)
        setTekst(f.naziv)
      }
    }
  }, [vrednost, firme])

  // Zatvori listu kada klikneš van
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setPrikaziListu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtrirane = tekst.trim()
    ? firme.filter(f => f.naziv.toLowerCase().includes(tekst.toLowerCase()))
    : firme.slice(0, 20) // ako je prazno, prikaži prvih 20

  const handleIzbor = (firma) => {
    setIzabranaFirma(firma)
    setTekst(firma.naziv)
    setPrikaziListu(false)
    onPromena(firma.id)
  }

  const handleOcisti = () => {
    setTekst('')
    setIzabranaFirma(null)
    onPromena('')
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 5 }}>
        <input
          type="text"
          value={tekst}
          onChange={(e) => {
            setTekst(e.target.value)
            setPrikaziListu(true)
            if (izabranaFirma) {
              setIzabranaFirma(null)
              onPromena('')
            }
          }}
          onFocus={() => setPrikaziListu(true)}
          placeholder={placeholder}
          style={{ flex: 1, padding: 8 }}
        />
        {tekst && (
          <button type="button" onClick={handleOcisti} style={{ padding: '8px 12px' }}>
            ✕
          </button>
        )}
      </div>

      {prikaziListu && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: 250,
          overflowY: 'auto',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          marginTop: 2,
        }}>
          {filtrirane.length === 0 ? (
            <div style={{ padding: 10, color: '#666', fontStyle: 'italic' }}>
              Nema rezultata za "{tekst}"
            </div>
          ) : (
            filtrirane.map(f => (
              <div
                key={f.id}
                onClick={() => handleIzbor(f)}
                style={{
                  padding: 10,
                  cursor: 'pointer',
                  backgroundColor: izabranaFirma?.id === f.id ? '#e3f2fd' : 'white',
                  borderBottom: '1px solid #eee',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = izabranaFirma?.id === f.id ? '#e3f2fd' : 'white'}
              >
                {f.naziv}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}