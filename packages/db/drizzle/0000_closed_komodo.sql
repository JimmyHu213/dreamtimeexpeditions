CREATE TYPE "public"."departure_status" AS ENUM('scheduled', 'charter', 'closed');--> statement-breakpoint
CREATE TABLE "departures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voyage_slug" text NOT NULL,
	"vessel_name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"capacity" integer NOT NULL,
	"status" "departure_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
