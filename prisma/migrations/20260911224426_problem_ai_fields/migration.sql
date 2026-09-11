-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "aiAssisted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "constraints" TEXT,
ADD COLUMN     "originalBrief" TEXT,
ADD COLUMN     "pilotDurationWeeks" INTEGER,
ADD COLUMN     "scope" TEXT,
ADD COLUMN     "suggestedKpis" JSONB,
ADD COLUMN     "targetBeneficiaries" TEXT;

