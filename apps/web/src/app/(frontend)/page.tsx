import { Hero } from "@/components/site/Hero";
import { Experience } from "@/components/site/Experience";
import { Vessel } from "@/components/site/Vessel";
import { Voyages } from "@/components/site/Voyages";
import { Gallery } from "@/components/site/Gallery";
import { Testimonials } from "@/components/site/Testimonials";
import { About } from "@/components/site/About";
import { Enquire } from "@/components/site/Enquire";

export default function Home() {
  return (
    <main>
      <Hero />
      <Experience />
      <Vessel />
      <Voyages />
      <Gallery />
      <Testimonials />
      <About />
      <Enquire />
    </main>
  );
}
