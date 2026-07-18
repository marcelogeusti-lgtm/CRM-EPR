ALTER TABLE "AgentScriptStep"
  ADD COLUMN "mediaType" TEXT NOT NULL DEFAULT 'TEXT',
  ADD COLUMN "mediaUrl" TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-media', 'agent-media', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública: obrigatória porque a API do WhatsApp (Meta) busca o
-- arquivo por URL pública ao enviar a mensagem — não tem como usar URL
-- assinada/privada nesse fluxo.
CREATE POLICY "agent-media public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'agent-media');

-- Upload restrito: só quem está autenticado E é membro do tenant dono da
-- pasta (primeiro segmento do path = tenantId) pode gravar ali.
CREATE POLICY "agent-media tenant upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agent-media'
  AND (storage.foldername(name))[1] = (
    SELECT "tenantId" FROM "User" WHERE id = auth.uid()::text
  )
);

CREATE POLICY "agent-media tenant delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agent-media'
  AND (storage.foldername(name))[1] = (
    SELECT "tenantId" FROM "User" WHERE id = auth.uid()::text
  )
);
