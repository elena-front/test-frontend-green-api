import { useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { ArrowRight, ChevronDown, LockKeyhole, Send } from 'lucide-react';
import type { Credentials } from '../types';
import { BrandMark } from './BrandMark';
import shared from '../styles/Shared.module.css';
import styles from './LoginScreen.module.css';

interface Props {
  form: Credentials;
  setForm: Dispatch<SetStateAction<Credentials>>;
  busy: boolean;
  error: string;
  onConnect: (event: FormEvent<HTMLFormElement>) => void;
}

export function LoginScreen({ form, setForm, busy, error, onConnect }: Props) {
  const [showToken, setShowToken] = useState(false);
  return <div className={styles.overlay}><div className={styles.card}><div className={styles.logo}><BrandMark /></div><div className={styles.eyebrow}>ВАШЕ ПРОСТРАНСТВО ДЛЯ ОБЩЕНИЯ</div><h1>Будьте на связи.</h1><p>Подключите WhatsApp инстанс GREEN-API и продолжайте разговор здесь.</p><form onSubmit={onConnect}><label>ID инстанса<input autoFocus inputMode="numeric" value={form.idInstance} onChange={e => setForm(current => ({ ...current, idInstance: e.target.value }))} placeholder="Например, 1101234567" required /></label><label>API токен<div className={styles.tokenField}><input type={showToken ? 'text' : 'password'} value={form.apiTokenInstance} onChange={e => setForm(current => ({ ...current, apiTokenInstance: e.target.value }))} placeholder="Введите apiTokenInstance" required /><button type="button" onClick={() => setShowToken(!showToken)}>{showToken ? 'Скрыть' : 'Показать'}</button></div></label><details className={styles.advanced}><summary>Дополнительные настройки <ChevronDown size={15} /></summary><label>API URL<input type="url" value={form.apiUrl} onChange={e => setForm(current => ({ ...current, apiUrl: e.target.value }))} placeholder="https://api.green-api.com" /><small>Укажите адрес из личного кабинета, если он отличается.</small></label></details>{error && <div className={shared.formError}>{error}</div>}<button className={`${shared.primaryButton} ${styles.submit}`} disabled={busy}>{busy ? 'Подключение…' : <>Подключиться <ArrowRight size={18} /></>}</button></form><div className={styles.footer}><LockKeyhole size={15} /> Токен хранится только до закрытия вкладки</div></div><div className={styles.side}><div className={styles.grain} /><div className={styles.preview}><div className={styles.previewHead}><span className={styles.miniAvatar}>A</span><div><strong>Ваш чат в WhatsApp</strong><small>простое общение</small></div><span className={styles.miniDot} /></div><div className={styles.previewBody}><div className={styles.previewDate}>Сегодня</div><div className={styles.previewBubble}>Привет! Как дела? <small>12:41</small></div><div className={`${styles.previewBubble} ${styles.right}`}>Всё отлично, спасибо! <small>12:42 ✓✓</small></div><div className={styles.previewBubble}>Рад это слышать 🙂 <small>12:42</small></div></div><div className={styles.previewInput}>Напишите сообщение… <Send size={15} /></div></div><div className={styles.caption}><span /> ПРОСТО. НАДЕЖНО. ЛИЧНО.</div></div></div>;
}
