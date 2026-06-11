import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { EditorShell } from "@/components/editor/editor-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ghost Pilot",
  description: "Ghost pilot project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
        <body className="antialiased">
          <EditorShell>{children}</EditorShell>
        </body>
      </html>
    </ClerkProvider>
  );
}
