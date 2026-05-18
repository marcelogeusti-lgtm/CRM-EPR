import { Injectable, Logger } from '@nestjs/common';
import { ChannelProvider } from './channel-provider.interface';

@Injectable()
export class ChannelsRegistry {
  private readonly logger = new Logger(ChannelsRegistry.name);
  private readonly providers = new Map<string, ChannelProvider>();

  /**
   * Registra um provedor de canal sob uma chave (ex: 'WHATSAPP', 'INSTAGRAM').
   */
  register(channelType: string, provider: ChannelProvider) {
    const key = channelType.toUpperCase();
    this.providers.set(key, provider);
    this.logger.log(`Canal registrado com sucesso: "${key}"`);
  }

  /**
   * Retorna o provedor correspondente para o canal solicitado.
   */
  get(channelType: string): ChannelProvider {
    const key = channelType.toUpperCase();
    const provider = this.providers.get(key);
    
    if (!provider) {
      throw new Error(`Provedor de canal não encontrado/registrado para: "${channelType}"`);
    }
    
    return provider;
  }
}
