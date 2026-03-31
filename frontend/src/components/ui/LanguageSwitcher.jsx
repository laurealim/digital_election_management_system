import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation()
  const current  = i18n.language?.startsWith('bn') ? 'bn' : 'en'

  function toggle() {
    i18n.changeLanguage(current === 'en' ? 'bn' : 'en')
  }

  return (
    <button
      onClick={toggle}
      className={`text-xs font-medium px-2 py-1 rounded border border-border hover:bg-muted/50 transition-colors tabular-nums ${className}`}
      title="Switch language / ভাষা পরিবর্তন"
    >
      {current === 'en' ? 'বাংলা' : 'EN'}
    </button>
  )
}
