"use client";
import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { adwicePlans, type AdwicePlanId } from "../config/adwice-plans";
import { SiteFooter } from "./components/site-footer";
import { WhatsAppLink } from "./components/whatsapp-link";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

type Audience = "business" | "agency";
type Currency = "USD" | "EUR" | "INR";
const pricing = {
  USD: { min: 150, max: 10000, step: 100, start: 1000 },
  EUR: { min: 140, max: 9200, step: 100, start: 900 },
  INR: { min: 3000, max: 300000, step: 500, start: 10000 },
};
const countries = [
  ["in", "India"],
  ["us", "United States"],
  ["gb", "United Kingdom"],
  ["ca", "Canada"],
  ["au", "Australia"],
  ["de", "Germany"],
  ["fr", "France"],
  ["se", "Sweden"],
  ["ae", "United Arab Emirates"],
  ["sg", "Singapore"],
] as const;

export default function Home() {
  const [audience, setAudience] = useState<Audience>("business"),
    [selectedPlanId, setSelectedPlanId] = useState<AdwicePlanId | null>(null),
    [currency, setCurrency] = useState<Currency>("USD"),
    [budget, setBudget] = useState(pricing.USD.start),
    [sending, setSending] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  const price = pricing[currency],
    plan = adwicePlans.find(({ id }) => id === selectedPlanId) ?? null,
    fee = plan?.monthlyPlatformFees[currency] ?? 0,
    subtotal = budget + fee,
    gst = currency === "INR" ? Math.round(subtotal * 0.18) : 0,
    dailyBudgetMicros = Math.round(budget / 30),
    money = (value: number) =>
      new Intl.NumberFormat(
        currency === "INR" ? "en-IN" : currency === "EUR" ? "de-DE" : "en-US",
        {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
        },
      ).format(value);
  const selectCurrency = (nextCurrency: Currency) => {
    setCurrency(nextCurrency);
    if (plan) setBudget(plan.default_budget[nextCurrency] * 30);
  };
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const form = e.currentTarget,
      data = new FormData(form);
    setSending(true);
    setSent(false);
    setError("");
    try {
      const agencyDemo = audience === "agency";
      const response = await fetch(
        agencyDemo ? "/api/agency-demo" : "/api/adwice/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(
            agencyDemo
              ? {
                  name: data.get("name"),
                  email: data.get("email"),
                  url: data.get("url"),
                  phone: data.get("phone") || null,
                  message: data.get("message") || null,
                }
              : {
                  name: data.get("name"),
                  email: data.get("email"),
                  url: data.get("url"),
                  country: data.get("country") || null,
                  budget: dailyBudgetMicros,
                  language: navigator.language.split("-")[0] || null,
                  plan: data.get("plan"),
                  currency: data.get("currency"),
                  promotion: data.get("promotion") || null,
                  requestType: "business",
                },
          ),
        },
      ),
        result = (await response.json().catch(() => null)) as {
          status?: string;
          message?: string;
        } | null;
      if (!response.ok || result?.status !== "success")
        throw new Error(result?.message);
      window.gtag?.("event", "conversion", {
        send_to: "AW-18454790985/-7nOCNzQ2PkcEMmG999E",
        value: 1.0,
      });
      window.fbq?.("track", "Lead", {
        content_name: "Adwice Lead Form",
      });
      setSent(true);
      form.reset();
    } catch (error) {
      setError(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't submit your request right now. Please try again shortly.",
      );
    } finally {
      setSending(false);
    }
  };
  return (
    <main>
      <header className="nav shell">
        <a className="brand" href="#top">
          <Image
            src="/brand/adwice-with-text.svg"
            alt="Adwice"
            width={247}
            height={86}
          />
        </a>
        <nav>
          <a href="#how">How it works</a>
          <a href="#benefits">Why Adwice</a>
          <Link href="/platform">Features</Link>
          <Link href="/website-analyzer">Free Website Analyzer</Link>
          <a href="#contact">Contact</a>
        </nav>
        <div className="navActions">
          <WhatsAppLink />
          <a className="navCta" href="#contact">
            {audience === "agency" ? "Agency demo" : "Get started"}
          </a>
        </div>
      </header>
      <section className={`hero ${audience}`} id="top">
        <div className="shell heroInner">
          <div className="audienceTabs" role="tablist">
            <button
              role="tab"
              aria-selected={audience === "business"}
              onClick={() => setAudience("business")}
            >
              For Businesses
            </button>
            <button
              role="tab"
              aria-selected={audience === "agency"}
              onClick={() => setAudience("agency")}
            >
              For Agencies
            </button>
          </div>
          <p className="eyebrow">
            <i />
            {audience === "business"
              ? "AI advertising for growing businesses"
              : "White-label AI advertising for agencies"}
          </p>
          <h1>
            {audience === "business"
              ? "Turn your budget into"
              : "Serve more clients."}{" "}
            <span>
              {audience === "business"
                ? "real customers."
                : "Protect your margin."}
            </span>
          </h1>
          <p className="heroCopy">
            AI-powered Google and Meta advertising with clear choices and
            reporting.
          </p>
          <div className="actions">
            <a
              className="button primary"
              href={audience === "business" ? "#planner" : "#contact"}
            >
              {audience === "business"
                ? "Plan my campaign"
                : "Book an agency demo"}{" "}
              <b>↓</b>
            </a>
            <a className="button secondary" href="#how">
              See how it works
            </a>
          </div>
          <ProofRow audience={audience} />
          <ProductCard audience={audience} money={money} />
        </div>
      </section>
      <DetailedHowItWorks />
      <section className="benefitSection" id="benefits">
        <div className="shell">
          <div className="sectionHead">
            <div>
              <p className="sectionTag">Built for clarity</p>
              <h2>Powerful enough to perform. Simple enough to trust.</h2>
            </div>
            <p>Clear decisions, AI assistance, and useful reporting.</p>
          </div>
          <BenefitGrid audience={audience} />
        </div>
      </section>
      <Quote />
      {audience === "agency" && <AgencyWhiteLabel />}
      {audience === "business" && (
        <>
          <section className="finalCta shell business" id="contact">
            <div>
              <p className="sectionTag">Your next step</p>
              <h2>Ready to make your ad budget work harder?</h2>
              <p>
                Choose your advertising platform and monthly ad spend to begin.
              </p>
            </div>
          </section>
          <section className="plannerSection shell" id="planner">
            <div className="campaignPlanner">
              <div className="plannerHeader">
                <div>
                  <small>Plan your campaign</small>
                  <h2>Choose where to advertise</h2>
                </div>
                <span>
                  Currency selected below · Platform fee shown separately
                </span>
              </div>
              <label className="currencySelect" htmlFor="currency">
                Currency
                <select
                  id="currency"
                  value={currency}
                  onChange={(event) =>
                    selectCurrency(event.target.value as Currency)
                  }
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </label>
              <div className="platformGrid">
                {adwicePlans.map((item) => {
                  return (
                    <button
                      type="button"
                      className={selectedPlanId === item.id ? "selected" : ""}
                      aria-pressed={selectedPlanId === item.id}
                      onClick={() => {
                        setSelectedPlanId(item.id);
                        setBudget(item.default_budget[currency] * 30);
                      }}
                      key={item.id}
                    >
                      <span className="radioDot" />
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                      <b>
                        {money(item.monthlyPlatformFees[currency])}
                        <em>/month</em>
                      </b>
                    </button>
                  );
                })}
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
                </div>
                <div className="budgetSummary">
                  <div>
                    <small>Growth budget</small>
                    <p>
                      Budget recommendation based on your selected monthly
                      spend.
                    </p>
                  </div>
                  <dl>
                    <div>
                      <dt>Ad spend / day</dt>
                      <dd>{money(Math.round(budget / 30))}</dd>
                    </div>
                    <div>
                      <dt>Platform fee</dt>
                      <dd>{plan ? money(fee) : "Select"}</dd>
                    </div>
                    {currency === "INR" && (
                      <div>
                        <dt>GST (18%)</dt>
                        <dd>{plan ? money(gst) : "Select"}</dd>
                      </div>
                    )}
                    <div className="total">
                      <dt>Total / month</dt>
                      <dd>{plan ? money(subtotal + gst) : "—"}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <p className="feeNote">
                Minimum ad spend is {money(Math.round(budget / 30))} per day (
                {money(budget)} per month). Your ad spend goes directly to the
                selected advertising platform. The Adwice fee is billed
                separately.
              </p>
              <LeadForm
                business
                plan={plan?.id || ""}
                currency={currency}
                onSubmit={submit}
                sending={sending}
                sent={sent}
                error={error}
              />
              {!plan && (
                <p className="selectionHint">
                  Select a plan to continue.
                </p>
              )}
            </div>
          </section>
        </>
      )}
      {audience === "agency" && (
        <section className="agencyContact shell" id="contact">
          <div className="agencyContactIntro">
            <p className="sectionTag">Book an agency demo</p>
            <h2>Add AI advertising to your agency—under your brand.</h2>
            <p>
              Tell us about your agency and we’ll arrange a tailored
              demonstration.
            </p>
          </div>
          <LeadForm
            plan=""
            currency={currency}
            onSubmit={submit}
            sending={sending}
            sent={sent}
            error={error}
          />
        </section>
      )}
      <SiteFooter />
    </main>
  );
}

function LeadForm({
  business = false,
  plan,
  currency,
  onSubmit,
  sending,
  sent,
  error,
}: {
  business?: boolean;
  plan: string;
  currency: Currency;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  sending: boolean;
  sent: boolean;
  error: string;
}) {
  return (
    <form className={business ? "campaignLeadForm" : ""} onSubmit={onSubmit}>
      <div className="formGrid">
        <label>
          {business ? "Your Business name" : "Your name"}
          <input
            name="name"
            required
            autoComplete={business ? "organization" : "name"}
          />
        </label>
        <label>
          Website URL
          <input
            name="url"
            required
            type="url"
            autoComplete="url"
            placeholder="https://yourbusiness.com"
          />
        </label>
        <label>
          Work email
          <input name="email" required type="email" autoComplete="email" />
        </label>
        {business ? (
          <>
            <label>
              Country
              <select name="country" required defaultValue="">
                <option value="" disabled>
                  Select your country
                </option>
                {countries.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Promotion Code <span className="optional">Optional</span>
              <input name="promotion" autoComplete="off" />
            </label>
          </>
        ) : (
          <label>
            Phone <span className="optional">Optional</span>
            <input name="phone" type="tel" autoComplete="tel" />
          </label>
        )}
      </div>
      {business ? (
        <>
          <input type="hidden" name="plan" value={plan} />
          <input type="hidden" name="currency" value={currency} />
        </>
      ) : (
        <label>
          Tell us about your agency
          <textarea
            name="message"
            rows={4}
            placeholder="Tell us about your agency, clients, or what you’d like to discuss"
          />
        </label>
      )}
      <button
        className="button primary"
        type="submit"
        disabled={(business && !plan) || sending}
      >
        {sending
          ? "Submitting…"
          : business
            ? "Build my campaign"
            : "Request agency demo"}{" "}
        <b>↗</b>
      </button>
      {sent && (
        <p className="formStatus">Thanks — your request has been received.</p>
      )}
      {error && <p className="formStatus error">{error}</p>}
    </form>
  );
}

function ProductCard({
  audience,
  money,
}: {
  audience: Audience;
  money: (value: number) => string;
}) {
  const business = audience === "business";
  return (
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
          <small>{business ? "Leads" : "Client accounts"}</small>
          <strong>{business ? "184" : "36"}</strong>
          <span>↑ 24.6%</span>
        </div>
        <div>
          <small>{business ? "Cost per lead" : "Approval rate"}</small>
          <strong>{business ? money(18) : "91%"}</strong>
          <span>On target</span>
        </div>
        <div>
          <small>{business ? "Conversions" : "Time saved"}</small>
          <strong>{business ? "62" : "74h"}</strong>
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
  );
}

function BenefitGrid({ audience }: { audience: Audience }) {
  const items =
    audience === "business"
      ? [
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
        ]
      : [
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
        ];
  return (
    <div className="benefitGrid">
      {items.map(([title, copy], index) => (
        <article key={title}>
          <span>0{index + 1}</span>
          <h3>{title}</h3>
          <p>{copy}</p>
        </article>
      ))}
    </div>
  );
}

function Quote() {
  return (
    <section className="quote shell">
      <blockquote>
        “The value is not more dashboards. It’s knowing what to do next—and
        why.”
      </blockquote>
      <p>Adwice turns campaign data into clear, approval-ready action.</p>
    </section>
  );
}

function AgencyWhiteLabel() {
  const items = [
    "Custom domain, logo, and brand colours",
    "Separate login portals for each client",
    "White-labelled automated performance reports",
    "Reseller pricing — set your own margin",
    "API access for custom integrations",
  ];
  return (
    <section className="agencyWhiteLabel">
      <div className="shell agencyWhiteLabelInner">
        <div>
          <p className="sectionTag">Agency white-label</p>
          <h2>Fully branded client platform.</h2>
          <p>
            The complete Adwice platform under your brand. Your clients see
            your logo, your domain, and your colours, while you deliver a
            powerful AI advertising service without building it yourself.
          </p>
        </div>
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ProofRow({ audience }: { audience: Audience }) {
  const items =
    audience === "business"
      ? [
          "Google + Meta in one place",
          "Approve before anything goes live",
          "Clear reporting, without jargon",
        ]
      : [
          "Your brand and domain",
          "Multi-client operations",
          "Approval-ready client reporting",
        ];
  return (
    <ul className="proofRow">
      {items.map((item) => (
        <li key={item}>
          <span>✓</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function DetailedHowItWorks() {
  const steps = [
    [
      "1",
      "Tell us about your business",
      "Answer 3–5 simple questions: what you sell, who your customers are, and what result you want from your ads — more calls, website visits, or store visits. No marketing jargon required.",
    ],
    [
      "2",
      "AI builds your complete campaign",
      "Our AI instantly generates ad copy, headlines, keywords, audience targeting, bidding strategy, and creatives — tailored specifically to your business and goal.",
    ],
    [
      "3",
      "Review, approve, and go live",
      "You get a simple preview of your campaign. Review the ads in plain language, make any changes you want, then approve.",
    ],
    [
      "4",
      "We launch and optimize for you",
      "We handle the entire launch. Once live, our AI continuously monitors and optimizes your campaigns automatically to get the best possible results.",
    ],
    [
      "5",
      "Get clear, jargon-free reports",
      "Receive easy-to-understand performance reports. See clicks, calls, or visits your ads generated — in plain English, not marketing speak.",
    ],
  ];
  return (
    <section className="platformHow shell" id="how">
      <div className="platformIntro">
        <p className="sectionTag">How it works</p>
        <h2>From zero to live ads in under 5 minutes.</h2>
        <p>
          No technical setup. No prior experience. No ad account. Answer a few
          questions and let our AI do the heavy lifting.
        </p>
      </div>
      <div className="platformHowGrid">
        <div className="platformSteps">
          {steps.map(([number, title, copy]) => (
            <article key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="campaignPreview">
          <div className="campaignPreviewTop">
            <span>
              <Image
                className="miniLogo"
                src="/brand/adwice-logo.svg"
                alt=""
                width={24}
                height={24}
              />
              Campaign preview
            </span>
            <em>Ready to review</em>
          </div>
          <div className="previewField">
            <small>Business</small>
            <strong>Mario&apos;s Pizza · Local restaurant, Naples</strong>
          </div>
          <div className="previewField">
            <small>Goal</small>
            <strong>Get more phone calls from nearby customers</strong>
          </div>
          <div className="previewField">
            <small>Monthly budget</small>
            <strong>$300 / month</strong>
          </div>
          <div className="adPreview">
            <small>AI-generated Google ad</small>
            <b>Best Pizza in Naples — Call Now</b>
            <p>
              Authentic Italian pizza, fresh ingredients, and quick delivery.
              Order online and get 15% off your first order.
            </p>
          </div>
          <div className="previewPills">
            <span>Google Search</span>
            <span>Meta Feed</span>
          </div>
          <p className="previewLive">Campaign is live — 247 clicks this week</p>
        </div>
      </div>
    </section>
  );
}
