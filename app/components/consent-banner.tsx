"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "adwice_tracking_consent";
type ConsentChoice = "granted" | "denied";

function applyConsent(choice: ConsentChoice) {
  const granted = choice === "granted";

  window.dispatchEvent(
    new CustomEvent("adwice:consent", {
      detail: {
        analytics_storage: granted,
        advertising_storage: granted,
        pii: false,
      },
    }),
  );

  window.gtag?.("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: granted ? "granted" : "denied",
    ad_user_data: granted ? "granted" : "denied",
    ad_personalization: granted ? "granted" : "denied",
  });
}

export function ConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "granted" || saved === "denied") {
      applyConsent(saved);
    } else {
      setOpen(true);
    }
  }, []);

  const choose = (choice: ConsentChoice) => {
    window.localStorage.setItem(STORAGE_KEY, choice);
    applyConsent(choice);
    setOpen(false);
  };

  return (
    <>
      {open ? (
        <section
          className="consentBanner"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-title"
          aria-describedby="consent-description"
        >
          <div>
            <h2 id="consent-title">Your privacy choices</h2>
            <p id="consent-description">
              We use analytics and advertising technology to understand website
              activity and measure enquiries. You can accept or reject optional
              tracking. Essential website functions remain available either way.
              Read our <Link href="/privacy-policy">Privacy Policy</Link>.
            </p>
          </div>
          <div className="consentActions">
            <button type="button" onClick={() => choose("denied")}>
              Reject optional
            </button>
            <button
              className="consentAccept"
              type="button"
              onClick={() => choose("granted")}
            >
              Accept all
            </button>
          </div>
        </section>
      ) : (
        <button
          className="consentSettings"
          type="button"
          onClick={() => setOpen(true)}
        >
          Cookie settings
        </button>
      )}
    </>
  );
}
