'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export function SupabaseRealtime() {
  const router = useRouter();

  useEffect(() => {
    // Inscreve-se na tabela Deal (para novos leads no Kanban)
    const dealSubscription = supabase
      .channel('public:Deal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Deal' }, (payload) => {
        console.log('Realtime Deal:', payload);
        router.refresh(); // Atualiza a página usando os Server Components
      })
      .subscribe();

    // Inscreve-se na tabela Activity (para mensagens no Inbox/Split-Screen)
    const activitySubscription = supabase
      .channel('public:Activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Activity' }, (payload) => {
        console.log('Realtime Activity:', payload);
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dealSubscription);
      supabase.removeChannel(activitySubscription);
    };
  }, [router]);

  return null;
}
