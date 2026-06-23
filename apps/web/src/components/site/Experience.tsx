import { site } from "@/content/site";

export function Experience() {
  const { experience } = site;
  return (
    <section id="experience" className="section bg-[var(--color-ink)]">
      <div data-reveal className="shell grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="eyebrow">{experience.eyebrow}</p>
          <h2 className="display-lg mt-5 text-[var(--color-mist)]">{experience.title}</h2>
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <div className="space-y-6">
            {experience.body.map((p, i) => (
              <p key={i} className="lead">
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
