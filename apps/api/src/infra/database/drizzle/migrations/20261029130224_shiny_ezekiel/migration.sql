CREATE TABLE "project_stars" (
	"id" text PRIMARY KEY,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"rated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "project_stars_project_user_idx" ON "project_stars" ("project_id","user_id");--> statement-breakpoint
CREATE INDEX "project_stars_project_active_idx" ON "project_stars" ("project_id","active");--> statement-breakpoint
CREATE INDEX "project_stars_user_active_idx" ON "project_stars" ("user_id","active");--> statement-breakpoint
ALTER TABLE "project_stars" ADD CONSTRAINT "project_stars_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "project_stars" ADD CONSTRAINT "project_stars_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");