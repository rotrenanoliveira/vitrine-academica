CREATE TYPE "project_member_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" text PRIMARY KEY,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" "project_member_status" DEFAULT 'PENDING'::"project_member_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "project_members_project_user_idx" ON "project_members" ("project_id","user_id");--> statement-breakpoint
CREATE INDEX "project_members_user_idx" ON "project_members" ("user_id");--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");