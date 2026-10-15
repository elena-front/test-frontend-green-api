import type { FormEvent } from 'react';
import { ArrowRight, CircleHelp, Plus, X } from 'lucide-react';
import shared from '../styles/Shared.module.css';
import styles from './NewChatModal.module.css';

interface Props {
  phone: string;
  error: string;
  busy: boolean;
  onPhone: (value: string) => void;
  onClose: () => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
}

export function NewChatModal({ phone, error, busy, onPhone, onClose, onCreate }: Props) {
  return <div className={styles.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className={styles.modal}><button className={`${shared.iconButton} ${styles.close}`} onClick={onClose} aria-label="Закрыть"><X size={21} /></button><div className={styles.icon}><Plus size={22} /></div><h2>Новый чат</h2><p>Введите номер собеседника в международном формате. Мы проверим его аккаунт в WhatsApp.</p><form onSubmit={onCreate}><label>Номер телефона<input autoFocus type="tel" inputMode="tel" value={phone} onChange={e => onPhone(e.target.value)} placeholder="+7 999 123-45-67" required /></label>{error && <div className={shared.formError}>{error}</div>}<button className={shared.primaryButton} disabled={busy}>{busy ? 'Проверяем номер…' : <>Создать чат <ArrowRight size={18} /></>}</button></form><div className={styles.note}><CircleHelp size={15} /> Номер должен быть зарегистрирован в WhatsApp</div></div></div>;
}
