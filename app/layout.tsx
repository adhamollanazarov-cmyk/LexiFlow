import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LexiFlowAI - Private PDF Reader for Language Learners",
  description:
    "Read English PDFs without getting stuck. Click difficult words, get translation and AI explanation, save vocabulary, and review later. Your document stays on your device."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
