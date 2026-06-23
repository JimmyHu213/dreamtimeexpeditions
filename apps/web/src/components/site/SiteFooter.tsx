import { site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="bg-[var(--color-ink)] pb-16 pt-10">
      <div className="shell">
        <div className="rule mb-10" />
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="font-display text-2xl text-[var(--color-mist)]">{site.brand}</p>
            <p className="mt-2 max-w-sm text-sm text-[var(--color-stone)]">{site.tagline}</p>
          </div>
          <div className="text-sm text-[color-mix(in_oklab,var(--color-mist)_70%,transparent)]">
            <p>{site.contact.location}</p>
            <p>{site.contact.email}</p>
          </div>
        </div>
        <p className="mt-12 text-xs text-[var(--color-stone)]">
          © {new Date().getFullYear()} {site.brand}. We travel in partnership with the Traditional Owners of the
          Kimberley.
        </p>
      </div>
    </footer>
  );
}
