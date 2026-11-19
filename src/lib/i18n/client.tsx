'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Locale } from './config'
import { dictionaries, type Dictionary } from './dictionaries'

const I18nContext = createContext<{ locale: Locale; t: Dictionary } | null>(null)

/** Provided once in the root layout; Client Components call useI18n(). */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <I18nContext value={{ locale, t: dictionaries[locale] }}>{children}</I18nContext>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
