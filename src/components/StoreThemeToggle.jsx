import { Moon, Sun } from 'lucide-react'

export default function StoreThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      className="store-theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className={`theme-toggle-track ${isDark ? 'dark' : 'light'}`}>
        <span className="theme-toggle-thumb">{isDark ? <Moon size={13}/> : <Sun size={13}/>}</span>
      </span>
      <span className="theme-toggle-label">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  )
}

export function getStoredStoreTheme() {
  try { return localStorage.getItem('orbit-store-theme') || 'dark' }
  catch { return 'dark' }
}

export function saveStoreTheme(theme) {
  try { localStorage.setItem('orbit-store-theme', theme) }
  catch { /* ignore */ }
}
