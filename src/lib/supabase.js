import { createClient } from "@supabase/supabase-js";

// Le chiavi si impostano su Vercel (Settings → Environment Variables)
// oppure, per lo sviluppo locale, in un file .env.local:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJ...
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
