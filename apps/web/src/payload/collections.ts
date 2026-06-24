import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email" },
  fields: [{ name: "name", type: "text" }],
};

export const Media: CollectionConfig = {
  slug: "media",
  access: { read: () => true },
  upload: true,
  fields: [{ name: "alt", type: "text", required: true }],
};

export const Vessels: CollectionConfig = {
  slug: "vessels",
  access: { read: () => true },
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "tagline", type: "text" },
    { name: "story", type: "richText" },
    {
      name: "specs",
      type: "array",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "value", type: "text", required: true },
      ],
    },
    { name: "heroImage", type: "upload", relationTo: "media" },
  ],
};

export const Voyages: CollectionConfig = {
  slug: "voyages",
  access: { read: () => true },
  admin: { useAsTitle: "title" },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "summary", type: "textarea" },
    { name: "durationNights", type: "number", required: true },
    { name: "route", type: "text" },
    { name: "priceFrom", type: "number" },
    { name: "kind", type: "select", defaultValue: "scheduled", options: ["scheduled", "charter"], required: true },
    { name: "image", type: "upload", relationTo: "media" },
  ],
};

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  access: { read: () => true },
  admin: { useAsTitle: "author" },
  fields: [
    { name: "quote", type: "textarea", required: true },
    { name: "author", type: "text", required: true },
    { name: "location", type: "text" },
  ],
};

export const Enquiries: CollectionConfig = {
  slug: "enquiries",
  access: { create: () => true, read: () => false, update: () => false, delete: () => false },
  admin: { useAsTitle: "email" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email", required: true },
    { name: "phone", type: "text" },
    { name: "message", type: "textarea", required: true },
  ],
};

export const collections = [Users, Media, Vessels, Voyages, Testimonials, Enquiries];
