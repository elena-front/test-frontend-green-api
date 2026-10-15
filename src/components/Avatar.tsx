import styles from './Avatar.module.css';

const colors = ['#7596b6', '#8c9dc3', '#8aae9e', '#bd9f88', '#9d91b6'];
const colorOf = (value: string) => colors[[...value].reduce((n, c) => n + c.charCodeAt(0), 0) % colors.length];

export function Avatar({ name, id }: { name: string; id: string }) {
  return <span className={styles.avatar} style={{ backgroundColor: colorOf(id) }}>{(name || '?').replace(/^\+/, '').slice(0, 2).toUpperCase()}</span>;
}
