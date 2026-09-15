ALTER TABLE "institutions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "institutions" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "institution_status";--> statement-breakpoint
CREATE TYPE "institution_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED');--> statement-breakpoint
ALTER TABLE "institutions" ALTER COLUMN "status" SET DATA TYPE "institution_status" USING "status"::"institution_status";--> statement-breakpoint
ALTER TABLE "institutions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"institution_status";