import type { Metadata } from "next";
import "./globals.css";

import { SiteHeader } from "@/components";
import { SiteFooter } from "@/components/layout/site-footer";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        style={
          {
            "--font-geist-sans": '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
            "--font-playfair": '"Georgia", "Times New Roman", serif',
            "--font-great-vibes": '"Brush Script MT", "Lucida Handwriting", cursive',
          } as React.CSSProperties
        }
      >
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
