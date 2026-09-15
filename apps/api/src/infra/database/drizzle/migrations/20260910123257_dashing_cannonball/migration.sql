CREATE TABLE "project_scheduled" (
	"id" text PRIMARY KEY,
	"project_id" text NOT NULL,
	"published_in" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "project_scheduled_project_id_idx" ON "project_scheduled" ("project_id");--> statement-breakpoint
CREATE INDEX "project_scheduled_published_in_idx" ON "project_scheduled" ("published_in");--> statement-breakpoint
ALTER TABLE "project_scheduled" ADD CONSTRAINT "project_scheduled_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");