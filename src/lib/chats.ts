import type { Chat, NotificationBody } from '../types';

const storageKey = (id: string) => `green-chat:whatsapp:${id}`;

export function loadChats(id: string): Chat[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey(id)) || '[]');
    return Array.isArray(value) ? value.filter(isChat) : [];
  } catch {
    return [];
  }
}

function isChat(value: unknown): value is Chat {
  if (!value || typeof value !== 'object') return false;
  const chat = value as Partial<Chat>;
  return typeof chat.id === 'string' && typeof chat.name === 'string' && typeof chat.phone === 'string' && Array.isArray(chat.messages) && typeof chat.unread === 'number';
}

export function saveChats(id: string, chats: Chat[]): void {
  localStorage.setItem(storageKey(id), JSON.stringify(chats));
}

export function phoneFromId(id?: string): string {
  return /^\d+@c\.us$/.test(id || '') ? id!.split('@')[0] : '';
}

export function incomingText(body: NotificationBody): string | null {
  if (body.messageData?.typeMessage === 'textMessage') return body.messageData.textMessageData?.textMessage ?? null;
  if (['extendedTextMessage', 'quotedMessage'].includes(body.messageData?.typeMessage || '')) return body.messageData?.extendedTextMessageData?.text ?? null;
  return null;
}

export function messageTime(value: number): string {
  return new Intl.DateTimeFormat('ru', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
