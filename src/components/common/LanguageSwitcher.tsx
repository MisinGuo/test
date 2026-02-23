'use client'

import { useState } from 'react'
import { useLocale } from '@/contexts/LocaleContext'
import { Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/config/types'

const languageNames: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  'en-US': 'English',
}

const languageFlags: Record<Locale, string> = {
  'zh-TW': '🇹🇼',
  'zh-CN': '🇨🇳',
  'en-US': '🇺🇸',
}

export function LanguageSwitcher() {
  const { locale, setLocale, localeConfig } = useLocale()
  const [open, setOpen] = useState(false)

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 px-0 text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Globe className="h-5 w-5" />
          <span className="sr-only">切换语言</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-slate-900 border-slate-800">
        {(Object.keys(languageNames) as Locale[]).map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => handleLocaleChange(lang)}
            className={`cursor-pointer ${
              locale === lang
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="mr-2">{languageFlags[lang]}</span>
            {languageNames[lang]}
            {locale === lang && (
              <span className="ml-auto text-blue-400">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
