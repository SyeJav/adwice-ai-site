import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="shell">
      <div className="footerBrand">
        <a className="brand" href="/">
          <Image
            src="/brand/adwice-with-text.svg"
            alt="Adwice"
            width={247}
            height={86}
          />
        </a>
        <p>AI-powered campaign strategy, optimization, and reporting.</p>
      </div>
      <nav className="footerLinks" aria-label="Legal links">
        <a href="/privacy-policy">Privacy Policy</a>
        <a href="/terms-of-service">Terms of Service</a>
        <a href="/cancellation-policy">Cancellation Policy</a>
        <a href="/shipping-and-delivery">Shipping and Delivery</a>
      </nav>
      <div className="footerContact">
        <div className="socialLinks" role="group" aria-label="Follow Adwice">
          <a
            href="https://www.linkedin.com/company/adwice-technologies/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Adwice on LinkedIn"
          >
            <LinkedInIcon />
          </a>
          <a
            href="https://www.instagram.com/ad__wice/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Adwice on Instagram"
          >
            <InstagramIcon />
          </a>
          <a
            href="https://www.facebook.com/profile.php?id=61567329575393"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Adwice on Facebook"
          >
            <FacebookIcon />
          </a>
        </div>
        <a href="mailto:care@myadwice.com">care@myadwice.com</a>
        <span>© 2026 Adwice</span>
      </div>
    </footer>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 8.3H3.2V21h3.3V8.3ZM4.85 3A1.93 1.93 0 1 0 4.9 6.86 1.93 1.93 0 0 0 4.85 3ZM21 13.72c0-3.83-2.04-5.61-4.77-5.61a4.12 4.12 0 0 0-3.7 2.04V8.3H9.2V21h3.33v-6.29c0-1.66.31-3.27 2.37-3.27 2.03 0 2.06 1.9 2.06 3.38V21H21v-7.28Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.35" cy="6.65" r="0.85" className="instagramDot" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.67 21v-8h2.68l.4-3.12h-3.08V7.89c0-.9.25-1.52 1.55-1.52h1.66V3.58A22.18 22.18 0 0 0 14.46 3c-2.4 0-4.04 1.46-4.04 4.15v2.73H7.7V13h2.72v8h3.25Z" />
    </svg>
  );
}
