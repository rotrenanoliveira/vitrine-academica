CREATE TABLE "attachments" (
	"id" text PRIMARY KEY,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"file_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "attachment_key_idx" ON "attachments" ("storage_key");