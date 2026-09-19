import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "../components/site-footer";
import { WhatsAppLink } from "../components/whatsapp-link";

export const metadata = {
  title: "Platform | Adwice",
  description:
    "AI-powered campaign creation, optimization, reporting, and platform management from Adwice.",
};

const features: [string, string, string[]][] = [
  ["AI Campaign Generator", "Enter a few lines about your business and goal. Our AI writes headlines, descriptions, keywords, and targeting — producing campaigns that normally take an expert hours to create.", ["Google Ads", "Meta Ads", "AI Copywriting"]],
  ["No Ad Account Required", "You don't need to create or verify a Google Ads or Meta Business account. We manage the technical infrastructure — you choose your goal and budget.", ["Fully Managed", "Zero Setup"]],
  ["Smart Audience Targeting", "Our AI matches your ads to the right people based on location, intent, interests, and behaviour to find customers most likely to convert.", ["Location Targeting", "Intent Signals", "Retargeting"]],
  ["Continuous Auto-Optimization", "Once live, campaigns are monitored and improved automatically. Underperforming ads are paused, winning variants are scaled, and budgets move toward what is working.", ["A/B Testing", "Bid Optimization", "Auto-Scaling"]],
  ["Google Business Profile Management", "Keep your Google listing accurate, manage business hours and photos, monitor reviews, and get AI-assisted response suggestions.", ["GBP Management", "Review Monitoring", "Local SEO"]],
  ["Clear Performance Reports", "Get weekly and monthly reports written in plain language. See leads, calls, clicks, and conversions your campaigns generated and what they cost.", ["Auto Reports", "Plain English", "White-label PDF"]],
  ["Multi-Platform in One Place", "Manage Google Ads, Meta Ads, and Google Business Profile from a single unified dashboard, without switching between platforms or learning multiple tools.", ["Unified Dashboard", "Google + Meta", "GBP"]],
  ["Review & Reputation Management", "Get notified when new reviews arrive, track your rating, respond from the dashboard, and use AI to craft a professional reply.", ["Real-time Alerts", "AI Replies", "Rating Tracking"]],
];

const platforms: [string, string, string, string[]][] = [
  ["Google Ads", "Search, Display & Call Campaigns", "Reach customers actively searching for what you offer. Our AI builds Search campaigns with the right keywords and bidding strategy, plus Display campaigns for brand awareness.", ["AI-generated search and negative keywords", "Responsive search ads with headline variants", "Call extensions for phone-first businesses", "Location targeting by city or radius", "Smart bidding to maximize conversions or clicks"]],
  ["Meta Ads", "Facebook & Instagram Campaigns", "Reach ideal customers on Facebook and Instagram using powerful audience targeting. Our AI creates compelling ad copy and selects the right placements, objectives, and audiences.", ["Facebook Feed, Stories, and Reels placements", "Instagram Feed and Stories ads", "Lookalike and interest-based targeting", "Retarget website visitors and past customers", "Lead generation and traffic objectives"]],
  ["Google Business Profile", "Local Search & Maps Visibility", "Your Google Business Profile is often the first thing potential customers see. We keep it accurate, optimized, and actively managed for stronger local visibility.", ["Business information, hours, address, and photos", "Post updates, offers, and events to GBP", "Monitor and respond to reviews in one place", "Track views, calls, and direction requests", "AI-assisted review response suggestions"]],
  ["Social Media Management", "Facebook & Instagram Content", "Create, edit, review, and schedule your Facebook and Instagram posts through one clear workflow, so your content stays consistent and ready to publish.", ["Content creation and editing", "Simple review and approval", "Scheduled Facebook and Instagram posts", "A consistent publishing rhythm"]],
];

export default function PlatformPage() {
  return (
    <main className="platformPage">
      <header className="nav shell">
        <Link className="brand" href="/" aria-label="Adwice home">
          <Image src="/brand/adwice-with-text.svg" alt="Adwice" width={247} height={86} />
        </Link>
        <nav aria-label="Main navigation">
          <a href="/#how">How it works</a>
          <a href="/#benefits">Why Adwice</a>
          <a href="/platform">Features</a>
          <a href="/#contact">Contact</a>
        </nav>
        <div className="navActions">
          <WhatsAppLink />
          <Link className="navCta" href="/#contact">Get started</Link>
        </div>
      </header>

      <section className="platformHero">
        <div className="shell">
          <p className="eyebrow"><i /> AI-powered advertising platform</p>
          <h1>Everything you need to <span>grow.</span></h1>
          <p className="heroCopy">Plan, launch, optimize, and understand your advertising in one focused platform.</p>
          <div className="actions">
            <Link className="button primary" href="/#contact">Get started <b>↗</b></Link>
            <a className="button secondary" href="/#how">See how it works</a>
          </div>
        </div>
      </section>

      <section className="platformFeatures" id="features"><div className="shell">
        <p className="sectionTag">Features</p><h2>One platform. Every tool you need to grow.</h2><p className="platformSectionIntro">Whether you&apos;re a business owner with zero marketing experience or an agency managing 50 clients, Adwice gives you everything in one place.</p>
        <div className="platformFeatureGrid">{features.map(([title, copy, tags], index) => <article key={title} className={index === 0 ? "featured" : ""}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p><div>{tags.map((tag) => <b key={tag}>{tag}</b>)}</div></article>)}</div>
      </div></section>

      <section className="platformsCover" id="platforms"><div className="shell">
        <p className="sectionTag">Platforms we cover</p><h2>Everything under one roof.</h2><p className="platformSectionIntro">We handle the complexity of the major platforms so you never have to log into each one.</p>
        <div className="platformCoverGrid">{platforms.map(([name, type, copy, items], index) => <article key={name}><div className={`platformBadge badge${index + 1}`}>{index === 0 ? "G" : index === 1 ? "M" : index === 2 ? "⌖" : "↗"}</div><div><h3>{name}</h3><small>{type}</small></div><p>{copy}</p><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
      </div></section>
      <SiteFooter />
    </main>
  );
}
