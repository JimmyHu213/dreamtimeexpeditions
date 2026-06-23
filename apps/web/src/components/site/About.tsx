import { site } from "@/content/site";

export function About() {
  const { about } = site;
  return (
    <section id="about" className="section bg-[var(--color-ink)]">
      <div className="shell grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="eyebrow">{about.eyebrow}</p>
          <h2 className="display-lg mt-5 text-[var(--color-mist)]">{about.title}</h2>
        </div>
        <div className="space-y-6 md:col-span-6 md:col-start-7">
          {about.body.map((p, i) => (
            <p key={i} className="lead">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
