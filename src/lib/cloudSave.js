// Cloud-save sloj — JSONB snapshot stanja po korisniku (tabela game_states).
import { supabase } from './supabase.js';

/** Učitaj snapshot stanja iz oblaka (ili null). */
export async function loadCloudState(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('game_states')
    .select('state')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.state || null;
}

/** Upiši snapshot stanja u oblak (upsert). */
export async function saveCloudState(userId, state) {
  if (!supabase || !userId) return;
  const { error } = await supabase
    .from('game_states')
    .upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}
