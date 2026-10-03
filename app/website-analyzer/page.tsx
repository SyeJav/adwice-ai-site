import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "../components/site-footer";
import { MobileMenu } from "../components/mobile-menu";
import { WhatsAppLink } from "../components/whatsapp-link";
import { AnalyzerForm } from "./ui";

export const metadata: Metadata = {
  title: "Free Website Quality Analyzer | Adwice",
  description: "Check your website's health, SEO, customer experience, Google Ads readiness, and lead conversion opportunities for free.",
  alternates: { canonical: "https://myadwice.com/website-analyzer" },
};

const items = ["Website health", "User experience", "Search readiness", "Google Ads fit", "Lead conversion", "Mobile performance", "Trust signals"];

export default function WebsiteAnalyzerPage() {
  return <main className="analyzerPage">
    <header className="nav shell analyzerNav">
      <Link className="brand" href="/" aria-label="Adwice home"><Image src="/brand/adwice-with-text.svg" alt="Adwice" width={247} height={86} /></Link>
      <nav aria-label="Main navigation"><Link href="/platform">Features</Link><Link href="/#how">How it works</Link><Link href="/#contact">Contact</Link></nav>
      <div className="navActions">
        <WhatsAppLink />
        <Link className="navCta" href="/#contact">Plan a campaign</Link>
        <MobileMenu
          links={[
            { label: "Features", href: "/platform" },
            { label: "How it works", href: "/#how" },
            { label: "Contact", href: "/#contact" },
          ]}
          action={{ label: "Plan a campaign", href: "/#contact" }}
        />
      </div>
    </header>
    <section className="analyzerHero">
      <div className="shell analyzerHeroInner">
        <div className="analyzerHeroCopy">
          <p className="sectionTag"><span className="analyzerPulse" /> Free website review</p>
          <h1>Is your website ready for <span>more customers?</span></h1>
          <p className="analyzerIntro">Get a practical review of your website, search visibility, advertising fit, and ways to turn visits into leads.</p>
          <ul className="analyzerChecks">{items.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul>
        </div>
        <AnalyzerForm />
      </div>
      <div className="analyzerHeroNote shell"><span>↳</span> No account or email needed · Usually ready in about a minute</div>
    </section>
    <section className="analyzerHow shell">
      <div><p className="sectionTag">A clearer next step</p><h2>Understand what to improve first.</h2><p>We look at the things that matter to a customer: can they understand what you offer, trust your business, and take the next step?</p></div>
      <div className="analyzerSteps"><article><b>01</b><div><h3>Enter a website</h3><p>Share a public homepage. We’ll review a few of its most important pages.</p></div></article><article><b>02</b><div><h3>Get a useful report</h3><p>See a clear score, evidence from your pages, and practical priorities.</p></div></article><article><b>03</b><div><h3>Choose your next move</h3><p>Improve your website or continue into an Adwice campaign plan.</p></div></article></div>
    </section>
    <section className="analyzerPromise"><div className="shell"><span>ADWICE WEBSITE ANALYZER</span><p>Built for business owners. Grounded in what your website actually says.</p><Link href="/#planner">Plan my campaign <b>↗</b></Link></div></section>
    <SiteFooter />
  </main>;
}
