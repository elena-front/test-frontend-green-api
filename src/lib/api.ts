import type { Credentials, NotificationEnvelope } from '../types';

const apiOrigin = import.meta.env.VITE_API_ORIGIN?.replace(/\/+$/, '') || '';

async function request<T>(path: string, credentials: Credentials, extra: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${apiOrigin}/api/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...credentials, ...extra }),
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    const error = result as { error?: string };
    throw new Error(error.error || 'Не удалось выполнить запрос');
  }
  return result as T;
}

export const connectInstance = (credentials: Credentials) => request<{ stateInstance: string }>('connect', credentials);
export const checkAccount = (credentials: Credentials, phone: string) => request<{ existsWhatsapp: boolean; chatId?: string }>('check-account', credentials, { phone });
export const sendText = (credentials: Credentials, chatId: string, message: string) => request<{ idMessage: string }>('send', credentials, { chatId, message });
export const receiveNotification = (credentials: Credentials) => request<NotificationEnvelope | null>('receive', credentials);
export const acknowledgeNotification = (credentials: Credentials, receiptId: number) => request<unknown>('ack', credentials, { receiptId });
