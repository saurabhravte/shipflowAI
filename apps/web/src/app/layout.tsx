import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ShipFlow AI — Ship, reviewed.",
    template: "%s · ShipFlow AI",
  },
  description:
    "AI code review that reads your whole repo, catches real bugs, and drives every feature request from request to merged PR. Bring your own API key.",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${geistSans.variable} ${geistMono.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
