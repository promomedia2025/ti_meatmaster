import type React from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark notranslate" translate="no">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} notranslate`}
        translate="no"
      >
        {children}
      </body>
    </html>
  );
}
