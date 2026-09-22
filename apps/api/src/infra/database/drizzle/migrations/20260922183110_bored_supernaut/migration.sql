CREATE TYPE "audit_log_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT');--> statement-breakpoint
CREATE TYPE "audit_log_status_enum" AS ENUM('SUCCESS', 'FAILURE');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY,
	"timestamp" timestamp NOT NULL,
	"actor_id" text NOT NULL,
	"session_id" text,
	"action" "audit_log_action_enum" NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text NOT NULL,
	"diff" jsonb NOT NULL,
	"status" "audit_log_status_enum" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_session_id_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id");