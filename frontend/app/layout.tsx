import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SocraticAI",
  description: "Responsible AI reasoning coach for beginner coding students.",
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
