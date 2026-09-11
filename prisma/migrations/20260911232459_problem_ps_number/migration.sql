-- AlterTable: human-readable problem statement IDs (displayed as PS-0001)
ALTER TABLE "Problem" ADD COLUMN     "psNumber" SERIAL NOT NULL;

-- Number existing problems in the order they were created (before the unique index exists)
UPDATE "Problem" AS p
SET "psNumber" = o.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS rn FROM "Problem") AS o
WHERE p."id" = o."id";

-- Continue the sequence after the highest assigned number
SELECT setval(pg_get_serial_sequence('"Problem"', 'psNumber'), COALESCE((SELECT MAX("psNumber") FROM "Problem"), 0) + 1, false);

-- CreateIndex
CREATE UNIQUE INDEX "Problem_psNumber_key" ON "Problem"("psNumber");
