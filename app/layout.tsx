import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LexiFlow",
  description: "Read any document. Understand every word."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
