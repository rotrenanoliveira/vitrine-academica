CREATE TYPE "preference_tag_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "project_status" AS ENUM('SKETCH', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "preference_tags" (
	"id" text PRIMARY KEY,
	"tag_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" "preference_tag_status" DEFAULT 'ACTIVE'::"preference_tag_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "project_tags" (
	"id" text PRIMARY KEY,
	"project_id" text NOT NULL,
	"tag_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"author_id" text NOT NULL,
	"status" "project_status" DEFAULT 'SKETCH'::"project_status" NOT NULL,
	"attachments" text[] DEFAULT '{}'::text[] NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "preference_tag_user_tag_idx" ON "preference_tags" ("user_id","tag_id");--> statement-breakpoint
CREATE INDEX "preference_tag_user_idx" ON "preference_tags" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_tag_project_tag_idx" ON "project_tags" ("project_id","tag_id");--> statement-breakpoint
CREATE INDEX "project_tag_tag_idx" ON "project_tags" ("tag_id");--> statement-breakpoint
CREATE INDEX "project_tag_project_idx" ON "project_tags" ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_slug_idx" ON "tags" ("slug");--> statement-breakpoint
ALTER TABLE "preference_tags" ADD CONSTRAINT "preference_tags_tag_id_tags_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id");--> statement-breakpoint
ALTER TABLE "preference_tags" ADD CONSTRAINT "preference_tags_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_tag_id_tags_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");