export type Theme = 'dark' | 'light'

export const THEME_KEY = 'mytodo-theme'

// note: samakan dengan --bg di index.css
const THEME_COLORS: Record<Theme, string> = { dark: '#1c1a1f', light: '#ededef' }

export function getStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[theme])
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // note: abaikan kalau localStorage diblokir (mode private/browser nolak akses)
  }
}
