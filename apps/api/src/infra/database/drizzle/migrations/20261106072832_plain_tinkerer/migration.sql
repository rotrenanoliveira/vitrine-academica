CREATE TYPE "call_application_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "call_applications" (
	"id" text PRIMARY KEY,
	"call_id" text NOT NULL,
	"applicant_id" text NOT NULL,
	"message" text,
	"status" "call_application_status" DEFAULT 'PENDING'::"call_application_status" NOT NULL,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "call_application_call_applicant_idx" ON "call_applications" ("call_id","applicant_id");--> statement-breakpoint
CREATE INDEX "call_application_applicant_idx" ON "call_applications" ("applicant_id");--> statement-breakpoint
ALTER TABLE "call_applications" ADD CONSTRAINT "call_applications_call_id_calls_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id");--> statement-breakpoint
ALTER TABLE "call_applications" ADD CONSTRAINT "call_applications_applicant_id_users_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id");