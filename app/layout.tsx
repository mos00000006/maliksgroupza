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
import "./mobile-improvements.css";
import "./launch-splash.css";
import LaunchSplash from "./launch-splash";

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
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
  icons: {
    icon: [
      { url: "/powerbuild-app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/powerbuild-app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/powerbuild-app-icon-192.png",
    apple: [
      { url: "/powerbuild-app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/powerbuild-app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  applicationName: "PowerBuild Hub",
  appleWebApp: {
    capable: true,
    title: "PowerBuild Hub",
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
        <LaunchSplash />
        {children}
      </body>
    </html>
  );
}
