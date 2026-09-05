CREATE TABLE "accounts" (
	"id" text PRIMARY KEY,
	"user_id" text UNIQUE,
	"avatar_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"confirmation_at" timestamp,
	"consented_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "account_idx" ON "accounts" ("id");--> statement-breakpoint
CREATE INDEX "user_idx" ON "accounts" ("user_id");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");