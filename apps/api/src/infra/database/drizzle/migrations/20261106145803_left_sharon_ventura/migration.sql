CREATE TYPE "user_role" AS ENUM('USER', 'STUDENT', 'PROFESSOR', 'ADMIN');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'USER'::"user_role" NOT NULL;