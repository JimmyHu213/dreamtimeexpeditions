"use server";

import { getPayload } from "payload";
import config from "@payload-config";

export type EnquiryInput = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  voyage?: string;
};

export type EnquiryResult = { ok: true } | { ok: false; error: string };

// Persists a marketing enquiry into the Payload `enquiries` collection (public
// create access). The collection has no `voyage` field, so the chosen voyage is
// folded into the message to avoid a schema migration.
export async function submitEnquiry(input: EnquiryInput): Promise<EnquiryResult> {
  const name = input.name?.trim();
  const email = input.email?.trim();
  const message = input.message?.trim();

  if (!name || !email || !message) {
    return { ok: false, error: "Please fill in your name, email and message." };
  }

  const voyage = input.voyage?.trim();
  const fullMessage = voyage ? `Voyage of interest: ${voyage}\n\n${message}` : message;

  try {
    const payload = await getPayload({ config });
    await payload.create({
      collection: "enquiries",
      data: { name, email, phone: input.phone?.trim() || undefined, message: fullMessage },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong sending your enquiry. Please try again." };
  }
}
