import { site } from "@/content/site";

const links = [
  { href: "#experience", label: "The Experience" },
  { href: "#vessel", label: "The Vessel" },
  { href: "#voyages", label: "Voyages" },
  { href: "#about", label: "Who We Are" },
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="shell flex items-center justify-between py-5">
        <a href="#top" className="font-display text-xl tracking-tight text-[var(--color-mist)]">
          {site.brand}
        </a>
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
        <a href="#enquire" className="btn btn-ghost py-2.5 md:hidden">
          Enquire
        </a>
      </div>
    </header>
  );
}
