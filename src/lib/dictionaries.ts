import 'server-only';
import en from '@/i18n/dictionaries/en.json';
import fr from '@/i18n/dictionaries/fr.json';
import ar from '@/i18n/dictionaries/ar.json';
import type { Locale } from '@/i18n/config';

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = {
  en,
  fr: fr as Dictionary,
  ar: ar as Dictionary,
};

export function getDictionary(lang: Locale): Dictionary {
  return dictionaries[lang];
}
