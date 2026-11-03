CREATE TYPE "call_status" AS ENUM('OPEN', 'CLOSED');--> statement-breakpoint
CREATE TABLE "call_skills" (
	"id" text PRIMARY KEY,
	"call_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "calls" (
	"id" text PRIMARY KEY,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"application_deadline" timestamp NOT NULL,
	"status" "call_status" DEFAULT 'OPEN'::"call_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "call_skill_call_tag_idx" ON "call_skills" ("call_id","tag_id");--> statement-breakpoint
CREATE INDEX "call_skill_tag_idx" ON "call_skills" ("tag_id");--> statement-breakpoint
CREATE INDEX "calls_author_idx" ON "calls" ("author_id");--> statement-breakpoint
CREATE INDEX "calls_status_deadline_idx" ON "calls" ("status","application_deadline");--> statement-breakpoint
ALTER TABLE "call_skills" ADD CONSTRAINT "call_skills_call_id_calls_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id");--> statement-breakpoint
ALTER TABLE "call_skills" ADD CONSTRAINT "call_skills_tag_id_tags_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id");--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");