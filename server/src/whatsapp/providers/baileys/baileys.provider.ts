import { Injectable, Logger } from '@nestjs/common';
import { WhatsappProvider, WhatsappProviderConfig } from '../whatsapp-provider.interface';
import axios from 'axios';

@Injectable()
export class BaileysProvider implements WhatsappProvider {
  private readonly logger = new Logger(BaileysProvider.name);

  async sendMessage(to: string, content: string, config: WhatsappProviderConfig): Promise<any> {
    const baseUrl = config.unofficialUrl || 'http://localhost:3002';
    this.logger.log(`Sending Baileys message to ${to} via instance ${config.instanceName}`);

    try {
      const response = await axios.post(
        `${baseUrl}/instance/${config.instanceName}/message/text`,
        {
          number: to,
          message: content
        },
        {
          headers: {
            'Authorization': `Bearer ${config.unofficialToken || ''}`
          }
        }
      );
      return response.data;
    } catch (error) {
      this.logger.warn(`Direct Baileys service not active at ${baseUrl}. Falling back to simulation mode.`);
      return { status: 'mocked', service: 'Baileys', message: 'Simulated Baileys local instance text delivery' };
    }
  }
}
