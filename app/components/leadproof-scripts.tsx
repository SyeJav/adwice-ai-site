"use client";

import Script from "next/script";

const DEFAULT_SITE_KEY = "lp_site_9eb6bbc90d33ee8e232c3488d267d61e";
const DEFAULT_SCRIPT_URL = "https://leads.myadwice.com/app/tracker.js";

export function LeadProofScripts({
  siteKey = DEFAULT_SITE_KEY,
  scriptUrl = DEFAULT_SCRIPT_URL,
}: {
  siteKey?: string;
  scriptUrl?: string;
}) {
  if (!siteKey || !scriptUrl || siteKey === "REPLACE_WITH_GENERATED_SITE_KEY") {
    return null;
  }

  return (
    <>
      <Script id="leadproof-consent" strategy="beforeInteractive">
        {`
          window.LeadProofConfig = {
            consent: {
              analytics_storage: false,
              advertising_storage: false,
              personalization: false,
              pii: false
            },
            exclude_selectors: ["[data-lp-ignore]"]
          };
          window.LeadProofGrants = { ...window.LeadProofConfig.consent };
          window.LeadProofReady = new Promise(function (resolve) {
            window.resolveLeadProofReady = resolve;
          });
          window.applyLeadProofConsent = async function (grants) {
            window.LeadProofGrants = { ...window.LeadProofGrants, ...grants };
            const tracker = await window.LeadProofReady;
            if (!tracker) return false;
            window.LeadProofConsentReady = tracker.setConsent(window.LeadProofGrants);
            return await window.LeadProofConsentReady;
          };
          window.addEventListener("adwice:consent", function (event) {
            if (event.detail) window.applyLeadProofConsent(event.detail);
          });
          document.addEventListener("click", async function (event) {
            const target = event.target;
            const link = target instanceof Element && target.closest(
              'a[href^="tel:"], a[href*="wa.me"], a[href^="whatsapp:"]'
            );
            if (!link || !window.LeadProofGrants.analytics_storage) return;
            const tracker = await window.LeadProofReady;
            const consentReady = await window.LeadProofConsentReady;
            if (!tracker || !consentReady) return;
            tracker.track("lead", {
              service: link.href.startsWith("tel:")
                ? "Phone call click"
                : "WhatsApp click"
            });
          });
        `}
      </Script>
      <Script
        id="leadproof-tracker"
        defer
        src={scriptUrl}
        data-site={siteKey}
        strategy="afterInteractive"
        onLoad={() => {
          window.resolveLeadProofReady?.(window.LeadProof || null);
        }}
        onError={() => {
          window.resolveLeadProofReady?.(null);
        }}
      />
    </>
  );
}
