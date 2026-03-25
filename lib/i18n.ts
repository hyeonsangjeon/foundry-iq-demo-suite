// lib/i18n.ts
export type Locale = 'en' | 'ko' | 'zh' | 'ja' | 'hi'

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  ko: '한국어',
  zh: '中文',
  ja: '日本語',
  hi: 'हिन्दी',
}

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem('locale') as Locale) || 'en'
}

export function setLocale(locale: Locale) {
  localStorage.setItem('locale', locale)
  window.location.reload()
}
