-- Add promotional fields to products and author name to comments
CREATE TYPE "BadgeType" AS ENUM ('NONE', 'SALE', 'NEW', 'HIT');

ALTER TABLE "Product"
ADD COLUMN "oldPrice" DECIMAL(15,2),
ADD COLUMN "badgeType" "BadgeType" NOT NULL DEFAULT 'NONE',
ADD COLUMN "badgeTextUz" TEXT,
ADD COLUMN "badgeTextRu" TEXT;

ALTER TABLE "Comment"
ADD COLUMN "authorName" TEXT NOT NULL DEFAULT 'Anonim';
