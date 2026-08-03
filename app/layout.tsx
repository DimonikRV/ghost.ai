import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
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
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased" suppressHydrationWarning><ClerkProvider
          afterSignOutUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL}
          appearance={{
            theme: dark,
            variables: {
              colorBackground: "var(--card)",
              colorPrimary: "var(--color-accent-brand)",
              colorPrimaryForeground: "var(--primary-foreground)",
              colorForeground: "var(--foreground)",
              colorInput: "var(--card)",
              colorInputForeground: "var(--foreground)",
              colorMutedForeground: "var(--muted-foreground)",
              colorDanger: "var(--destructive)",
              colorBorder: "var(--border)",
            },
          }}>
          {children}
        </ClerkProvider></body>
    </html>
  );
}
