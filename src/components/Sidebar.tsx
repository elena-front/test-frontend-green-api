import { LogOut, MessageCircle, MoreVertical, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { messageTime } from '../lib/chats';
import type { Chat } from '../types';
import { Avatar } from './Avatar';
import { BrandMark } from './BrandMark';
import shared from '../styles/Shared.module.css';
import styles from './Sidebar.module.css';

interface Props {
  chats: Chat[];
  selected: string | null;
  instanceId: string;
  pollError: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDisconnect: () => void;
}

export function Sidebar({ chats, selected, instanceId, pollError, onSelect, onNewChat, onDisconnect }: Props) {
  const [search, setSearch] = useState('');
  const [menu, setMenu] = useState(false);
  const ordered = [...chats].sort((a, b) => (b.messages.at(-1)?.timestamp || 0) - (a.messages.at(-1)?.timestamp || 0));
  const visible = ordered.filter(chat => `${chat.name} ${chat.phone}`.toLowerCase().includes(search.toLowerCase()));
  return <aside className={styles.sidebar}>
    <div className={styles.header}>
      <div className={styles.brandMark}><BrandMark /></div>
      <div className={styles.brandText}><strong>WhatsApp</strong><span>Чат через GREEN-API</span></div>
      <button className={`${shared.iconButton} ${styles.newButton}`} onClick={onNewChat} title="Новый чат" aria-label="Новый чат"><Plus size={22} /></button>
    </div>
    <div className={styles.search}><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по чатам" aria-label="Поиск по чатам" /></div>
    <div className={styles.section}><span>ЧАТЫ</span><span>{chats.length}</span></div>
    <div className={styles.list}>
      {visible.length ? visible.map(chat => {
        const last = chat.messages.at(-1);
        return <button key={chat.id} className={`${styles.row} ${selected === chat.id ? styles.active : ''}`} onClick={() => onSelect(chat.id)}>
          <Avatar name={chat.name} id={chat.id} />
          <span className={styles.rowMain}><span className={styles.rowTop}><strong>{chat.name}</strong><small>{last ? messageTime(last.timestamp) : ''}</small></span><span className={styles.rowBottom}><span>{last ? `${last.outgoing ? 'Вы: ' : ''}${last.text}` : 'Начните переписку'}</span>{chat.unread > 0 && <b>{chat.unread}</b>}</span></span>
        </button>;
      }) : <div className={styles.empty}><MessageCircle size={27} strokeWidth={1.5} /><p>{search ? 'Чаты не найдены' : 'Пока нет чатов'}</p><span>{search ? 'Попробуйте другой запрос' : 'Создайте первый чат по номеру телефона'}</span></div>}
    </div>
    <div className={styles.footer}><span className={shared.connectionDot} /><span>{pollError ? 'Ошибка получения сообщений' : 'Подключено'}</span><button onClick={() => setMenu(!menu)} className={shared.iconButton} title="Меню" aria-label="Меню"><MoreVertical size={19} /></button>{menu && <div className={styles.popup}><div>Инстанс {instanceId}</div><button onClick={onDisconnect}><LogOut size={16} /> Отключиться</button></div>}</div>
  </aside>;
}
