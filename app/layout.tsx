import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Adwice | AI-Powered Google & Meta Advertising",
  description:
    "Plan, launch, optimize, and report on Google and Meta campaigns with AI—built for growing businesses and white-label agencies.",
  keywords: [
    "AI advertising platform",
    "Google Ads management",
    "Meta Ads management",
    "white-label agency platform",
  ],
  alternates: { canonical: "https://myadwice.com/" },
  openGraph: {
    title: "Adwice — Turn ad spend into business growth",
    description:
      "AI-powered Google and Meta advertising for businesses and agencies.",
    type: "website",
    url: "https://myadwice.com/",
    siteName: "Adwice",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adwice — AI Advertising",
    description:
      "AI-powered Google and Meta advertising for businesses and agencies.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Adwice",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "AI-powered Google and Meta advertising for businesses and agencies.",
  url: "https://myadwice.com/",
  provider: {
    "@type": "Organization",
    name: "Adwice Technologies Private Limited",
    url: "https://myadwice.com/",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        {children}
      </body>
    </html>
  );
}
