"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";

const links = [
  { href: "#experience", label: "The Experience" },
  { href: "#vessel", label: "The Vessel" },
  { href: "#voyages", label: "Voyages" },
  { href: "#about", label: "Who We Are" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-[color-mix(in_oklab,var(--color-mist)_10%,transparent)] bg-[color-mix(in_oklab,var(--color-ink)_82%,transparent)] backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <div className="shell flex items-center justify-between py-4">
        <a href="#top" className="font-display text-xl tracking-tight text-[var(--color-mist)]">
          {site.brand}
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[color-mix(in_oklab,var(--color-mist)_78%,transparent)] transition-colors hover:text-[var(--color-sand)]"
            >
              {l.label}
            </a>
          ))}
          <a href="#enquire" className="btn btn-ghost py-2.5">
            Enquire
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-[5px] md:hidden"
        >
          <span
            className={`h-px w-6 bg-[var(--color-mist)] transition-all duration-300 ${open ? "translate-y-[6px] rotate-45" : ""}`}
          />
          <span className={`h-px w-6 bg-[var(--color-mist)] transition-all duration-300 ${open ? "opacity-0" : ""}`} />
          <span
            className={`h-px w-6 bg-[var(--color-mist)] transition-all duration-300 ${open ? "-translate-y-[6px] -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 flex flex-col justify-center bg-[var(--color-ink)] px-8 transition-all duration-500 md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-7">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-display text-3xl text-[var(--color-mist)] transition-colors hover:text-[var(--color-sand)]"
            >
              {l.label}
            </a>
          ))}
          <a href="#enquire" onClick={() => setOpen(false)} className="btn btn-solid mt-4 self-start">
            Enquire
          </a>
        </nav>
      </div>
    </header>
  );
}
