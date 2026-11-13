CREATE TYPE "point_transaction_reason" AS ENUM('STAR_RECEIVED', 'PROMOTION');--> statement-breakpoint
CREATE TYPE "point_transaction_type" AS ENUM('CREDIT', 'DEBIT');--> statement-breakpoint
CREATE TABLE "point_transactions" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"type" "point_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"reason" "point_transaction_reason" NOT NULL,
	"reference_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "point_transactions_reason_reference_user_idx" ON "point_transactions" ("reason","reference_id","user_id");--> statement-breakpoint
CREATE INDEX "point_transactions_user_created_idx" ON "point_transactions" ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");