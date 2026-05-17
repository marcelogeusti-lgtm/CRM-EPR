import { AsyncLocalStorage } from 'async_hooks';

export const tenantContext = new AsyncLocalStorage<string>();

export function getTenantId(): string | undefined {
  return tenantContext.getStore();
}
