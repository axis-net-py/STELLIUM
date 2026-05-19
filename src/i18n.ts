import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  const loc = locale as string;
  if (!['pt-BR', 'es-PY'].includes(loc)) notFound();

  return {
    locale: loc,
    messages: (await import(`../messages/${loc}.json`)).default,
  };
});
