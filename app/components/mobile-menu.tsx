"use client";

import { useState } from "react";
import Link from "next/link";

type MenuItem = {
  label: string;
  href: string;
};

type MobileMenuProps = {
  links: MenuItem[];
  action: MenuItem;
};

export function MobileMenu({ links, action }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mobileMenu">
      <button
        className={`mobileMenuToggle${open ? " isOpen" : ""}`}
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav
        className="mobileMenuPanel"
        id="mobile-navigation"
        aria-label="Mobile navigation"
        hidden={!open}
      >
        {links.map(({ label, href }) => (
          <Link key={label} href={href} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
        <Link
          className="mobileMenuAction"
          href={action.href}
          onClick={() => setOpen(false)}
        >
          {action.label}
          <b aria-hidden="true">↗</b>
        </Link>
      </nav>
    </div>
  );
}
