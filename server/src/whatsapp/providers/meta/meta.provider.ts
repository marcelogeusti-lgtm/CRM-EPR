import { Injectable, Logger } from '@nestjs/common';
import { WhatsappProvider, WhatsappProviderConfig } from '../whatsapp-provider.interface';
import axios from 'axios';

@Injectable()
export class MetaProvider implements WhatsappProvider {
  private readonly logger = new Logger(MetaProvider.name);

  async sendMessage(to: string, content: string, config: WhatsappProviderConfig): Promise<any> {
    if (!config.waBusinessId || !config.accessToken) {
      throw new Error('Meta API credentials missing (WABA ID or Access Token)');
    }

    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${config.waBusinessId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: content },
      },
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  }
}
