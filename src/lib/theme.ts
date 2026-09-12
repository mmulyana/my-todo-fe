export type Theme = 'dark' | 'light'

export const THEME_KEY = 'mytodo-theme'

export function getStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // note: abaikan kalau localStorage diblokir (mode private/browser nolak akses)
  }
}
