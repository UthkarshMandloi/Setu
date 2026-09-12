-- CreateTable
CREATE TABLE "StartupSolution" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sector" TEXT,
    "description" TEXT NOT NULL,
    "problemSolved" TEXT NOT NULL,
    "keyFeatures" TEXT,
    "deploymentProof" TEXT,
    "evidenceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isListed" BOOLEAN NOT NULL DEFAULT true,
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StartupSolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartupSolutionRequest" (
    "id" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StartupSolutionRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StartupSolution" ADD CONSTRAINT "StartupSolution_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "StartupProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupSolution" ADD CONSTRAINT "StartupSolution_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupSolutionRequest" ADD CONSTRAINT "StartupSolutionRequest_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "StartupSolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupSolutionRequest" ADD CONSTRAINT "StartupSolutionRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

