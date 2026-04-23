-- Extend lead model with CRM and anti-spam fields
ALTER TABLE "Lead"
  ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "nextFollowUpAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastContactedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "ipHash" TEXT;

-- New default for incoming leads
ALTER TABLE "Lead" ALTER COLUMN "status" SET DEFAULT 'NEW';

-- Performance indexes for dashboard and anti-spam checks
CREATE INDEX IF NOT EXISTS "Lead_source_idx" ON "Lead"("source");
CREATE INDEX IF NOT EXISTS "Lead_nextFollowUpAt_idx" ON "Lead"("nextFollowUpAt");
CREATE INDEX IF NOT EXISTS "Lead_phone_createdAt_idx" ON "Lead"("phone", "createdAt");
CREATE INDEX IF NOT EXISTS "Lead_ipHash_createdAt_idx" ON "Lead"("ipHash", "createdAt");