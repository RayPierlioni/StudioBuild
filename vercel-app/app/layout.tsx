import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { LaunchAnalytics } from "./launch-analytics";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "MiseForge",
  title: "MiseForge",
  description: "A dynamic pre-production workspace for AI filmmakers.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MiseForge",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#121416",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <LaunchAnalytics />
        <Analytics mode="production" />
      </body>
    </html>
  );
}
