CREATE TABLE "rating_criteria" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"weight" real DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "project_teacher_ratings" (
	"id" text PRIMARY KEY,
	"project_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"overall_score" real NOT NULL,
	"rated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "teacher_rating_items" (
	"id" text PRIMARY KEY,
	"rating_id" text NOT NULL,
	"criterion_id" text NOT NULL,
	"score" real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "project_teacher_ratings_project_teacher_idx" ON "project_teacher_ratings" ("project_id","teacher_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teacher_rating_items_rating_criterion_idx" ON "teacher_rating_items" ("rating_id","criterion_id");--> statement-breakpoint
ALTER TABLE "project_teacher_ratings" ADD CONSTRAINT "project_teacher_ratings_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "project_teacher_ratings" ADD CONSTRAINT "project_teacher_ratings_teacher_id_users_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "teacher_rating_items" ADD CONSTRAINT "teacher_rating_items_rating_id_project_teacher_ratings_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "project_teacher_ratings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher_rating_items" ADD CONSTRAINT "teacher_rating_items_criterion_id_rating_criteria_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "rating_criteria"("id");