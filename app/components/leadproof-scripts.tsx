"use client";

import Script from "next/script";

export function LeadProofScripts({
  siteKey,
  scriptUrl,
}: {
  siteKey?: string;
  scriptUrl?: string;
}) {
  if (
    !siteKey ||
    !scriptUrl ||
    siteKey === "REPLACE_WITH_GENERATED_SITE_KEY"
  ) {
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
