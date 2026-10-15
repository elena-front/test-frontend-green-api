import { MessageCircle, Phone } from 'lucide-react';
import styles from './BrandMark.module.css';

export function BrandMark({ large = false }: { large?: boolean }) {
  return <span className={`${styles.mark} ${large ? styles.large : ''}`} aria-hidden="true"><MessageCircle className={styles.bubble} strokeWidth={2.4} /><Phone className={styles.phone} strokeWidth={2.7} /></span>;
}
