import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['pt-BR', 'es-PY'],
  defaultLocale: 'pt-BR',
});

export type Locale = (typeof routing.locales)[number];
