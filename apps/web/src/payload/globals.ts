import type { GlobalConfig } from "payload";

export const SiteContent: GlobalConfig = {
  slug: "site-content",
  access: { read: () => true },
  fields: [
    { name: "brandName", type: "text", required: true, defaultValue: "Dreamtime Expeditions" },
    { name: "heroEyebrow", type: "text" },
    { name: "heroHeadline", type: "text", required: true },
    { name: "heroSubhead", type: "textarea" },
    { name: "heroImage", type: "upload", relationTo: "media" },
    { name: "experienceTitle", type: "text" },
    { name: "experienceBody", type: "richText" },
    { name: "aboutTitle", type: "text" },
    { name: "aboutBody", type: "richText" },
    { name: "enquiryIntro", type: "textarea" },
  ],
};

export const globals = [SiteContent];
