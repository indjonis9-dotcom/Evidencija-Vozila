import { supabase } from './supabaseClient'

// Nađi korisnika po auth_id
export async function nadjiKorisnika(authId) {
  const { data, error } = await supabase
    .from('korisnici')
    .select('id, ime, uloga')
    .eq('auth_id', authId)
    .maybeSingle()

  if (error) throw error
  return data
}

// Kreiraj novu smenu
export async function kreirajSmenu(portirId) {
  const { data, error } = await supabase
    .from('smene')
    .insert({
      portir_id: portirId,
      status: 'u_toku'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Završi smenu
export async function zavrsiSmenu(smenaId) {
  const { error } = await supabase
    .from('smene')
    .update({
      status: 'zavrsena',
      vreme_kraja: new Date().toISOString()
    })
    .eq('id', smenaId)

  if (error) throw error
}