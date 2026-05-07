import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiseForge",
  description: "A dynamic pre-production workspace for AI filmmakers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
