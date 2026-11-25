import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lptiiwrwyyfnwazmmfea.supabase.co'
const supabaseAnonKey = 'sb_publishable_22GTkr84LIDKO6zrehjPeA_7Cq2keTQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)