"use client";

import { SessionProvider } from "next-auth/react";
import { useLanguage } from "@/components/language-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="container mx-auto px-4 py-8 flex-1">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  );
} 