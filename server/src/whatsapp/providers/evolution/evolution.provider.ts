import { Injectable, Logger } from '@nestjs/common';
import { WhatsappProvider, WhatsappProviderConfig } from '../whatsapp-provider.interface';
import axios from 'axios';

@Injectable()
export class EvolutionProvider implements WhatsappProvider {
  private readonly logger = new Logger(EvolutionProvider.name);

  async sendMessage(to: string, content: string, config: WhatsappProviderConfig): Promise<any> {
    if (!config.unofficialUrl) {
      this.logger.warn(`Evolution API URL is empty for instance ${config.instanceName}. Simulating send...`);
      return { status: 'mocked', message: 'Simulated Evolution API delivery' };
    }

    const cleanUrl = config.unofficialUrl.replace(/\/$/, '');
    const response = await axios.post(
      `${cleanUrl}/message/sendText/${config.instanceName}`,
      {
        number: to,
        options: {
          delay: 500,
          presence: "composing"
        },
        textMessage: { text: content }
      },
      {
        headers: {
          apikey: config.unofficialToken || '',
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }
}
