import { Hero } from "@/components/site/Hero";
import { Experience } from "@/components/site/Experience";
import { Vessel } from "@/components/site/Vessel";
import { Voyages } from "@/components/site/Voyages";
import { Gallery } from "@/components/site/Gallery";
import { Testimonials } from "@/components/site/Testimonials";
import { About } from "@/components/site/About";
import { Enquire } from "@/components/site/Enquire";
import { getSiteData } from "@/lib/getSiteData";

// Reads marketing content from Payload (D1) at request time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getSiteData();
  return (
    <main>
      <Hero hero={data.hero} />
      <Experience />
      <Vessel />
      <Voyages voyages={data.voyages} />
      <Gallery />
      <Testimonials items={data.testimonials} />
      <About />
      <Enquire intro={data.enquiryIntro} voyages={data.voyages} />
    </main>
  );
}
