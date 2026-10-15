import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { acknowledgeNotification, checkAccount, connectInstance, receiveNotification, sendText } from '../lib/api';
import { incomingText, loadChats, phoneFromId, saveChats } from '../lib/chats';
import type { Chat, Credentials } from '../types';

const initialForm: Credentials = { idInstance: '', apiTokenInstance: '', apiUrl: 'https://api.green-api.com' };
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Ошибка соединения';

export function useChat() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [form, setForm] = useState<Credentials>(initialForm);
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const chatsRef = useRef<Chat[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [newError, setNewError] = useState('');
  const [newBusy, setNewBusy] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [pollError, setPollError] = useState('');

  function commit(next: Chat[], id = credentials?.idInstance) {
    chatsRef.current = next;
    setChats(next);
    if (id) saveChats(id, next);
  }

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConnectBusy(true);
    setConnectError('');
    const data = { idInstance: form.idInstance.trim(), apiTokenInstance: form.apiTokenInstance.trim(), apiUrl: form.apiUrl.trim() };
    try {
      await connectInstance(data);
      const saved = loadChats(data.idInstance);
      commit(saved, data.idInstance);
      setCredentials(data);
      setSelected(saved[0]?.id || null);
      setPollError('');
    } catch (error) {
      setConnectError(errorMessage(error));
    } finally {
      setConnectBusy(false);
    }
  }

  function disconnect() {
    setCredentials(null);
    setForm(current => ({ ...current, apiTokenInstance: '' }));
    setSelected(null);
    chatsRef.current = [];
    setChats([]);
  }

  async function createChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNewError('');
    if (!credentials) return false;
    const digits = phone.replace(/\D/g, '');
    if (!/^\d{7,15}$/.test(digits)) {
      setNewError('Введите номер с кодом страны: от 7 до 15 цифр');
      return false;
    }
    const existing = chatsRef.current.find(chat => chat.phone === digits);
    if (existing) {
      setSelected(existing.id);
      return true;
    }
    setNewBusy(true);
    try {
      const result = await checkAccount(credentials, digits);
      if (!result.existsWhatsapp || !result.chatId) throw new Error('Аккаунт WhatsApp по этому номеру не найден или недоступен для проверки');
      const chat: Chat = { id: String(result.chatId), phone: digits, name: `+${digits}`, messages: [], unread: 0 };
      commit([chat, ...chatsRef.current]);
      setSelected(chat.id);
      setPhone('');
      return true;
    } catch (error) {
      setNewError(errorMessage(error));
      return false;
    } finally {
      setNewBusy(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || !selected || !credentials || sending) return;
    if (message.length > 4096) {
      setSendError('Максимум 4096 символов');
      return;
    }
    setSending(true);
    setSendError('');
    try {
      const result = await sendText(credentials, selected, message);
      const now = Date.now();
      commit(chatsRef.current.map(chat => chat.id === selected ? { ...chat, messages: [...chat.messages, { id: String(result.idMessage), text: message, outgoing: true, timestamp: now }] } : chat));
      setDraft('');
    } catch (error) {
      setSendError(errorMessage(error));
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (!credentials) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      if (!active || !credentials) return;
      try {
        for (let count = 0; count < 12 && active; count++) {
          const envelope = await receiveNotification(credentials);
          if (!active || !envelope) break;
          const payload = envelope.body;
          const chatId = String(payload?.senderData?.chatId || '');
          const text = incomingText(payload);
          if (payload?.typeWebhook === 'incomingMessageReceived' && /^\d+@(c\.us|lid)$/.test(chatId) && text !== null) {
            const name = payload.senderData?.chatName || payload.senderData?.senderName || chatId;
            const phoneNumber = phoneFromId(chatId) || phoneFromId(payload.senderData?.sender);
            const current = chatsRef.current;
            const existing = current.find(chat => chat.id === chatId || (phoneNumber && chat.phone === phoneNumber));
            const id = String(payload.idMessage || `${chatId}:${payload.timestamp}:${text}`);
            if (!existing?.messages.some(message => message.id === id)) {
              const item = { id, text, outgoing: false, timestamp: payload.timestamp ? payload.timestamp * 1000 : Date.now() };
              if (existing) commit(current.map(chat => chat.id === existing.id ? { ...chat, name: chat.phone ? chat.name : name, messages: [...chat.messages, item], unread: chat.unread + 1 } : chat));
              else commit([{ id: chatId, phone: phoneNumber, name, messages: [item], unread: 1 }, ...current]);
            }
          }
          await acknowledgeNotification(credentials, envelope.receiptId);
        }
        if (active) setPollError('');
      } catch (error) {
        if (active) setPollError(errorMessage(error));
      }
      if (active) timer = setTimeout(poll, 3000);
    }
    void poll();
    return () => { active = false; clearTimeout(timer); };
  }, [credentials]);

  useEffect(() => {
    if (!selected || !credentials) return;
    const current = chatsRef.current;
    if (current.some(chat => chat.id === selected && chat.unread)) commit(current.map(chat => chat.id === selected ? { ...chat, unread: 0 } : chat));
  }, [selected, chats, credentials]);

  const selectChat = (id: string) => { setSelected(id); setSendError(''); };
  return { credentials, form, setForm, connectBusy, connectError, connect, disconnect, chats, selected, selectChat, phone, setPhone, newError, setNewError, newBusy, createChat, draft, setDraft, sending, sendError, sendMessage, pollError };
}
