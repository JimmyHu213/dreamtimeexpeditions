// Typed marketing content. Shaped to mirror the future Payload collections so the
// swap to CMS-driven content is mechanical (see the marketing-site plan).

export type Voyage = {
  title: string;
  slug: string;
  nights: number;
  route: string;
  summary: string;
  priceFrom?: number;
  kind: "scheduled" | "charter";
  image: string;
};

export type Testimonial = { quote: string; author: string; location: string };
export type GalleryItem = { caption: string; image: string };
export type Spec = { label: string; value: string };

// Cinematic coastal / expedition imagery (Unsplash). The hero & gallery layer a
// gradient over these, so the design holds even if a remote image is slow to load.
const IMG = {
  hero: "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?auto=format&fit=crop&w=2400&q=80",
  vessel: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80",
  gorge: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1600&q=80",
  reef: "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?auto=format&fit=crop&w=1600&q=80",
  falls: "https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?auto=format&fit=crop&w=1600&q=80",
  coast: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  dusk: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1600&q=80",
  cabin: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80",
};

export const site = {
  brand: "Dreamtime Expeditions",
  tagline: "Private expedition voyages along Australia's last great wild coast.",

  hero: {
    eyebrow: "The Kimberley · Western Australia",
    headline: "Voyage into the Dreaming",
    subhead:
      "Ten guests. One private vessel. A thousand kilometres of ancient coastline known to few — unveiled at the pace of the tides.",
    image: IMG.hero,
  },

  experience: {
    eyebrow: "The Experience",
    title: "A coastline measured in millennia, explored in days",
    body: [
      "The Kimberley is one of the last truly wild places on earth — a labyrinth of red-rock gorges, thundering tidal falls, and reefs that rise whole from the sea. It cannot be reached by road. It is felt only from the water.",
      "We carry no more than ten guests, so the journey bends to you: a longer morning among the waterfalls, an unplanned anchorage beneath a sky with no horizon of light. This is not a cruise. It is a private expedition, quietly rendered.",
    ],
  },

  vessel: {
    eyebrow: "The Vessel",
    name: "M.Y. Dreamtime",
    tagline: "A 38-metre expedition yacht built for the world's wildest water.",
    body: "Five staterooms, an expedition deck, two tenders and a helicopter pad — crewed by a team of seven who know these waters intimately. Every passage is shaped around the tides, the light, and the appetite of the day.",
    image: IMG.vessel,
    specs: [
      { label: "Guests", value: "10" },
      { label: "Staterooms", value: "5" },
      { label: "Crew", value: "7" },
      { label: "Length", value: "38 m" },
      { label: "Tenders", value: "2 + heli" },
      { label: "Range", value: "4,000 nm" },
    ] as Spec[],
  },

  voyages: [
    {
      title: "The Horizontal Falls Expedition",
      slug: "horizontal-falls",
      nights: 7,
      route: "Broome → Wyndham",
      summary:
        "Seven nights through the heart of the Kimberley — the Horizontal Falls, Montgomery Reef, ancient Wandjina rock art and the Hunter River.",
      priceFrom: 18500,
      kind: "scheduled",
      image: IMG.falls,
    },
    {
      title: "Montgomery Reef & the Buccaneer",
      slug: "montgomery-buccaneer",
      nights: 5,
      route: "Broome → Broome",
      summary:
        "A shorter passage into the Buccaneer Archipelago, where a reef the size of a city rises from the falling tide.",
      priceFrom: 13900,
      kind: "scheduled",
      image: IMG.reef,
    },
    {
      title: "The Full Kimberley Coast",
      slug: "full-coast",
      nights: 11,
      route: "Broome → Darwin",
      summary:
        "The complete passage — gorges, waterfalls, rock art and remote anchorages, end to end, at the slowest possible pace.",
      priceFrom: 29500,
      kind: "scheduled",
      image: IMG.coast,
    },
    {
      title: "Private Charter — Bespoke",
      slug: "bespoke-charter",
      nights: 10,
      route: "By arrangement",
      summary:
        "The vessel, the route and the rhythm — entirely yours. Designed in conversation, for your party alone.",
      kind: "charter",
      image: IMG.dusk,
    },
  ] as Voyage[],

  gallery: [
    { caption: "Tidal falls, Talbot Bay", image: IMG.falls },
    { caption: "Montgomery Reef at the turn", image: IMG.reef },
    { caption: "Red gorges of the Hunter", image: IMG.gorge },
    { caption: "First light at anchor", image: IMG.dusk },
    { caption: "The stateroom", image: IMG.cabin },
    { caption: "Open water, no horizon of light", image: IMG.coast },
  ] as GalleryItem[],

  testimonials: [
    {
      quote:
        "The most extraordinary journey of our lives. We have travelled widely, and nothing has come close to those ten days on the Kimberley.",
      author: "The Hendersons",
      location: "Melbourne",
    },
    {
      quote:
        "Every detail anticipated before we knew to ask. It felt less like a charter and more like being quietly looked after by old friends.",
      author: "A. & R. Whitfield",
      location: "Singapore",
    },
    {
      quote: "We came for the falls and left changed by the silence. Faultless from first enquiry to last.",
      author: "Dr. Susan Lmany",
      location: "London",
    },
  ] as Testimonial[],

  about: {
    eyebrow: "Who We Are",
    title: "A small company, by design",
    body: [
      "Dreamtime Expeditions was founded by a master and a chef who spent twenty seasons running the Kimberley and decided the coast deserved to be travelled slowly, and privately.",
      "We run a single vessel and a single standard. We work with Traditional Owners, carry no more than ten guests, and treat each voyage as the only one that matters — because to the people aboard, it is.",
    ],
  },

  enquiry: {
    eyebrow: "Begin the Journey",
    title: "Tell us the voyage you imagine",
    body: "Share a few details and the voyage master will be in touch personally — usually within a day.",
  },

  contact: {
    location: "Broome, Western Australia",
    email: "voyages@dreamtimeexpeditions.com.au",
  },
} as const;
