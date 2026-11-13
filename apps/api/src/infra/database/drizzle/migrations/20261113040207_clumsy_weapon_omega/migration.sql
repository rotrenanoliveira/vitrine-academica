CREATE TYPE "promotion_status" AS ENUM('ACTIVE', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" text PRIMARY KEY,
	"project_id" text NOT NULL,
	"promoter_id" text NOT NULL,
	"cost" integer NOT NULL,
	"status" "promotion_status" DEFAULT 'ACTIVE'::"promotion_status" NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "promotions_active_project_promoter_idx" ON "promotions" ("project_id","promoter_id") WHERE "status" = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "promotions_project_status_idx" ON "promotions" ("project_id","status");--> statement-breakpoint
CREATE INDEX "promotions_status_expires_idx" ON "promotions" ("status","expires_at");--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_promoter_id_users_id_fkey" FOREIGN KEY ("promoter_id") REFERENCES "users"("id");