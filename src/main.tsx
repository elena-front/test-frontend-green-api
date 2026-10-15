import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Корневой элемент приложения не найден');
createRoot(root).render(<App />);
