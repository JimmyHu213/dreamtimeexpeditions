import { site } from "@/content/site";

export function Vessel() {
  const { vessel } = site;
  return (
    <section id="vessel" className="relative bg-[var(--color-deep)]">
      <div className="grid md:grid-cols-2">
        <div
          className="min-h-[60vh] md:min-h-[88vh]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(15,31,41,0) 60%, rgba(15,31,41,0.6) 100%), url(${vessel.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="flex items-center px-[clamp(1.5rem,5vw,5rem)] py-[clamp(3.5rem,8vw,7rem)]">
          <div className="max-w-md">
            <p className="eyebrow">{vessel.eyebrow}</p>
            <h2 className="display-lg mt-5 text-[var(--color-mist)]">{vessel.name}</h2>
            <p className="mt-4 font-display text-xl text-[var(--color-sand)]">{vessel.tagline}</p>
            <p className="lead mt-6">{vessel.body}</p>
            <dl className="mt-10 grid grid-cols-3 gap-x-6 gap-y-7">
              {vessel.specs.map((s) => (
                <div key={s.label}>
                  <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-stone)]">{s.label}</dt>
                  <dd className="mt-1 font-display text-2xl text-[var(--color-mist)]">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
