import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono, Tiro_Devanagari_Sanskrit, Noto_Sans_Devanagari, Marcellus } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { LANG_COOKIE, DEFAULT_LANG, htmlLang, isLang } from "@/lib/i18n/config";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const tiroDevanagari = Tiro_Devanagari_Sanskrit({
  variable: "--font-tiro",
  subsets: ["devanagari", "latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

// Sans Devanagari for UI chrome in Hindi — appended to the font stacks in
// globals.css so Devanagari glyphs render everywhere (no missing-glyph boxes).
const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-deva",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Graha — Read Your Universe",
  description:
    "An immersive Vedic astrology learning platform. Compute your natal chart, explore planetary placements in 3D, and learn through your own kundli.",
  keywords: ["vedic astrology", "kundli", "birth chart", "jyotish", "graha", "planets", "learn astrology"],
  openGraph: {
    title: "Graha — Read Your Universe",
    description: "Compute your natal chart, explore planetary placements in 3D, and learn Vedic astrology through your own kundli.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A1020",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieLang = (await cookies()).get(LANG_COOKIE)?.value;
  const lang = isLang(cookieLang) ? cookieLang : DEFAULT_LANG;

  return (
    <html
      lang={htmlLang(lang)}
      className={`${fraunces.variable} ${hankenGrotesk.variable} ${ibmPlexMono.variable} ${tiroDevanagari.variable} ${notoDevanagari.variable} ${marcellus.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
