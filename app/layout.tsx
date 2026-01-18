import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "OrbIIIT",
  description: "OrbIIIT - IIIT Campus Management Application",
  manifest: "/manifest.json",
  keywords: ["IIIT", "campus", "management", "app"],
  authors: [{ name: "OrbIIIT" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OrbIIIT",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-title" content="OrbIIIT" />
      </head>
      <body className="min-h-screen bg-background">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}