CREATE TYPE "institution_member_role" AS ENUM('STUDENT', 'PROFESSOR', 'TEACHER', 'MANAGER', 'ADMINISTRATIVE_OFFICE');--> statement-breakpoint
CREATE TYPE "institution_member_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'FINISHED', 'PENDING', 'REJECTED');--> statement-breakpoint
CREATE TYPE "institution_membership_request_role" AS ENUM('STUDENT', 'PROFESSOR', 'TEACHER', 'MANAGER', 'ADMINISTRATIVE_OFFICE');--> statement-breakpoint
CREATE TYPE "institution_membership_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "institution_origin" AS ENUM('SEED', 'USER_REGISTRATION', 'ADMIN');--> statement-breakpoint
CREATE TYPE "institution_status" AS ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "institution_type" AS ENUM('UNIVERSITY', 'COLLEGE', 'CENTER', 'TECHNICAL_COLLEGE', 'OTHER');--> statement-breakpoint
CREATE TABLE "institution_members" (
	"id" text PRIMARY KEY,
	"institution_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "institution_member_role" NOT NULL,
	"status" "institution_member_status" DEFAULT 'ACTIVE'::"institution_member_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "institution_membership_requests" (
	"id" text PRIMARY KEY,
	"institution_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "institution_membership_request_role" NOT NULL,
	"status" "institution_membership_request_status" DEFAULT 'PENDING'::"institution_membership_request_status" NOT NULL,
	"proof_attachment_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "institution_type" NOT NULL,
	"status" "institution_status" DEFAULT 'ACTIVE'::"institution_status" NOT NULL,
	"origin" "institution_origin" NOT NULL,
	"description" text NOT NULL,
	"register_by" text NOT NULL,
	"should_proof" boolean DEFAULT false NOT NULL,
	"should_verify" boolean DEFAULT false NOT NULL,
	"domain" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "institution_members_institution_user_idx" ON "institution_members" ("institution_id","user_id");--> statement-breakpoint
CREATE INDEX "institution_members_institution_idx" ON "institution_members" ("institution_id");--> statement-breakpoint
CREATE INDEX "institution_members_user_idx" ON "institution_members" ("user_id");--> statement-breakpoint
CREATE INDEX "institution_membership_requests_institution_idx" ON "institution_membership_requests" ("institution_id");--> statement-breakpoint
CREATE INDEX "institution_membership_requests_user_idx" ON "institution_membership_requests" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "institutions_slug_idx" ON "institutions" ("slug");--> statement-breakpoint
ALTER TABLE "institution_members" ADD CONSTRAINT "institution_members_institution_id_institutions_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id");--> statement-breakpoint
ALTER TABLE "institution_members" ADD CONSTRAINT "institution_members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "institution_membership_requests" ADD CONSTRAINT "institution_membership_requests_DujJMog1KHVB_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id");--> statement-breakpoint
ALTER TABLE "institution_membership_requests" ADD CONSTRAINT "institution_membership_requests_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "institution_membership_requests" ADD CONSTRAINT "institution_membership_requests_XHj1S13LE2Ue_fkey" FOREIGN KEY ("proof_attachment_id") REFERENCES "attachments"("id");--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_register_by_users_id_fkey" FOREIGN KEY ("register_by") REFERENCES "users"("id");