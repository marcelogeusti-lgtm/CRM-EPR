import { createClient } from '@supabase/supabase-js';

// Cliente com a service_role key — ignora RLS. Só pra código server-only
// de confiança que roda SEM sessão de usuário (ex.: webhook do Meta, que
// já valida a origem via assinatura HMAC antes de chegar aqui). Nunca
// importar isto em Client Component nem expor a chave ao browser.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada.');
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
