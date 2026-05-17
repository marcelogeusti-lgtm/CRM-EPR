export interface WhatsappProviderConfig {
  accessToken?: string;
  waBusinessId?: string;
  unofficialUrl?: string;
  unofficialToken?: string;
  instanceName?: string;
}

export interface WhatsappProvider {
  sendMessage(
    to: string,
    content: string,
    config: WhatsappProviderConfig
  ): Promise<any>;
}
