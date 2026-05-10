import { redirect, notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';

export default async function ConsultingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  redirect(`/${lang}/services`);
}
