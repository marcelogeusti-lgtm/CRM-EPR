export type PlanId = 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface PlanLimits {
  users: number;
  whatsAppInstances: number;
  pipelines: number;
  supportLevel: 'BASIC' | 'PRIORITY' | 'DEDICATED';
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  STARTER: {
    users: 3,
    whatsAppInstances: 1,
    pipelines: 1,
    supportLevel: 'BASIC',
  },
  PRO: {
    users: 10,
    whatsAppInstances: 3,
    pipelines: 5,
    supportLevel: 'PRIORITY',
  },
  ENTERPRISE: {
    users: 9999, // practically unlimited
    whatsAppInstances: 9999,
    pipelines: 9999,
    supportLevel: 'DEDICATED',
  },
};
