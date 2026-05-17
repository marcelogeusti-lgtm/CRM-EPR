import { Injectable, Logger } from '@nestjs/common';
import { WhatsappProvider, WhatsappProviderConfig } from '../whatsapp-provider.interface';
import axios from 'axios';

@Injectable()
export class WppconnectProvider implements WhatsappProvider {
  private readonly logger = new Logger(WppconnectProvider.name);

  async sendMessage(to: string, content: string, config: WhatsappProviderConfig): Promise<any> {
    const baseUrl = config.unofficialUrl || 'http://localhost:3003';
    this.logger.log(`Sending WPPConnect message to ${to} via instance ${config.instanceName}`);

    try {
      const response = await axios.post(
        `${baseUrl}/api/${config.instanceName}/send-message`,
        {
          phone: to,
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
      this.logger.warn(`Wppconnect service not active at ${baseUrl}. Falling back to simulation mode.`);
      return { status: 'mocked', service: 'WPPConnect', message: 'Simulated WPPConnect text delivery' };
    }
  }
}
