import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono, Tiro_Devanagari_Sanskrit } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "GRAHA — Read Your Universe",
  description:
    "An immersive Vedic astrology learning platform. Compute your natal chart, explore planetary placements in 3D, and learn through your own kundli.",
  keywords: ["vedic astrology", "kundli", "birth chart", "jyotish", "graha", "planets", "learn astrology"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hankenGrotesk.variable} ${ibmPlexMono.variable} ${tiroDevanagari.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
