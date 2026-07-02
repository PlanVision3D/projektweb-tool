import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Projektweb-Tool – Neubau-Webseiten-Generator",
  description: "Aus Google-Sheets-Projektdaten automatisch professionelle Neubau-Projektwebseiten generieren.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Poppins:wght@400;500;600;700&family=Inter:wght@400;450;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
