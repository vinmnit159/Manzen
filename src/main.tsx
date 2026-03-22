import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/index.css';

// Apply saved theme preference early to avoid a flash of wrong theme
const savedTheme = localStorage.getItem('manzen.theme');
if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(<App />);
