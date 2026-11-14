ALTER TABLE "calls" ADD COLUMN "project_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "calls_project_idx" ON "calls" ("project_id");--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL;