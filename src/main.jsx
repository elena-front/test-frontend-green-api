import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleHelp, LockKeyhole, LogOut, MessageCircle, MoreVertical, Phone, Plus, Search, Send, ShieldCheck, X } from 'lucide-react';
import './styles.css';

const storageKey = id => `green-chat:whatsapp:${id}`;
const phoneFromId = id => /^\d+@c\.us$/.test(String(id)) ? String(id).split('@')[0] : '';
const initials = name => (name || '?').replace(/^\+/, '').slice(0, 2).toUpperCase();
const colors = ['#7596b6', '#8c9dc3', '#8aae9e', '#bd9f88', '#9d91b6'];
const colorOf = value => colors[[...String(value)].reduce((n, c) => n + c.charCodeAt(0), 0) % colors.length];
const time = value => new Intl.DateTimeFormat('ru', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

async function request(path, credentials, extra = {}) {
  const response = await fetch(`/api/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...credentials, ...extra }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Не удалось выполнить запрос');
  return result;
}

function Avatar({ name, id, large = false }) {
  return <span className={`avatar ${large ? 'avatar-large' : ''}`} style={{ backgroundColor: colorOf(id) }}>{initials(name)}</span>;
}

function BrandMark({ large = false }) {
  return <span className={`wa-mark ${large ? 'wa-mark-large' : ''}`} aria-hidden="true"><MessageCircle className="wa-bubble-icon" strokeWidth={2.4} /><Phone className="wa-phone-icon" strokeWidth={2.7} /></span>;
}

function App() {
  const [credentials, setCredentials] = useState(null);
  const [form, setForm] = useState({ idInstance: '', apiTokenInstance: '', apiUrl: 'https://api.green-api.com' });
  const [showToken, setShowToken] = useState(false);
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [chats, setChats] = useState([]);
  const chatsRef = useRef([]);
  const [selected, setSelected] = useState(null);
  const [newChat, setNewChat] = useState(false);
  const [phone, setPhone] = useState('');
  const [newError, setNewError] = useState('');
  const [newBusy, setNewBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [pollError, setPollError] = useState('');
  const [mobileChat, setMobileChat] = useState(false);
  const [menu, setMenu] = useState(false);
  const bottomRef = useRef(null);

  function commit(next, id = credentials?.idInstance) {
    chatsRef.current = next;
    setChats(next);
    if (id) localStorage.setItem(storageKey(id), JSON.stringify(next));
  }

  async function connect(event) {
    event.preventDefault();
    setConnectBusy(true); setConnectError('');
    const data = { ...form, idInstance: form.idInstance.trim(), apiTokenInstance: form.apiTokenInstance.trim(), apiUrl: form.apiUrl.trim() };
    try {
      await request('connect', data);
      let saved = [];
      try { saved = JSON.parse(localStorage.getItem(storageKey(data.idInstance)) || '[]'); } catch { /* invalid local data */ }
      if (!Array.isArray(saved)) saved = [];
      commit(saved, data.idInstance);
      setCredentials(data); setSelected(saved[0]?.id || null); setPollError('');
    } catch (error) { setConnectError(error.message); }
    finally { setConnectBusy(false); }
  }

  function disconnect() {
    setCredentials(null); setForm({ ...form, apiTokenInstance: '' }); setSelected(null); setMenu(false); setMobileChat(false);
    chatsRef.current = []; setChats([]);
  }

  async function createChat(event) {
    event.preventDefault(); setNewError('');
    const digits = phone.replace(/\D/g, '');
    if (!/^\d{7,15}$/.test(digits)) return setNewError('Введите номер с кодом страны: от 7 до 15 цифр');
    const existing = chatsRef.current.find(chat => chat.phone === digits);
    if (existing) { setSelected(existing.id); setNewChat(false); setMobileChat(true); return; }
    setNewBusy(true);
    try {
      const result = await request('check-account', credentials, { phone: digits });
      if (!result.existsWhatsapp || !result.chatId) throw new Error('Аккаунт WhatsApp по этому номеру не найден или недоступен для проверки');
      const chat = { id: String(result.chatId), phone: digits, name: `+${digits}`, messages: [], unread: 0 };
      commit([chat, ...chatsRef.current]);
      setSelected(chat.id); setNewChat(false); setPhone(''); setMobileChat(true);
    } catch (error) { setNewError(error.message); }
    finally { setNewBusy(false); }
  }

  async function sendMessage(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || !selected || sending) return;
    if (message.length > 4096) return setSendError('Максимум 4096 символов');
    setSending(true); setSendError('');
    try {
      const result = await request('send', credentials, { chatId: selected, message });
      const now = Date.now();
      commit(chatsRef.current.map(chat => chat.id === selected ? { ...chat, messages: [...chat.messages, { id: String(result.idMessage), text: message, outgoing: true, timestamp: now }] } : chat));
      setDraft('');
    } catch (error) { setSendError(error.message); }
    finally { setSending(false); }
  }

  useEffect(() => {
    if (!credentials) return;
    let active = true;
    let timer;
    async function poll() {
      if (!active) return;
      try {
        for (let count = 0; count < 12 && active; count++) {
          const envelope = await request('receive', credentials);
          if (!active || !envelope) break;
          const payload = envelope.body;
          const chatId = String(payload?.senderData?.chatId || '');
          const text = payload?.messageData?.typeMessage === 'textMessage'
            ? payload.messageData?.textMessageData?.textMessage
            : ['extendedTextMessage', 'quotedMessage'].includes(payload?.messageData?.typeMessage)
              ? payload.messageData?.extendedTextMessageData?.text
              : null;
          if (payload?.typeWebhook === 'incomingMessageReceived' && /^\d+@(c\.us|lid)$/.test(chatId) && typeof text === 'string') {
            const name = payload.senderData?.chatName || payload.senderData?.senderName || chatId;
            const phoneNumber = phoneFromId(chatId) || phoneFromId(payload.senderData?.sender);
            const current = chatsRef.current;
            const existing = current.find(chat => chat.id === chatId || (phoneNumber && chat.phone === phoneNumber));
            const id = String(payload.idMessage || `${chatId}:${payload.timestamp}:${text}`);
            if (!existing?.messages?.some(message => message.id === id)) {
              const item = { id, text, outgoing: false, timestamp: payload.timestamp ? payload.timestamp * 1000 : Date.now() };
              if (existing) commit(current.map(chat => chat.id === existing.id ? { ...chat, name: chat.phone ? chat.name : name, messages: [...chat.messages, item], unread: chat.unread + 1 } : chat));
              else commit([{ id: chatId, phone: phoneNumber, name, messages: [item], unread: 1 }, ...current]);
            }
          }
          await request('ack', credentials, { receiptId: envelope.receiptId });
        }
        if (active) setPollError('');
      } catch (error) { if (active) setPollError(error.message); }
      if (active) timer = setTimeout(poll, 3000);
    }
    poll();
    return () => { active = false; clearTimeout(timer); };
  }, [credentials]);

  useEffect(() => {
    if (!selected || !credentials) return;
    const current = chatsRef.current;
    if (current.some(chat => chat.id === selected && chat.unread)) commit(current.map(chat => chat.id === selected ? { ...chat, unread: 0 } : chat));
  }, [selected, chats, credentials]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selected, chats]);

  const ordered = [...chats].sort((a, b) => (b.messages.at(-1)?.timestamp || 0) - (a.messages.at(-1)?.timestamp || 0));
  const visible = ordered.filter(chat => `${chat.name} ${chat.phone}`.toLowerCase().includes(search.toLowerCase()));
  const activeChat = chats.find(chat => chat.id === selected);

  return <div className="app-shell">
    <div className="top-line" />
    <main className={`messenger ${mobileChat ? 'mobile-chat-open' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-mark"><BrandMark /></div>
          <div className="brand-text"><strong>WhatsApp</strong><span>Чат через GREEN-API</span></div>
          <button className="icon-button new-button" onClick={() => { setNewError(''); setNewChat(true); }} title="Новый чат" aria-label="Новый чат"><Plus size={22} /></button>
        </div>
        <div className="search-wrap"><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по чатам" aria-label="Поиск по чатам" /></div>
        <div className="sidebar-section"><span>ЧАТЫ</span><span>{chats.length}</span></div>
        <div className="chat-list">
          {visible.length ? visible.map(chat => {
            const last = chat.messages.at(-1);
            return <button key={chat.id} className={`chat-row ${selected === chat.id ? 'active' : ''}`} onClick={() => { setSelected(chat.id); setMobileChat(true); setSendError(''); }}>
              <Avatar name={chat.name} id={chat.id} />
              <span className="chat-row-main"><span className="chat-row-top"><strong>{chat.name}</strong><small>{last ? time(last.timestamp) : ''}</small></span><span className="chat-row-bottom"><span>{last ? `${last.outgoing ? 'Вы: ' : ''}${last.text}` : 'Начните переписку'}</span>{chat.unread > 0 && <b>{chat.unread}</b>}</span></span>
            </button>;
          }) : <div className="list-empty"><MessageCircle size={27} strokeWidth={1.5} /><p>{search ? 'Чаты не найдены' : 'Пока нет чатов'}</p><span>{search ? 'Попробуйте другой запрос' : 'Создайте первый чат по номеру телефона'}</span></div>}
        </div>
        <div className="sidebar-footer"><span className="connection-dot" /><span>{pollError ? 'Ошибка получения сообщений' : 'Подключено'}</span><button onClick={() => setMenu(!menu)} className="icon-button" title="Меню" aria-label="Меню"><MoreVertical size={19} /></button>{menu && <div className="popup-menu"><div>Инстанс {credentials?.idInstance}</div><button onClick={disconnect}><LogOut size={16} /> Отключиться</button></div>}</div>
      </aside>
      <section className="conversation">
        {activeChat ? <>
          <header className="conversation-header"><button className="icon-button back-button" onClick={() => setMobileChat(false)} aria-label="К списку чатов"><ArrowLeft size={21} /></button><Avatar name={activeChat.name} id={activeChat.id} /><div className="conversation-title"><strong>{activeChat.name}</strong><span>{activeChat.phone ? `+${activeChat.phone} · WhatsApp` : 'WhatsApp'}</span></div><span className="header-spacer" /><span className="header-badge"><span className="connection-dot" /> {pollError ? 'Нет связи' : 'Соединение активно'}</span></header>
          <div className="message-area"><div className="date-chip">{activeChat.messages.length ? new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' }).format(new Date(activeChat.messages[0].timestamp)) : 'Сегодня'}</div><div className="messages">{activeChat.messages.length ? activeChat.messages.map(message => <div key={message.id} className={`message-line ${message.outgoing ? 'outgoing' : 'incoming'}`}><div className="bubble"><div className="bubble-text">{message.text}</div><div className="bubble-meta">{time(message.timestamp)} {message.outgoing && <Check size={15} />}</div></div></div>) : <div className="first-message"><div className="first-message-icon"><MessageCircle size={25} /></div><strong>Начните разговор</strong><span>Напишите сообщение, и оно появится здесь.</span></div>}<div ref={bottomRef} /></div></div>
          <div className="composer-area">{sendError && <div className="inline-error">{sendError}</div>}{pollError && <div className="inline-warning">Не удалось получить ответы: {pollError}</div>}<form className="composer" onSubmit={sendMessage}><textarea value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form.requestSubmit(); } }} maxLength={4096} rows={1} placeholder="Напишите сообщение..." aria-label="Текст сообщения" /><button type="submit" disabled={!draft.trim() || sending} className="send-button" aria-label="Отправить сообщение"><Send size={20} fill="currentColor" /></button></form><div className="composer-hint">Enter — отправить · Shift + Enter — новая строка</div></div>
        </> : <div className="welcome-state"><div className="welcome-icon"><BrandMark large /></div><h1>Общайтесь просто.<br />Оставайтесь на связи.</h1><p>Выберите чат слева или начните новую переписку по номеру телефона.</p><button className="primary-button" onClick={() => setNewChat(true)}><Plus size={19} /> Новый чат</button><span className="welcome-note"><ShieldCheck size={15} /> Текстовые сообщения через GREEN-API</span></div>}
      </section>
    </main>

    {!credentials && <div className="overlay login-overlay"><div className="login-card"><div className="login-logo"><BrandMark /></div><div className="eyebrow">ВАШЕ ПРОСТРАНСТВО ДЛЯ ОБЩЕНИЯ</div><h1>Будьте на связи.</h1><p>Подключите WhatsApp инстанс GREEN-API и продолжайте разговор здесь.</p><form onSubmit={connect}><label>ID инстанса<input autoFocus inputMode="numeric" value={form.idInstance} onChange={e => setForm({ ...form, idInstance: e.target.value })} placeholder="Например, 1101234567" required /></label><label>API токен<div className="token-field"><input type={showToken ? 'text' : 'password'} value={form.apiTokenInstance} onChange={e => setForm({ ...form, apiTokenInstance: e.target.value })} placeholder="Введите apiTokenInstance" required /><button type="button" onClick={() => setShowToken(!showToken)}>{showToken ? 'Скрыть' : 'Показать'}</button></div></label><details className="advanced"><summary>Дополнительные настройки <ChevronDown size={15} /></summary><label>API URL<input type="url" value={form.apiUrl} onChange={e => setForm({ ...form, apiUrl: e.target.value })} placeholder="https://api.green-api.com" /><small>Укажите адрес из личного кабинета, если он отличается.</small></label></details>{connectError && <div className="form-error">{connectError}</div>}<button className="primary-button login-submit" disabled={connectBusy}>{connectBusy ? 'Подключение…' : <>Подключиться <ArrowRight size={18} /></>}</button></form><div className="login-footer"><LockKeyhole size={15} /> Токен хранится только до закрытия вкладки</div></div><div className="login-side"><div className="side-grain" /><div className="preview-card"><div className="preview-head"><span className="mini-avatar">A</span><div><strong>Ваш чат в WhatsApp</strong><small>простое общение</small></div><span className="mini-dot" /></div><div className="preview-body"><div className="preview-date">Сегодня</div><div className="preview-bubble left">Привет! Как дела? <small>12:41</small></div><div className="preview-bubble right">Всё отлично, спасибо! <small>12:42 ✓✓</small></div><div className="preview-bubble left">Рад это слышать 🙂 <small>12:42</small></div></div><div className="preview-input">Напишите сообщение… <Send size={15} /></div></div><div className="side-caption"><span className="caption-line" /> ПРОСТО. НАДЕЖНО. ЛИЧНО.</div></div></div>}

    {newChat && credentials && <div className="overlay modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setNewChat(false); }}><div className="modal"><button className="icon-button close-modal" onClick={() => setNewChat(false)} aria-label="Закрыть"><X size={21} /></button><div className="modal-icon"><Plus size={22} /></div><h2>Новый чат</h2><p>Введите номер собеседника в международном формате. Мы проверим его аккаунт в WhatsApp.</p><form onSubmit={createChat}><label>Номер телефона<input autoFocus type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 999 123-45-67" required /></label>{newError && <div className="form-error">{newError}</div>}<button className="primary-button" disabled={newBusy}>{newBusy ? 'Проверяем номер…' : <>Создать чат <ArrowRight size={18} /></>}</button></form><div className="modal-note"><CircleHelp size={15} /> Номер должен быть зарегистрирован в WhatsApp</div></div></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
