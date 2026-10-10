UPDATE "user"
SET "phoneNumber" = "mobile"
WHERE "phoneNumber" IS NULL;

ALTER TABLE "user" DROP COLUMN "mobile";
ALTER TABLE "account" DROP COLUMN "mobile";
