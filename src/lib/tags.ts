import { prisma } from '@/lib/prisma';

/**
 * Cria a tag (se não existir) e associa a um contato. Único ponto que faz
 * isso — usado tanto pelo nó ADD_TAG do motor de fluxo
 * (src/lib/flowEngine.ts) quanto pela marcação manual no Inbox
 * (src/actions/inbox.ts), pra não duplicar a lógica de upsert.
 */
export async function addTagToContact(tenantId: string, contactId: string, tagName: string) {
  const tag = await prisma.tag.upsert({
    where: { tenantId_name: { tenantId, name: tagName } },
    update: {},
    create: { tenantId, name: tagName },
  });
  await prisma.tagsOnContacts.upsert({
    where: { contactId_tagId: { contactId, tagId: tag.id } },
    update: {},
    create: { contactId, tagId: tag.id },
  });
  return tag;
}

export async function removeTagFromContact(contactId: string, tagId: string) {
  await prisma.tagsOnContacts.delete({
    where: { contactId_tagId: { contactId, tagId } },
  }).catch(() => {
    // já não existia — sem problema, o estado final é o mesmo
  });
}
