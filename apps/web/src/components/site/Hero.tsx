import type { SiteData } from "@/lib/getSiteData";

export function Hero({ hero }: { hero: SiteData["hero"] }) {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-end overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(11,14,17,0.35) 0%, rgba(11,14,17,0.2) 35%, rgba(11,14,17,0.85) 100%), url(${hero.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="shell w-full pb-[clamp(3rem,9vw,7rem)]">
        <div className="max-w-3xl reveal">
          <p className="eyebrow mb-6">{hero.eyebrow}</p>
          <h1 className="display-xl text-[var(--color-on-image)]">{hero.headline}</h1>
          <p className="lead mt-7 max-w-xl" style={{ color: "var(--color-on-image)" }}>
            {hero.subhead}
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <a href="#voyages" className="btn btn-solid">
              Discover the Voyages
            </a>
            <a href="#enquire" className="btn btn-on-dark">
              Begin an Enquiry
            </a>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 text-xs tracking-[0.3em] text-[color-mix(in_oklab,var(--color-on-image)_55%,transparent)] md:block">
        SCROLL
      </div>
    </section>
  );
}
