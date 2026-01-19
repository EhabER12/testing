import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/request";
import ConditionalLayout from "@/components/Layout/ConditionalLayout";
import { fetchSettings } from "@/lib/settings";
import { NavigationProgress } from "@/components/NavigationProgress";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const settings = await fetchSettings();
  const data = settings.data || {};

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <NavigationProgress />
      <div dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen" suppressHydrationWarning>
        <ConditionalLayout settings={data}>{children}</ConditionalLayout>
      </div>
    </NextIntlClientProvider>
  );
}
