import { pgTable, uuid, text, integer, date, timestamp, pgEnum } from "drizzle-orm/pg-core";

/**
 * Operational departure status. A departure is a bookable instance of a voyage
 * (the marketing content lives in Payload; this table holds dates + inventory).
 * Extended in the booking plan with cabins/availability/bookings tables.
 */
export const departureStatus = pgEnum("departure_status", ["scheduled", "charter", "closed"]);

export const departures = pgTable("departures", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Links to the Payload `voyages` collection slug for presentation. */
  voyageSlug: text("voyage_slug").notNull(),
  vesselName: text("vessel_name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  capacity: integer("capacity").notNull(),
  status: departureStatus("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Departure = typeof departures.$inferSelect;
export type NewDeparture = typeof departures.$inferInsert;
