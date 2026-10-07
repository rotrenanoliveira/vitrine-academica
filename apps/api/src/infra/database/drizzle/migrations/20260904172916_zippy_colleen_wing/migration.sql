CREATE TYPE "user_status" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED', 'DELETED');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"status" "user_status" DEFAULT 'PENDING'::"user_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
