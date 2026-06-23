// Supabase client (§15.1). Reads config from Vite env vars; see .env.example.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Exported as null when unconfigured so the Phase-1 card demo runs without a backend.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
