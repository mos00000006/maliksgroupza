import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./extras.css";
import "./phase-two.css";
import "./phase-three.css";
import "./phase-four.css";
import "./phase-five.css";
import "./phase-six.css";
import "./phase-seven.css";
import "./phase-eight.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maliks Group Hub",
  description:
    "Company projects, operations, approvals and performance in one place.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/maliks-group-app-icon.svg",
    shortcut: "/maliks-group-app-icon.svg",
    apple: "/maliks-group-app-icon.svg",
  },
  manifest: "/manifest.webmanifest",
  applicationName: "Maliks Group Hub",
  appleWebApp: {
    capable: true,
    title: "Maliks Group Hub",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
