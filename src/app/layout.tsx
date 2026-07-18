import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reclaim AI — Screen Time & Habit Reduction Companion",
  description:
    "A calm, AI-powered behaviour-change companion that helps you understand why you return to harmful habits and guides you back to real-world meaning.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} h-full`}>
      <body
        className="min-h-full flex flex-col pb-20 md:pb-0"
        style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
      >
        <Navigation />
        <main className="flex-1 w-full">{children}</main>
      </body>
    </html>
  );
}
