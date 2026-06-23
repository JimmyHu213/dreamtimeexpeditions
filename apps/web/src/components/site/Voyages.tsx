import type { Voyage } from "@/content/site";

export function Voyages({ voyages }: { voyages: Voyage[] }) {
  return (
    <section id="voyages" className="section bg-[var(--color-ink)]">
      <div data-reveal className="shell">
        <div className="mb-14 max-w-2xl">
          <p className="eyebrow">Voyages &amp; Itineraries</p>
          <h2 className="display-lg mt-5 text-[var(--color-mist)]">
            Four ways to meet the coast
          </h2>
        </div>
        <div className="grid gap-px overflow-hidden rounded border border-[color-mix(in_oklab,var(--color-mist)_12%,transparent)] bg-[color-mix(in_oklab,var(--color-mist)_12%,transparent)] sm:grid-cols-2">
          {voyages.map((v) => (
            <article
              key={v.slug}
              className="group relative flex min-h-[22rem] flex-col justify-end overflow-hidden bg-[var(--color-deep)] p-8"
              style={{
                backgroundImage: `linear-gradient(to top, rgba(11,14,17,0.9) 12%, rgba(11,14,17,0.35) 60%, rgba(11,14,17,0.55) 100%), url(${v.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--color-sand)]">
                <span>{v.kind === "charter" ? "Private Charter" : `${v.nights} Nights`}</span>
                <span className="h-px w-6 bg-[var(--color-sand)] opacity-60" />
                <span className="text-[color-mix(in_oklab,var(--color-on-image)_70%,transparent)]">{v.route}</span>
              </div>
              <h3 className="mt-4 font-display text-3xl leading-tight text-[var(--color-on-image)]">{v.title}</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[color-mix(in_oklab,var(--color-on-image)_80%,transparent)]">
                {v.summary}
              </p>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm text-[var(--color-on-image)]">
                  {v.priceFrom ? `From $${v.priceFrom.toLocaleString()} pp` : "Priced on request"}
                </span>
                <a href="#enquire" className="text-sm text-[var(--color-sand)] transition-opacity hover:opacity-80">
                  Enquire →
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
