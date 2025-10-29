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
    default: "MacOS Icon Generator | Online MacOS App Icon Tool",
    template: "%s | MacOS Icon Generator",
  },
  description:
    "Upload artwork and instantly export a full MacOS iconset, Retina-ready PNGs, and ICNS files directly in the browser.",
  keywords: [
    "MacOS icon generator",
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
    title: "MacOS Icon Generator | Export MacOS Icons Online",
    description:
      "Create professional MacOS app icons online. Generate .iconset bundles, ICNS files, and Retina PNG previews in seconds.",
    url: siteUrl,
    siteName: "MacOS Icon Generator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MacOS Icon Generator",
    description:
      "Generate MacOS app icons, Retina assets, and ICNS files right in your browser.",
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
            name: "MacOS Icon Generator",
            url: siteUrl.href,
            applicationCategory: "DesignApplication",
            operatingSystem: "MacOS",
            description:
              "Online MacOS icon generator that exports iconset zips, ICNS files, and Retina-ready PNG previews.",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            keywords: "MacOS icon generator, ICNS converter, mac app icon maker",
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
