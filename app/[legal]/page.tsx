import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteFooter } from "../components/site-footer";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

const legalPages: Record<
  string,
  { title: string; description: string; sections: LegalSection[] }
> = {
  "privacy-policy": {
    title: "Privacy Policy",
    description:
      "How Adwice Technologies Private Limited collects and uses information.",
    sections: [
      {
        title: "Introduction",
        paragraphs: [
          "Adwice Technologies Private Limited is committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your personal information.",
        ],
      },
      {
        title: "Information We Collect",
        items: [
          "Personal Information: Name, email, contact details, etc.",
          "Non-Personal Information: Browser type, IP address, and usage data collected via cookies.",
        ],
      },
      {
        title: "How We Use Your Information",
        items: [
          "To provide and improve our services.",
          "To communicate updates, offers, or promotions (with your consent).",
          "For compliance with legal and regulatory obligations.",
        ],
      },
      {
        title: "Sharing Your Information",
        paragraphs: [
          "We do not sell or share your personal information with third parties, except for:",
        ],
        items: [
          "Service providers assisting in delivering our services.",
          "Legal or regulatory authorities, if required by law.",
        ],
      },
      {
        title: "Your Rights",
        paragraphs: [
          "You have the right to access, modify, or delete your personal data. To exercise these rights, contact us at care@myadwice.com.",
        ],
      },
      {
        title: "Security",
        paragraphs: [
          "We implement robust security measures to protect your data. However, no method of transmission over the internet is 100% secure.",
        ],
      },
      {
        title: "Updates to Policy",
        paragraphs: [
          "This policy may be updated periodically. Continued use of our services indicates your acceptance of these changes.",
        ],
      },
    ],
  },
  "terms-of-service": {
    title: "Terms of Service",
    description: "The terms that apply to use of Adwice and its services.",
    sections: [
      {
        title: "Introduction",
        paragraphs: [
          "Welcome to Adwice Technologies Private Limited. By accessing or using our website, services, or products, you agree to be bound by these terms and conditions. Please read them carefully. If you disagree with any part, you must refrain from using our platform.",
        ],
      },
      {
        title: "Services",
        paragraphs: [
          "Adwice Technologies Private Limited features Adwice, an AI-driven platform that helps advertising agencies automate and optimize their digital marketing campaigns on Google Ads and Meta Ads. The tool simplifies the ad creation process, provides AI-powered keyword suggestions, and continuously optimizes campaigns for better performance. All services are subject to availability and confirmation.",
        ],
      },
      {
        title: "User Responsibilities",
        items: [
          "You agree to provide accurate and complete information during registration or transactions.",
          "You shall not misuse our platform or engage in unlawful activities while using our services.",
        ],
      },
      {
        title: "Intellectual Property",
        paragraphs: [
          "All content, trademarks, and intellectual property on our website are owned by or licensed to Adwice Technologies Private Limited. Unauthorized use, reproduction, or distribution is prohibited.",
        ],
      },
      {
        title: "Limitation of Liability",
        paragraphs: [
          "Adwice Technologies Private Limited shall not be held liable for any indirect, incidental, or consequential damages arising from the use of our services.",
        ],
      },
      {
        title: "Changes to Terms",
        paragraphs: [
          "We reserve the right to modify these terms at any time. Users will be notified of significant changes. Continued use constitutes acceptance of updated terms.",
        ],
      },
    ],
  },
  "cancellation-policy": {
    title: "Cancellation and Refund Policy",
    description:
      "Information on cancelling Adwice services and refund eligibility.",
    sections: [
      {
        title: "Cancellation Policy",
        items: [
          "Cancellations must be made in writing via email to care@myadwice.com.",
          "For service-based contracts, cancellations made within same day of agreement may incur a cancellation fee of 0%.",
        ],
      },
      {
        title: "Refund Policy",
        items: [
          "Refunds are processed within 7 days after approval.",
          "No refunds will be provided for completed services or software licenses already delivered/activated.",
          "For unused services, partial refunds may apply at our discretion.",
        ],
      },
      {
        title: "Non-Refundable Items",
        paragraphs: [
          "Certain products or services, such as custom software solutions or consulting fees, may be non-refundable.",
        ],
      },
    ],
  },
  "shipping-and-delivery": {
    title: "Shipping and Delivery Policy",
    description:
      "Shipping and delivery information for Adwice services and products.",
    sections: [
      {
        title: "Introduction",
        paragraphs: [
          "Welcome to Adwice Technologies Private Limited. By accessing or using our website, services, or products, you agree to be bound by these terms and conditions. Please read them carefully. If you disagree with any part, you must refrain from using our platform.",
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(legalPages).map((legal) => ({ legal }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ legal: string }>;
}): Promise<Metadata> {
  const { legal } = await params;
  const page = legalPages[legal];

  return page
    ? { title: `${page.title} | Adwice`, description: page.description }
    : {};
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ legal: string }>;
}) {
  const { legal } = await params;
  const page = legalPages[legal];
  if (!page) notFound();

  return (
    <>
      <header className="nav shell">
        <a className="brand" href="/">
          <Image
            src="/brand/adwice-with-text.svg"
            alt="Adwice"
            width={247}
            height={86}
          />
        </a>
        <nav>
          <a href="/#how">How it works</a>
          <a href="/#benefits">Why Adwice</a>
          <a href="/#contact">Contact</a>
        </nav>
        <a className="navCta" href="/#contact">
          Get started
        </a>
      </header>
      <main className="legalPage">
        <section className="legalHero">
          <div className="shell">
            <p className="sectionTag">Legal</p>
            <h1>{page.title}</h1>
            <p>{page.description}</p>
          </div>
        </section>
        <article className="legalContent shell">
          {page.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.items && (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
