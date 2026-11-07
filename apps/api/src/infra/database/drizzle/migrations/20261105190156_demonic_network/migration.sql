CREATE TYPE "event_registration_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "event_theme_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN');--> statement-breakpoint
CREATE TYPE "event_phase" AS ENUM('THEME_SELECTION', 'INSTITUTIONAL_SELECTION', 'OPEN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "participation_scope" AS ENUM('GLOBAL', 'INSTITUTION');--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" text PRIMARY KEY,
	"event_id" text NOT NULL,
	"project_id" text NOT NULL,
	"responsible_user_id" text NOT NULL,
	"status" "event_registration_status" DEFAULT 'PENDING'::"event_registration_status" NOT NULL,
	"reviewed_by_user_id" text,
	"reviewed_at" timestamp,
	"review_reason" text,
	"registered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_themes" (
	"id" text PRIMARY KEY,
	"event_id" text NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "event_theme_status" DEFAULT 'PENDING'::"event_theme_status" NOT NULL,
	"moderated_by_user_id" text,
	"moderated_at" timestamp,
	"moderation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "event_votes" (
	"id" text PRIMARY KEY,
	"event_id" text NOT NULL,
	"theme_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY,
	"institution_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text,
	"participation_scope" "participation_scope" NOT NULL,
	"phase" "event_phase" DEFAULT 'THEME_SELECTION'::"event_phase" NOT NULL,
	"winner_theme_id" text,
	"starts_at" timestamp NOT NULL,
	"theme_selection_ends_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "event_registrations_event_project_idx" ON "event_registrations" ("event_id","project_id");--> statement-breakpoint
CREATE INDEX "event_registrations_event_status_idx" ON "event_registrations" ("event_id","status");--> statement-breakpoint
CREATE INDEX "event_registrations_project_idx" ON "event_registrations" ("project_id");--> statement-breakpoint
CREATE INDEX "event_themes_event_status_idx" ON "event_themes" ("event_id","status");--> statement-breakpoint
CREATE INDEX "event_themes_author_idx" ON "event_themes" ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_votes_event_user_idx" ON "event_votes" ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "event_votes_theme_idx" ON "event_votes" ("theme_id");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_idx" ON "events" ("slug");--> statement-breakpoint
CREATE INDEX "events_institution_phase_idx" ON "events" ("institution_id","phase");--> statement-breakpoint
CREATE INDEX "events_phase_theme_selection_ends_at_idx" ON "events" ("phase","theme_selection_ends_at");--> statement-breakpoint
CREATE INDEX "events_phase_ends_at_idx" ON "events" ("phase","ends_at");--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id");--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_responsible_user_id_users_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_reviewed_by_user_id_users_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "event_themes" ADD CONSTRAINT "event_themes_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id");--> statement-breakpoint
ALTER TABLE "event_themes" ADD CONSTRAINT "event_themes_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "event_themes" ADD CONSTRAINT "event_themes_moderated_by_user_id_users_id_fkey" FOREIGN KEY ("moderated_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "event_votes" ADD CONSTRAINT "event_votes_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id");--> statement-breakpoint
ALTER TABLE "event_votes" ADD CONSTRAINT "event_votes_theme_id_event_themes_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "event_themes"("id");--> statement-breakpoint
ALTER TABLE "event_votes" ADD CONSTRAINT "event_votes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_institution_id_institutions_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id");