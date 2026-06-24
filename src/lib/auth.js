// Auth sloj (Supabase). Degradira gracefully kad Supabase nije konfigurisan.
import { supabase } from './supabase.js';

export const authEnabled = !!supabase;

export async function signUp(email, password) {
  if (!supabase) return { error: 'Supabase nije konfigurisan' };
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    const msg = error.message || error.error_description || JSON.stringify(error) || 'Nepoznata greška';
    return { user: null, error: msg };
  }
  // Supabase vraća user bez session ako email nije potvrđen
  const user = data?.user ?? null;
  return { user, error: null };
}

export async function signIn(email, password) {
  if (!supabase) return { error: 'Supabase nije konfigurisan' };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user || null, error: error?.message || null };
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

/** Pretplata na promjene sesije; vrati unsubscribe. */
export function onAuthChange(cb) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session?.user || null));
  return () => data?.subscription?.unsubscribe?.();
}
