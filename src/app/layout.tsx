import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = new URL("https://icon.msgbyte.com");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "macOS Icon Generator | Online macOS App Icon Tool",
    template: "%s | macOS Icon Generator",
  },
  description:
    "Upload artwork and instantly export a full macOS iconset, Retina-ready PNGs, and ICNS files directly in the browser.",
  keywords: [
    "macOS icon generator",
    "mac app icon",
    "icns converter",
    "app icon maker",
    "mac iconset",
    "macos app design",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "macOS Icon Generator | Export macOS Icons Online",
    description:
      "Create professional macOS app icons online. Generate .iconset bundles, ICNS files, and Retina PNG previews in seconds.",
    url: siteUrl,
    siteName: "macOS Icon Generator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "macOS Icon Generator",
    description:
      "Generate macOS app icons, Retina assets, and ICNS files right in your browser.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://app.tianji.dev/tracker.js"
          data-website-id="cmg1av4vwmvbujs84nnu211ro"
          strategy="afterInteractive"
          defer
        />
        <Script id="structured-data" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "macOS Icon Generator",
            url: siteUrl.href,
            applicationCategory: "DesignApplication",
            operatingSystem: "macOS",
            description:
              "Online macOS icon generator that exports iconset zips, ICNS files, and Retina-ready PNG previews.",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            keywords: "macOS icon generator, ICNS converter, mac app icon maker",
          })}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
