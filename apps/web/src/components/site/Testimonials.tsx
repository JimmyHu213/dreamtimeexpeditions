import { site } from "@/content/site";

export function Testimonials() {
  return (
    <section className="section bg-[var(--color-sea)]">
      <div data-reveal className="shell">
        <p className="eyebrow mb-14">In Their Words</p>
        <div className="grid gap-12 md:grid-cols-3">
          {site.testimonials.map((t, i) => (
            <figure key={i} className="flex flex-col">
              <span className="font-display text-5xl leading-none text-[var(--color-sand)]">&ldquo;</span>
              <blockquote className="mt-3 font-display text-xl leading-relaxed text-[var(--color-mist)]">
                {t.quote}
              </blockquote>
              <figcaption className="mt-6 text-sm text-[color-mix(in_oklab,var(--color-mist)_70%,transparent)]">
                {t.author} · {t.location}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
