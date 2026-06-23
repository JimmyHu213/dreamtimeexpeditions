import { site } from "@/content/site";

export function Gallery() {
  return (
    <section id="gallery" className="bg-[var(--color-ink)] pb-[var(--section-y)]">
      <div className="shell">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {site.gallery.map((g, i) => (
            <figure
              key={i}
              className={`group relative overflow-hidden rounded-lg ${i === 0 ? "col-span-2 md:col-span-2 md:row-span-2" : ""}`}
            >
              <div
                className="aspect-[4/3] w-full transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${g.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: "var(--color-sea)",
                  minHeight: i === 0 ? "100%" : undefined,
                }}
              />
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(11,14,17,0.85)] to-transparent p-4 text-sm text-[var(--color-mist)]">
                {g.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
