"use client";
import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { adwicePlans } from "../config/adwice-plans";
type Audience = "business" | "agency";
type Platform = "search" | "meta" | "both";
type Currency = "USD" | "INR";
const content = {
  business: {
    eyebrow: "AI advertising for growing businesses",
    title: "Turn your budget into",
    accent: "real customers.",
    copy: "Adwice plans, launches, and improves your Google and Meta campaigns—while you stay in control of every decision.",
    secondary: "See how it works",
    proof: [
      "Google + Meta in one place",
      "Approve before anything goes live",
      "Clear reporting, without jargon",
    ],
    outcome: "More calls, leads, bookings, and sales",
    outcomeCopy:
      "Choose the business result you need. Adwice turns your website, offer, audience, and budget into a focused campaign plan.",
    steps: [
      [
        "01",
        "Share your goal",
        "Tell us what you sell, where you sell it, and the result you want.",
      ],
      [
        "02",
        "Review the strategy",
        "See the campaign, targeting, creative, and budget before launch.",
      ],
      [
        "03",
        "Launch and improve",
        "Track meaningful results while Adwice finds waste and opportunities.",
      ],
    ],
    benefits: [
      [
        "One clear plan",
        "Google Ads, Meta Ads, and local presence aligned to one business goal.",
      ],
      [
        "AI with your approval",
        "Recommendations are explained in plain language before changes are applied.",
      ],
      [
        "Reports that answer ‘is it working?’",
        "See leads, calls, sales, cost, and next actions—not a wall of metrics.",
      ],
    ],
    ctaTitle: "Ready to make your ad budget work harder?",
    ctaCopy: "Choose your advertising platform and monthly ad spend to begin.",
  },
  agency: {
    eyebrow: "White-label AI advertising for agencies",
    title: "Serve more clients.",
    accent: "Protect your margin.",
    copy: "Run Google and Meta campaigns across every client from one branded platform—without adding the same amount of operational work.",
    secondary: "Explore agency workflow",
    proof: [
      "Your brand and domain",
      "Multi-client operations",
      "Approval-ready client reporting",
    ],
    outcome: "Scale delivery without scaling overhead",
    outcomeCopy:
      "Standardize onboarding, campaign creation, approvals, optimization, and reporting while your team owns the client relationship.",
    steps: [
      [
        "01",
        "Brand your platform",
        "Use your logo, colours, domain, and client-facing experience.",
      ],
      [
        "02",
        "Onboard every account",
        "Capture goals and launch consistent campaigns through one workflow.",
      ],
      [
        "03",
        "Scale with oversight",
        "Review recommendations, approve changes, and report across your portfolio.",
      ],
    ],
    benefits: [
      [
        "A repeatable service",
        "Turn your best campaign process into a consistent client experience.",
      ],
      [
        "Portfolio-level control",
        "See performance, risks, approvals, and opportunities across all accounts.",
      ],
      [
        "More valuable reporting",
        "Deliver branded, outcome-led reports clients can understand and act on.",
      ],
    ],
    ctaTitle: "Add AI advertising to your agency—under your brand.",
    ctaCopy:
      "Tell us about your agency and we’ll arrange a tailored demonstration.",
  },
};
const platforms: Record<Platform, { label: string; short: string }> = {
  search: { label: "Search Ads", short: "Capture people actively searching" },
  meta: { label: "Meta Ads", short: "Create demand on Facebook & Instagram" },
  both: {
    label: "Search + Meta",
    short: "Capture demand and create more of it",
  },
};
const pricing = {
  USD: {
    fees: { search: 29, meta: 49, both: 79 },
    min: 300,
    max: 10000,
    step: 100,
    start: 1000,
  },
  INR: {
    fees: { search: 2500, meta: 4499, both: 6999 },
    min: 3000,
    max: 300000,
    step: 500,
    start: 10000,
  },
} satisfies Record<
  Currency,
  {
    fees: Record<Platform, number>;
    min: number;
    max: number;
    step: number;
    start: number;
  }
>;
const sendEvent = (
  name: string,
  audience: Audience,
  extra: Record<string, string | number> = {},
) => {
  if (typeof window !== "undefined") {
    const w = window as typeof window & {
      dataLayer?: Record<string, string | number>[];
    };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: name, audience, ...extra });
  }
};
const budgetLevel = (n: number, currency: Currency) => {
  const unit = currency === "INR" ? 10 : 1;
  return n < 750 * unit
    ? ["Starter", "A focused test for one offer or location."]
    : n < 2000 * unit
      ? ["Focused", "Enough room to test, learn, and optimize."]
      : n < 5000 * unit
        ? ["Growth", "Broader reach with faster learning."]
        : ["Scale", "Built for multiple offers, audiences, or locations."];
};
export default function Home() {
  const [audience, setAudience] = useState<Audience>("business");
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [budget, setBudget] = useState(pricing.USD.start);
  const [agencySending, setAgencySending] = useState(false);
  const [agencySent, setAgencySent] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const c = content[audience],
    price = pricing[currency],
    fee = platform ? price.fees[platform] : 0,
    [level, levelCopy] = budgetLevel(budget, currency);
  const money = (n: number) =>
    new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  useEffect(() => {
    let active = true;
    fetch("/api/geo")
      .then((r) => r.json() as Promise<{ country?: string }>)
      .then((data) => {
        const localIndia =
          navigator.language.toUpperCase().endsWith("-IN") ||
          Intl.DateTimeFormat().resolvedOptions().timeZone ===
            "Asia/Calcutta" ||
          Intl.DateTimeFormat().resolvedOptions().timeZone === "Asia/Kolkata";
        if (
          active &&
          (data.country === "IN" || (!data.country && localIndia))
        ) {
          setCurrency("INR");
          setBudget(pricing.INR.start);
        }
      })
      .catch(() => {
        const localIndia =
          navigator.language.toUpperCase().endsWith("-IN") ||
          Intl.DateTimeFormat().resolvedOptions().timeZone.includes("Kolkata");
        if (active && localIndia) {
          setCurrency("INR");
          setBudget(pricing.INR.start);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  const change = (next: Audience) => {
    setAudience(next);
    sendEvent("audience_tab_selected", next);
  };
  const build = () => {
    if (!platform) return;
    sendEvent("campaign_builder_started", audience, {
      platform,
      budget,
      fee,
      currency,
    });
    const subject = encodeURIComponent(
        `Build my ${platforms[platform].label} campaign`,
      ),
      body = encodeURIComponent(
        `Selected platform: ${platforms[platform].label}\nCurrency: ${currency}\nMonthly ad spend: ${money(budget)}\nAdwice platform fee: ${money(fee)}/month\nEstimated total monthly commitment: ${money(budget + fee)}`,
      );
    window.location.href = `mailto:care@myadwice.com?subject=${subject}&body=${body}`;
  };
  const submitAgency = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (agencySending) return;
    const form = e.currentTarget,
      d = new FormData(form);
    setAgencySending(true);
    setAgencySent(false);
    setFormError("");
    setFieldErrors({});
    try {
      const response = await fetch("/api/adwice/request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: d.get("name"),
            email: d.get("email"),
            url: d.get("url"),
            phone: d.get("phone") || null,
            budget: null,
            language: navigator.language.split("-")[0] || null,
            plan: d.get("plan"),
            promotion: d.get("promotion") || null,
          }),
        }),
        result = (await response.json().catch(() => null)) as {
          status?: string;
          message?: string;
          data?: Record<string, string[]>;
        } | null;
      if (response.status === 422) {
        setFieldErrors(result?.data || {});
        setFormError(result?.message || "Please check the highlighted fields.");
        return;
      }
      if (!response.ok || result?.status !== "success") throw new Error();
      setAgencySent(true);
      form.reset();
      sendEvent("agency_demo_form_submitted", "agency");
    } catch {
      setFormError(
        "We couldn't submit your request right now. Please try again shortly.",
      );
    } finally {
      setAgencySending(false);
    }
  };
  return (
    <main>
      <header className="nav shell">
        <a className="brand" href="#top" aria-label="Adwice home">
          <Image
            src="/brand/adwice-with-text.svg"
            alt="Adwice"
            width={247}
            height={86}
          />
        </a>
        <nav aria-label="Primary navigation">
          <a href="#how">How it works</a>
          <a href="#benefits">Why Adwice</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="navCta" href="#contact">
          {audience === "business" ? "Get started" : "Agency demo"}
        </a>
      </header>
      <section className={`hero ${audience}`} id="top">
        <div className="shell heroInner">
          <div
            className="audienceTabs"
            role="tablist"
            aria-label="Choose your Adwice experience"
          >
            <button
              role="tab"
              aria-selected={audience === "business"}
              onClick={() => change("business")}
            >
              For Businesses
            </button>
            <button
              role="tab"
              aria-selected={audience === "agency"}
              onClick={() => change("agency")}
            >
              For Agencies
            </button>
          </div>
          <p className="eyebrow">
            <i />
            {c.eyebrow}
          </p>
          <h1>
            {c.title} <span>{c.accent}</span>
          </h1>
          <p className="heroCopy">{c.copy}</p>
          <div className="actions">
            {audience === "business" ? (
              <a className="button primary" href="#planner">
                Plan my campaign <b>↓</b>
              </a>
            ) : (
              <a className="button primary" href="#contact">
                Book an agency demo <b>↗</b>
              </a>
            )}
            <a className="button secondary" href="#how">
              {c.secondary}
            </a>
          </div>
          <ul className="proofRow">
            {c.proof.map((x) => (
              <li key={x}>
                <span>✓</span>
                {x}
              </li>
            ))}
          </ul>
          <div className="productCard">
            <div className="productTop">
              <span>
                <Image
                  className="miniLogo"
                  src="/brand/adwice-logo.svg"
                  alt=""
                  width={24}
                  height={24}
                />
                Campaign overview
              </span>
              <em>Live</em>
            </div>
            <div className="metricGrid">
              <div>
                <small>
                  {audience === "business" ? "Leads" : "Client accounts"}
                </small>
                <strong>{audience === "business" ? "184" : "36"}</strong>
                <span>↑ 24.6%</span>
              </div>
              <div>
                <small>
                  {audience === "business" ? "Cost per lead" : "Approval rate"}
                </small>
                <strong>
                  {audience === "business"
                    ? money(currency === "INR" ? 1540 : 18)
                    : "91%"}
                </strong>
                <span>On target</span>
              </div>
              <div>
                <small>
                  {audience === "business" ? "Conversions" : "Time saved"}
                </small>
                <strong>{audience === "business" ? "62" : "74h"}</strong>
                <span>This month</span>
              </div>
            </div>
            <div className="chart">
              <div className="chartFill" />
              <div className="chartLabel">
                <span>Campaign performance</span>
                <b>Steady growth</b>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="outcome shell" id="how">
        <p className="sectionTag">One focused workflow</p>
        <h2>{c.outcome}</h2>
        <p className="sectionIntro">{c.outcomeCopy}</p>
        <div className="steps">
          {c.steps.map(([n, t, p]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="benefitSection" id="benefits">
        <div className="shell">
          <div className="sectionHead">
            <div>
              <p className="sectionTag">
                Built for {audience === "business" ? "clarity" : "scale"}
              </p>
              <h2>
                {audience === "business"
                  ? "Powerful enough to perform. Simple enough to trust."
                  : "Your delivery engine, your client relationship."}
              </h2>
            </div>
            <p>
              {audience === "business"
                ? "Adwice reduces complexity without hiding the decisions that affect your business."
                : "Adwice supports your team behind the scenes while your agency remains front and centre."}
            </p>
          </div>
          <div className="benefitGrid">
            {c.benefits.map(([t, p], i) => (
              <article key={t}>
                <span>0{i + 1}</span>
                <h3>{t}</h3>
                <p>{p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="quote shell">
        <blockquote>
          “The value is not more dashboards. It’s knowing what to do next—and
          why.”
        </blockquote>
        <p>Adwice turns campaign data into clear, approval-ready action.</p>
      </section>
      {audience === "agency" ? (
        <section className="agencyContact shell" id="contact">
          <div className="agencyContactIntro">
            <p className="sectionTag">Book an agency demo</p>
            <h2>{c.ctaTitle}</h2>
            <p>{c.ctaCopy}</p>
            <ul>
              <li>White-label client experience</li>
              <li>Multi-account campaign operations</li>
              <li>Approval and reporting workflows</li>
            </ul>
          </div>
          <form onSubmit={submitAgency}>
            <div className="formGrid">
              <label>
                Your name
                <input
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Javeed Syed"
                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                />
                {fieldErrors.name && (
                  <span className="fieldError" id="name-error">
                    {fieldErrors.name.join(" ")}
                  </span>
                )}
              </label>
              <label>
                Website URL
                <input
                  name="url"
                  required
                  type="url"
                  autoComplete="url"
                  placeholder="https://youragency.com"
                  aria-describedby={fieldErrors.url ? "url-error" : undefined}
                />
                {fieldErrors.url && (
                  <span className="fieldError" id="url-error">
                    {fieldErrors.url.join(" ")}
                  </span>
                )}
              </label>
              <label>
                Work email
                <input
                  name="email"
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="you@agency.com"
                  aria-describedby={
                    fieldErrors.email ? "email-error" : undefined
                  }
                />
                {fieldErrors.email && (
                  <span className="fieldError" id="email-error">
                    {fieldErrors.email.join(" ")}
                  </span>
                )}
              </label>
              <label>
                Phone <span className="optional">Optional</span>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+46 70 123 45 67"
                  aria-describedby={
                    fieldErrors.phone ? "phone-error" : undefined
                  }
                />
                {fieldErrors.phone && (
                  <span className="fieldError" id="phone-error">
                    {fieldErrors.phone.join(" ")}
                  </span>
                )}
              </label>
            </div>
            <label>
              Advertising plan
              <select
                name="plan"
                required
                defaultValue=""
                aria-describedby={fieldErrors.plan ? "plan-error" : undefined}
              >
                <option value="" disabled>
                  Select a plan
                </option>
                {adwicePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.label}
                  </option>
                ))}
              </select>
              {fieldErrors.plan && (
                <span className="fieldError" id="plan-error">
                  {fieldErrors.plan.join(" ")}
                </span>
              )}
            </label>
            <label>
              Promotion code <span className="optional">Optional</span>
              <input
                name="promotion"
                autoComplete="off"
                aria-describedby={
                  fieldErrors.promotion ? "promotion-error" : undefined
                }
              />
              {fieldErrors.promotion && (
                <span className="fieldError" id="promotion-error">
                  {fieldErrors.promotion.join(" ")}
                </span>
              )}
            </label>
            <button
              className="button primary"
              type="submit"
              disabled={agencySending}
            >
              {agencySending ? "Submitting…" : "Request agency demo"}{" "}
              <b>{agencySending ? "" : "↗"}</b>
            </button>
            {agencySent && (
              <p className="formStatus" role="status">
                Thanks — your request has been received.
              </p>
            )}
            {formError && (
              <p className="formStatus error" role="alert">
                {formError}
              </p>
            )}
            <small>We’ll use these details only to arrange your demo.</small>
          </form>
        </section>
      ) : (
        <section className="finalCta shell business" id="contact">
          <div>
            <p className="sectionTag">Your next step</p>
            <h2>{c.ctaTitle}</h2>
            <p>{c.ctaCopy}</p>
          </div>
        </section>
      )}
      {audience === "business" && (
        <section className="plannerSection shell" id="planner">
          <div className="campaignPlanner" aria-label="Campaign budget planner">
            <div className="plannerHeader">
              <div>
                <small>Plan your campaign</small>
                <h2>Choose where to advertise</h2>
              </div>
              <span>
                {currency === "INR"
                  ? "India pricing · INR"
                  : "International pricing · USD"}{" "}
                · Platform fee shown separately
              </span>
            </div>
            <div className="platformGrid">
              {(Object.keys(platforms) as Platform[]).map((key) => (
                <button
                  type="button"
                  className={platform === key ? "selected" : ""}
                  aria-pressed={platform === key}
                  onClick={() => {
                    setPlatform(key);
                    sendEvent("ad_platform_selected", audience, {
                      platform: key,
                    });
                  }}
                  key={key}
                >
                  <span className="radioDot" />
                  <strong>{platforms[key].label}</strong>
                  <small>{platforms[key].short}</small>
                  <b>
                    {money(price.fees[key])}
                    <em>/month</em>
                  </b>
                </button>
              ))}
            </div>
            <div className="budgetPanel">
              <div className="budgetControl">
                <label htmlFor="budget">
                  Monthly ad spend <strong>{money(budget)}</strong>
                </label>
                <input
                  id="budget"
                  type="range"
                  min={price.min}
                  max={price.max}
                  step={price.step}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                />
                <div className="rangeLabels">
                  <span>{money(price.min)}</span>
                  <span>{money(price.max)}+</span>
                </div>
                <div className="budgetAdjust">
                  <button
                    type="button"
                    onClick={() =>
                      setBudget(
                        Math.max(
                          price.min,
                          Math.round((budget * 0.75) / price.step) * price.step,
                        ),
                      )
                    }
                  >
                    −25%
                  </button>
                  <button
                    type="button"
                    className="active"
                    onClick={() => setBudget(price.start)}
                  >
                    {money(price.start)} suggested start
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBudget(
                        Math.min(
                          price.max,
                          Math.round((budget * 1.25) / price.step) * price.step,
                        ),
                      )
                    }
                  >
                    +25%
                  </button>
                </div>
              </div>
              <div className="budgetSummary">
                <div>
                  <small>{level} budget</small>
                  <p>{levelCopy}</p>
                </div>
                <dl>
                  <div>
                    <dt>Ad spend / day</dt>
                    <dd>{money(Math.round(budget / 30))}</dd>
                  </div>
                  <div>
                    <dt>Platform fee</dt>
                    <dd>{platform ? money(fee) : "Select"}</dd>
                  </div>
                  <div className="total">
                    <dt>Total / month</dt>
                    <dd>{platform ? money(budget + fee) : "—"}</dd>
                  </div>
                  
                </dl>
              </div>
            </div>
            <div style={{ marginTop: "40px",padding: "40px", borderTop: "1px solid #ddd" }}>  
                <h2 style={{ marginBottom: "20px" , fontSize: "1.5rem", fontWeight: "600" }}>Contact Details</h2>
            <div className="card" style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px", maxWidth:"400px"}}>
                    <div className="card-body">
                        <form>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
                            <div style={{ marginBottom: "15px" }}>
                                <label htmlFor="name">Name</label>
                                <input
                                    type="text"
                                    id="Name"
                                    name="Name"
                                    placeholder="Enter your Name"
                                    style={{ width: "100%",padding: "8px" }}
                                />
                            </div>
                            <div style={{ marginBottom: "15px" }}>
                                <label htmlFor="email">Email</label>
                                <input
                                    type="text"
                                    id="Email"
                                    name="Email"
                                    placeholder="Enter your Email"
                                    style={{ width: "100%",padding: "8px" }}
                                />
                            </div>
                            <div style={{ marginBottom: "15px" }}>
                                <label htmlFor="Phone">Phone</label>
                                <input
                                    type="text"
                                    id="Phone"
                                    name="Phone"
                                    placeholder="Enter your Phone"
                                    style={{ width: "100%",padding: "8px" }}
                                />
                            </div>
                            <div style={{ marginBottom: "15px" }}>
                                <label htmlFor="country">Country</label>
                                <input
                                    type="text"
                                    id="country"
                                    name="country"
                                    placeholder="Enter your country"
                                    style={{ width: "100%",padding: "8px" }}
                                />
                            </div>
                            <div style={{ marginBottom: "15px" }}>
                                <label htmlFor="address">Address</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    placeholder="Enter your address"
                                    style={{ width: "100%",padding: "8px" }}
                                />
                            </div>
                            </div>
                            <button type="submit" className="button primary" style={{ padding: "10px" }}>
                                Submit
                            </button>
                        </form>
                        </div>
                    </div>
                </div>
            <p className="feeNote">
              {currency === "INR"
                ? "Minimum ad spend is ₹100 per day (₹3,000 per month). "
                : "Minimum ad spend is $300 per month. "}
              Your ad spend goes directly to the selected advertising platform.
              The Adwice fee is billed separately.
            </p>
            <div className="actions plannerActions">
              <button
                className="button primary"
                disabled={!platform}
                onClick={build}
              >
                Build my campaign <b>↗</b>
              </button>
            </div>
            {!platform && (
              <p className="selectionHint">
                Select Search Ads, Meta Ads, or Both to continue.
              </p>
            )}
          </div>
        </section>
      )}
      <footer className="shell">
        <a className="brand" href="#top">
          <Image
            src="/brand/adwice-with-text.svg"
            alt="Adwice"
            width={247}
            height={86}
          />
        </a>
        <p>AI-powered campaign strategy, optimization, and reporting.</p>
        <div>
          <a href="mailto:care@myadwice.com">care@myadwice.com</a>
          <span>© 2026 Adwice</span>
        </div>
      </footer>
    </main>
  );
}
