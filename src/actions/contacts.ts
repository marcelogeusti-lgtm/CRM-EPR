'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createContact(formData: FormData) {
  const tenantId = await requireTenantId();

  const name = (formData.get('name') as string || '').trim();
  const phone = (formData.get('phone') as string || '').trim();
  const email = (formData.get('email') as string || '').trim();

  if (!name) {
    return { success: false, error: 'Nome é obrigatório.' };
  }

  const contact = await prisma.contact.create({
    data: {
      tenantId,
      name,
      phone: phone || null,
      email: email || null,
    },
  });

  revalidatePath('/lists');
  return { success: true, data: contact };
}

interface ParsedContact {
  name: string;
  phone: string | null;
  email: string | null;
}

function normalizePhone(raw: string): string {
  // Só dígitos, pra comparar "(11) 99999-8888" com "11999998888" como o
  // mesmo número na hora de checar duplicata.
  return raw.replace(/\D/g, '');
}

// Parser de vCard (.vcf) simples: um ou mais blocos BEGIN:VCARD...END:VCARD,
// pega FN (nome), primeiro TEL e primeiro EMAIL de cada bloco. vCard não tem
// biblioteca no projeto e o formato usado por exportação de agenda
// (iPhone/Android/Google Contacts) é bem regular — não vale trazer uma
// dependência nova só pra isso.
function parseVCard(text: string): ParsedContact[] {
  const blocks = text.split(/BEGIN:VCARD/i).slice(1);
  const contacts: ParsedContact[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    let name = '';
    let phone: string | null = null;
    let email: string | null = null;

    for (const line of lines) {
      const [rawKey, ...rest] = line.split(':');
      const value = rest.join(':').trim();
      if (!value) continue;
      const key = rawKey.split(';')[0].toUpperCase();

      if (key === 'FN' && !name) name = value;
      else if (key === 'N' && !name) name = value.split(';').filter(Boolean).reverse().join(' ');
      else if (key === 'TEL' && !phone) phone = value;
      else if (key === 'EMAIL' && !email) email = value;
    }

    if (name || phone) {
      contacts.push({ name: name || phone || 'Sem nome', phone, email });
    }
  }

  return contacts;
}

// Parser de CSV simples: detecta separador (";" é comum em export BR, "," é
// o padrão internacional) e tenta reconhecer cabeçalho por palavra-chave. Se
// não reconhecer cabeçalho, assume ordem nome,telefone,email.
function parseCsv(text: string): ParsedContact[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const splitLine = (line: string) => line.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''));

  const headerCells = splitLine(lines[0]).map(c => c.toLowerCase());
  const nameIdx = headerCells.findIndex(c => c.includes('nome') || c.includes('name'));
  const phoneIdx = headerCells.findIndex(c => c.includes('telefone') || c.includes('phone') || c.includes('celular'));
  const emailIdx = headerCells.findIndex(c => c.includes('email') || c.includes('e-mail'));

  const hasHeader = nameIdx !== -1 || phoneIdx !== -1 || emailIdx !== -1;
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map(line => {
    const cells = splitLine(line);
    const name = hasHeader && nameIdx !== -1 ? cells[nameIdx] : cells[0];
    const phone = hasHeader && phoneIdx !== -1 ? cells[phoneIdx] : cells[1];
    const email = hasHeader && emailIdx !== -1 ? cells[emailIdx] : cells[2];
    return { name: name || phone || 'Sem nome', phone: phone || null, email: email || null };
  }).filter(c => c.name || c.phone);
}

export async function importContacts(formData: FormData) {
  const tenantId = await requireTenantId();

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Nenhum arquivo enviado.' };
  }

  const text = await file.text();
  const trimmed = text.trimStart();
  const parsed = /^BEGIN:VCARD/i.test(trimmed) ? parseVCard(text) : parseCsv(text);

  if (parsed.length === 0) {
    return { success: false, error: 'Não encontrei nenhum contato nesse arquivo. Confira o formato (.vcf ou .csv).' };
  }

  const existing = await prisma.contact.findMany({
    where: { tenantId, phone: { not: null } },
    select: { phone: true },
  });
  const existingPhones = new Set(existing.map(c => normalizePhone(c.phone || '')).filter(Boolean));

  const seenInBatch = new Set<string>();
  const toCreate: { tenantId: string; name: string; phone: string | null; email: string | null }[] = [];
  let skipped = 0;

  for (const c of parsed) {
    const normalized = c.phone ? normalizePhone(c.phone) : '';
    if (normalized && (existingPhones.has(normalized) || seenInBatch.has(normalized))) {
      skipped++;
      continue;
    }
    if (normalized) seenInBatch.add(normalized);
    toCreate.push({ tenantId, name: c.name.trim() || 'Sem nome', phone: c.phone, email: c.email });
  }

  const created = toCreate.length > 0
    ? await prisma.$transaction(toCreate.map(data => prisma.contact.create({ data })))
    : [];

  revalidatePath('/lists');
  return {
    success: true,
    imported: created.length,
    skipped,
    total: parsed.length,
    contacts: created,
  };
}
