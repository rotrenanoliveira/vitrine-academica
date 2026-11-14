CREATE TYPE "subscription_status" AS ENUM('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED');--> statement-breakpoint
CREATE TYPE "notification_status" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TABLE "author_subscriptions" (
	"id" text PRIMARY KEY,
	"subscriber_id" text NOT NULL,
	"author_id" text NOT NULL,
	"email" text NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"status" "subscription_status" DEFAULT 'ACTIVE'::"subscription_status" NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "publication_notifications" (
	"id" text PRIMARY KEY,
	"subscription_id" text NOT NULL,
	"project_id" text NOT NULL,
	"status" "notification_status" DEFAULT 'PENDING'::"notification_status" NOT NULL,
	"sent_at" timestamp,
	"provider_message_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "author_subscriptions_subscriber_author_idx" ON "author_subscriptions" ("subscriber_id","author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "author_subscriptions_unsubscribe_token_idx" ON "author_subscriptions" ("unsubscribe_token");--> statement-breakpoint
CREATE INDEX "author_subscriptions_author_idx" ON "author_subscriptions" ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "publication_notifications_subscription_project_idx" ON "publication_notifications" ("subscription_id","project_id");--> statement-breakpoint
CREATE INDEX "publication_notifications_status_idx" ON "publication_notifications" ("status");--> statement-breakpoint
ALTER TABLE "author_subscriptions" ADD CONSTRAINT "author_subscriptions_subscriber_id_users_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "author_subscriptions" ADD CONSTRAINT "author_subscriptions_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "publication_notifications" ADD CONSTRAINT "publication_notifications_zI1Dp19doTzk_fkey" FOREIGN KEY ("subscription_id") REFERENCES "author_subscriptions"("id");--> statement-breakpoint
ALTER TABLE "publication_notifications" ADD CONSTRAINT "publication_notifications_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");