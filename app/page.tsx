"use client";
import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { adwicePlans } from "../config/adwice-plans";

type Audience = "business" | "agency";
type Platform = "search" | "meta" | "both";
type Currency = "USD" | "INR";
const platformPlans: Record<Platform, number> = { search: 0, meta: 1, both: 2 };
const pricing = {
  USD: { min: 300, max: 10000, step: 100, start: 1000 },
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
    [platform, setPlatform] = useState<Platform | null>(null),
    [currency, setCurrency] = useState<Currency>("USD"),
    [budget, setBudget] = useState(pricing.USD.start),
    [sending, setSending] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  const price = pricing[currency],
    plan = platform ? adwicePlans[platformPlans[platform]] : null,
    fee = plan?.monthlyPlatformFees[currency] ?? 0,
    dailyBudgetMicros = Math.round((budget / 30) * 1000000),
    money = (value: number) =>
      new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);
  useEffect(() => {
    fetch("/api/geo")
      .then((r) => r.json() as Promise<{ country?: string }>)
      .then((d) => {
        if (d.country === "IN") {
          setCurrency("INR");
          setBudget(pricing.INR.start);
        }
      })
      .catch(() => undefined);
  }, []);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const form = e.currentTarget,
      data = new FormData(form);
    setSending(true);
    setSent(false);
    setError("");
    try {
      const response = await fetch("/api/adwice/request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: data.get("name"),
            email: data.get("email"),
            url: data.get("url"),
            phone: data.get("phone") || null,
            country: data.get("country") || null,
            budget: audience === "business" ? dailyBudgetMicros : null,
            language: navigator.language.split("-")[0] || null,
            plan: data.get("plan"),
            promotion: null,
            requestType: audience,
          }),
        }),
        result = (await response.json().catch(() => null)) as {
          status?: string;
        } | null;
      if (!response.ok || result?.status !== "success") throw new Error();
      setSent(true);
      form.reset();
    } catch {
      setError(
        "We couldn't submit your request right now. Please try again shortly.",
      );
    } finally {
      setSending(false);
    }
  };
  const label = (key: Platform) =>
    key === "search"
      ? "Search Ads"
      : key === "meta"
        ? "Meta Ads"
        : "Search + Meta";
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
          <a href="#contact">Contact</a>
        </nav>
        <a className="navCta" href="#contact">
          {audience === "agency" ? "Agency demo" : "Get started"}
        </a>
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
      <section className="outcome shell" id="how">
        <p className="sectionTag">One focused workflow</p>
        <h2>More calls, leads, bookings, and sales</h2>
        <p className="sectionIntro">
          Choose your goal, review the strategy, then launch and improve.
        </p>
        <WorkflowSteps audience={audience} />
      </section>
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
                  {currency === "INR"
                    ? "India pricing · INR"
                    : "International pricing · USD"}{" "}
                  · Platform fee shown separately
                </span>
              </div>
              <div className="platformGrid">
                {(Object.keys(platformPlans) as Platform[]).map((key) => {
                  const item = adwicePlans[platformPlans[key]];
                  return (
                    <button
                      type="button"
                      className={platform === key ? "selected" : ""}
                      aria-pressed={platform === key}
                      onClick={() => setPlatform(key)}
                      key={key}
                    >
                      <span className="radioDot" />
                      <strong>{label(key)}</strong>
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
                    <div className="total">
                      <dt>Total / month</dt>
                      <dd>{plan ? money(budget + fee) : "—"}</dd>
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
                onSubmit={submit}
                sending={sending}
                sent={sent}
                error={error}
              />
              {!plan && (
                <p className="selectionHint">
                  Select Search Ads, Meta Ads, or Both to continue.
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
            onSubmit={submit}
            sending={sending}
            sent={sent}
            error={error}
          />
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

function LeadForm({
  business = false,
  plan,
  onSubmit,
  sending,
  sent,
  error,
}: {
  business?: boolean;
  plan: string;
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
        ) : (
          <label>
            Phone <span className="optional">Optional</span>
            <input name="phone" type="tel" autoComplete="tel" />
          </label>
        )}
      </div>
      {business ? (
        <input type="hidden" name="plan" value={plan} />
      ) : (
        <label>
          Advertising plan
          <select name="plan" required defaultValue="">
            <option value="" disabled>
              Select a plan
            </option>
            {adwicePlans.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
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

function WorkflowSteps({ audience }: { audience: Audience }) {
  const steps =
    audience === "business"
      ? [
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
        ]
      : [
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
        ];
  return (
    <div className="steps">
      {steps.map(([number, title, copy]) => (
        <article key={number}>
          <span>{number}</span>
          <h3>{title}</h3>
          <p>{copy}</p>
        </article>
      ))}
    </div>
  );
}
