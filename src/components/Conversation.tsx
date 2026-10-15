import { useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Check, MessageCircle, Plus, Send, ShieldCheck } from 'lucide-react';
import type { Chat } from '../types';
import { messageTime } from '../lib/chats';
import { Avatar } from './Avatar';
import { BrandMark } from './BrandMark';
import shared from '../styles/Shared.module.css';
import styles from './Conversation.module.css';

interface Props {
  chat?: Chat;
  draft: string;
  sending: boolean;
  sendError: string;
  pollError: string;
  onDraft: (value: string) => void;
  onSend: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  onNewChat: () => void;
}

export function Conversation({ chat, draft, sending, sendError, pollError, onDraft, onSend, onBack, onNewChat }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);
  return <section className={styles.conversation}>
    {chat ? <>
      <header className={styles.header}><button className={`${shared.iconButton} ${styles.backButton}`} onClick={onBack} aria-label="К списку чатов"><ArrowLeft size={21} /></button><Avatar name={chat.name} id={chat.id} /><div className={styles.title}><strong>{chat.name}</strong><span>{chat.phone ? `+${chat.phone} · WhatsApp` : 'WhatsApp'}</span></div><span className={styles.headerSpacer} /><span className={styles.headerBadge}><span className={shared.connectionDot} /> {pollError ? 'Нет связи' : 'Соединение активно'}</span></header>
      <div className={styles.messageArea}><div className={styles.dateChip}>{chat.messages.length ? new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' }).format(new Date(chat.messages[0].timestamp)) : 'Сегодня'}</div><div className={styles.messages}>{chat.messages.length ? chat.messages.map(message => <div key={message.id} className={`${styles.messageLine} ${message.outgoing ? styles.outgoing : styles.incoming}`}><div className={styles.bubble}><div className={styles.bubbleText}>{message.text}</div><div className={styles.bubbleMeta}>{messageTime(message.timestamp)} {message.outgoing && <Check size={15} />}</div></div></div>) : <div className={styles.firstMessage}><div className={styles.firstMessageIcon}><MessageCircle size={25} /></div><strong>Начните разговор</strong><span>Напишите сообщение, и оно появится здесь.</span></div>}<div ref={bottomRef} /></div></div>
      <div className={styles.composerArea}>{sendError && <div className={styles.error}>{sendError}</div>}{pollError && <div className={styles.warning}>Не удалось получить ответы: {pollError}</div>}<form className={styles.composer} onSubmit={onSend}><textarea value={draft} onChange={e => onDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} maxLength={4096} rows={1} placeholder="Напишите сообщение..." aria-label="Текст сообщения" /><button type="submit" disabled={!draft.trim() || sending} className={styles.sendButton} aria-label="Отправить сообщение"><Send size={20} fill="currentColor" /></button></form><div className={styles.hint}>Enter — отправить · Shift + Enter — новая строка</div></div>
    </> : <div className={styles.welcome}><div className={styles.welcomeIcon}><BrandMark large /></div><h1>Общайтесь просто.<br />Оставайтесь на связи.</h1><p>Выберите чат слева или начните новую переписку по номеру телефона.</p><button className={shared.primaryButton} onClick={onNewChat}><Plus size={19} /> Новый чат</button><span className={styles.welcomeNote}><ShieldCheck size={15} /> Текстовые сообщения через GREEN-API</span></div>}
  </section>;
}
