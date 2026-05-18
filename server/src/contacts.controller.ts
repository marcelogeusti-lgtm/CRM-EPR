import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { getTenantId } from './tenant.context';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todos os contatos do inquilino ativo, suportando busca por termo (nome, e-mail, telefone).
   */
  @Get()
  async getContacts(@Query('search') search?: string) {
    const tenantId = getTenantId();
    if (!tenantId) return [];

    return this.prisma.contact.findMany({
      where: {
        tenantId,
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ]
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cria um novo contato no banco de dados.
   */
  @Post()
  async createContact(@Body() body: { name: string; phone?: string; email?: string; tags?: string[]; company?: string }) {
    const tenantId = getTenantId();
    if (!tenantId) throw new Error('Tenant ID não identificado no contexto.');

    const metadata = body.company ? { company: body.company } : {};

    return this.prisma.contact.create({
      data: {
        tenantId,
        name: body.name,
        phone: body.phone || null,
        email: body.email || null,
        tags: body.tags || [],
        metadata,
      },
    });
  }

  /**
   * Atualiza as informações de um contato existente.
   */
  @Put(':id')
  async updateContact(
    @Param('id') id: string,
    @Body() body: { name?: string; phone?: string; email?: string; tags?: string[]; company?: string }
  ) {
    const tenantId = getTenantId();
    if (!tenantId) throw new Error('Tenant ID não identificado no contexto.');

    const metadata = body.company ? { company: body.company } : {};

    return this.prisma.contact.update({
      where: { id, tenantId },
      data: {
        name: body.name,
        phone: body.phone || null,
        email: body.email || null,
        tags: body.tags || [],
        metadata,
      },
    });
  }

  /**
   * Exclui permanentemente um contato.
   */
  @Delete(':id')
  async deleteContact(@Param('id') id: string) {
    const tenantId = getTenantId();
    if (!tenantId) throw new Error('Tenant ID não identificado no contexto.');

    return this.prisma.contact.delete({
      where: { id, tenantId },
    });
  }
}
