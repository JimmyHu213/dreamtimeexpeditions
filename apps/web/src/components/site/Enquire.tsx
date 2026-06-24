"use client";

import { useState } from "react";
import { site, type Voyage } from "@/content/site";
import { submitEnquiry } from "@/app/(frontend)/actions";

export function Enquire({ intro, voyages }: { intro: string; voyages: Voyage[] }) {
  const { enquiry } = site;
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section id="enquire" className="section bg-[var(--color-deep)]">
      <div data-reveal className="shell grid gap-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="eyebrow">{enquiry.eyebrow}</p>
          <h2 className="display-lg mt-5 text-[var(--color-mist)]">{enquiry.title}</h2>
          <p className="lead mt-6">{intro}</p>
          <div className="mt-10 space-y-1 text-sm text-[color-mix(in_oklab,var(--color-mist)_70%,transparent)]">
            <p>{site.contact.location}</p>
            <p>{site.contact.email}</p>
          </div>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          {sent ? (
            <div className="flex h-full min-h-48 flex-col justify-center rounded border border-[color-mix(in_oklab,var(--color-sand)_40%,transparent)] p-10">
              <p className="font-display text-3xl text-[var(--color-mist)]">Thank you.</p>
              <p className="lead mt-3">
                Your enquiry is with the voyage master — expect a personal reply within a day.
              </p>
            </div>
          ) : (
            <form
              className="space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                setSubmitting(true);
                setError(null);
                const res = await submitEnquiry({
                  name: String(fd.get("name") ?? ""),
                  email: String(fd.get("email") ?? ""),
                  phone: String(fd.get("phone") ?? ""),
                  message: String(fd.get("message") ?? ""),
                  voyage: String(fd.get("voyage") ?? ""),
                });
                setSubmitting(false);
                if (res.ok) setSent(true);
                else setError(res.error);
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field name="name" label="Your name" required />
                <Field name="email" label="Email" type="email" required />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field name="phone" label="Phone (optional)" />
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[var(--color-stone)]">
                    Voyage of interest
                  </span>
                  <select name="voyage" defaultValue="" className="dt-input">
                    <option value="">No preference yet</option>
                    {voyages.map((v) => (
                      <option key={v.slug} value={v.title}>
                        {v.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[var(--color-stone)]">
                  Tell us about the journey you imagine
                </span>
                <textarea name="message" rows={4} required className="dt-input resize-none" />
              </label>
              {error && <p className="text-sm text-[var(--color-sand)]">{error}</p>}
              <button type="submit" disabled={submitting} className="btn btn-solid disabled:opacity-60">
                {submitting ? "Sending…" : "Send enquiry"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[var(--color-stone)]">{label}</span>
      <input name={name} type={type} required={required} className="dt-input" />
    </label>
  );
}
