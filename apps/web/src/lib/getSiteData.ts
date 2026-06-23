import { getPayload } from "payload";
import config from "@payload-config";
import { site, type Voyage, type Testimonial } from "@/content/site";

function mediaUrl(v: unknown): string | null {
  if (v && typeof v === "object" && "url" in v && typeof (v as { url: unknown }).url === "string") {
    return (v as { url: string }).url;
  }
  return null;
}

export type SiteData = {
  brand: string;
  hero: { eyebrow: string; headline: string; subhead: string; image: string };
  voyages: Voyage[];
  testimonials: Testimonial[];
  enquiryIntro: string;
};

/**
 * Build the marketing content from Payload (D1), falling back to the static
 * `site` module for any field/collection that's empty or unavailable. The whole
 * thing is wrapped so the public site renders even if the CMS has no data yet.
 */
export async function getSiteData(): Promise<SiteData> {
  const fallback: SiteData = {
    brand: site.brand,
    hero: site.hero,
    voyages: [...site.voyages],
    testimonials: [...site.testimonials],
    enquiryIntro: site.enquiry.body,
  };

  try {
    const payload = await getPayload({ config });
    const [content, voyagesRes, testimonialsRes] = await Promise.all([
      payload.findGlobal({ slug: "site-content", depth: 1 }).catch(() => null),
      payload.find({ collection: "voyages", limit: 20, depth: 1 }).catch(() => ({ docs: [] })),
      payload.find({ collection: "testimonials", limit: 12 }).catch(() => ({ docs: [] })),
    ]);

    const voyages: Voyage[] = voyagesRes.docs.length
      ? voyagesRes.docs.map((d: Record<string, unknown>) => ({
          title: String(d.title ?? ""),
          slug: String(d.slug ?? ""),
          nights: Number(d.durationNights ?? 0),
          route: String(d.route ?? ""),
          summary: String(d.summary ?? ""),
          priceFrom: typeof d.priceFrom === "number" ? d.priceFrom : undefined,
          kind: d.kind === "charter" ? "charter" : "scheduled",
          image: mediaUrl(d.image) ?? site.hero.image,
        }))
      : fallback.voyages;

    const testimonials: Testimonial[] = testimonialsRes.docs.length
      ? testimonialsRes.docs.map((d: Record<string, unknown>) => ({
          quote: String(d.quote ?? ""),
          author: String(d.author ?? ""),
          location: String(d.location ?? ""),
        }))
      : fallback.testimonials;

    const c = (content ?? {}) as Record<string, unknown>;
    return {
      brand: typeof c.brandName === "string" && c.brandName ? c.brandName : fallback.brand,
      hero: {
        eyebrow: typeof c.heroEyebrow === "string" && c.heroEyebrow ? c.heroEyebrow : site.hero.eyebrow,
        headline: typeof c.heroHeadline === "string" && c.heroHeadline ? c.heroHeadline : site.hero.headline,
        subhead: typeof c.heroSubhead === "string" && c.heroSubhead ? c.heroSubhead : site.hero.subhead,
        image: mediaUrl(c.heroImage) ?? site.hero.image,
      },
      voyages,
      testimonials,
      enquiryIntro: typeof c.enquiryIntro === "string" && c.enquiryIntro ? c.enquiryIntro : fallback.enquiryIntro,
    };
  } catch {
    return fallback;
  }
}
