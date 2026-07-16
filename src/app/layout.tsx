import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const dynamic = 'force-dynamic';

import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper";
import { getCurrentUser } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexus CRM",
  description: "CRM com automação de vendas via WhatsApp e Agente de IA",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-zinc-100 flex`}
      >
        <ClientLayoutWrapper user={user ? { name: user.name, role: user.role } : null}>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
