'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';
import { runStageAutomations } from '@/actions/automations';
import { revalidatePath } from 'next/cache';

// Helper to ensure a Pipeline and Stages exist
async function ensureDefaultPipeline(tenantId: string) {
  let pipeline = await prisma.pipeline.findFirst({ where: { tenantId } });

  if (!pipeline) {
    pipeline = await prisma.pipeline.create({
      data: {
        tenantId,
        name: 'Funil Principal',
        stages: {
          create: [
            { name: 'COMENTÁRIO OU DM', order: 0, color: 'bg-zinc-500' },
            { name: 'ENVIO DE BRINDE OU DM', order: 1, color: 'bg-blue-500' },
            { name: 'QUALIFICADO', order: 2, color: 'bg-green-500' },
            { name: 'OFERTA ENVIADA', order: 3, color: 'bg-yellow-500' }
          ]
        }
      }
    });
  }
  return pipeline;
}

export async function getLeads() {
  try {
    const tenantId = await requireTenantId();
    const pipeline = await ensureDefaultPipeline(tenantId);

    const leads = await prisma.deal.findMany({
      where: { tenantId, pipelineId: pipeline.id },
      include: {
        contact: true,
        stage: true // Include stage to get the name
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map back to the expected front-end format (stage as string)
    const formattedLeads = leads.map(lead => ({
      id: lead.id,
      title: lead.title,
      value: lead.value,
      stage: lead.stage?.name || 'COMENTÁRIO OU DM',
      contact: lead.contact ? {
        name: lead.contact.name,
        phone: lead.contact.phone,
        email: lead.contact.email
      } : { name: 'Sem Contato', phone: null, email: null }
    }));

    return { success: true, data: formattedLeads };
  } catch (error) {
    console.error('Error fetching leads:', error);
    return { success: false, error: 'Failed to fetch leads' };
  }
}

export async function createLead(formData: FormData) {
  try {
    const tenantId = await requireTenantId();

    const title = formData.get('title') as string;
    const value = parseFloat(formData.get('value') as string) || 0;
    const contactName = formData.get('contactName') as string || 'Sem Nome';
    const contactPhone = formData.get('contactPhone') as string || '';

    const pipeline = await ensureDefaultPipeline(tenantId);

    // Get the first stage (Comentário ou DM)
    const firstStage = await prisma.stage.findFirst({
      where: { pipelineId: pipeline.id },
      orderBy: { order: 'asc' }
    });

    if (!firstStage) throw new Error("No stages found in pipeline");

    const contact = await prisma.contact.create({
      data: {
        name: contactName,
        phone: contactPhone,
        tenantId
      }
    });

    const deal = await prisma.deal.create({
      data: {
        title,
        value,
        stageId: firstStage.id,
        pipelineId: pipeline.id,
        contactId: contact.id,
        tenantId
      }
    });

    revalidatePath('/pipeline');
    return { success: true, data: deal };
  } catch (error) {
    console.error('Error creating lead:', error);
    return { success: false, error: 'Failed to create lead' };
  }
}

export async function updateLeadStage(leadId: string, newStageName: string) {
  try {
    const tenantId = await requireTenantId();

    const pipeline = await prisma.pipeline.findFirst({ where: { tenantId } });
    if (!pipeline) return { success: false, error: 'No pipeline found' };

    const targetStage = await prisma.stage.findFirst({
      where: { pipelineId: pipeline.id, name: newStageName }
    });

    if (!targetStage) return { success: false, error: 'Stage not found' };

    // Escopa o update ao tenant para impedir mover deal de outro cliente.
    const result = await prisma.deal.updateMany({
      where: { id: leadId, tenantId },
      data: { stageId: targetStage.id }
    });

    if (result.count === 0) return { success: false, error: 'Deal not found' };

    await runStageAutomations(tenantId, targetStage.id, leadId);

    revalidatePath('/pipeline');
    return { success: true };
  } catch (error) {
    console.error('Error updating lead stage:', error);
    return { success: false, error: 'Failed to update lead stage' };
  }
}
