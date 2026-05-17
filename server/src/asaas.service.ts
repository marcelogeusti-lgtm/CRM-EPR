import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import axios from 'axios';

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly baseUrl = 'https://sandbox.asaas.com/api/v3'; // Use sandbox for dev

  constructor(private prisma: PrismaService) {}

  private async getClient(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const apiKey = (tenant?.settings as any)?.asaasApiKey || process.env.ASAAS_API_KEY;
    
    if (!apiKey) {
      throw new BadRequestException('Asaas API Key not configured for this tenant');
    }

    return axios.create({
      baseURL: this.baseUrl,
      headers: { access_token: apiKey },
    });
  }

  async createCustomer(tenantId: string, contactId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId, tenantId },
    });

    if (!contact) throw new BadRequestException('Contact not found');

    const client = await this.getClient(tenantId);

    try {
      const response = await client.post('/customers', {
        name: contact.name,
        email: contact.email,
        mobilePhone: contact.phone,
        externalReference: contact.id,
      });

      // Store Asaas customer ID in contact metadata
      await this.prisma.contact.update({
        where: { id: contact.id },
        data: {
          metadata: {
            ...(contact.metadata as any || {}),
            asaasCustomerId: response.data.id,
          },
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error creating Asaas customer:', error.response?.data || error.message);
      throw error;
    }
  }

  async createPayment(tenantId: string, data: any) {
    const client = await this.getClient(tenantId);

    try {
      const response = await client.post('/payments', {
        customer: data.asaasCustomerId,
        billingType: data.billingType || 'PIX',
        value: data.value,
        dueDate: data.dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        description: data.description,
        externalReference: data.orderId || data.dealId,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error creating Asaas payment:', error.response?.data || error.message);
      throw error;
    }
  }

  async handleWebhook(payload: any) {
    this.logger.log(`Received Asaas webhook: ${payload.event}`);

    const event = payload.event;
    const payment = payload.payment;

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const externalReference = payment.externalReference;
      
      // Update transaction status in database
      const transaction = await this.prisma.transaction.findFirst({
        where: { id: externalReference },
      });

      if (transaction) {
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            paidAt: new Date(),
          },
        });
        
        this.logger.log(`Payment confirmed for transaction ${transaction.id}`);
      }
    }
  }
}
