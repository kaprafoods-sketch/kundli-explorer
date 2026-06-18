import type { Metadata } from "next";
import { Cormorant } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kundli Explorer — Learn astrology through your own chart",
  description:
    "An educational Vedic astrology tool. Compute your natal chart, understand every placement, and ask an AI tutor grounded in your real kundli.",
  keywords: ["vedic astrology", "kundli", "birth chart", "jyotish", "learn astrology"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
