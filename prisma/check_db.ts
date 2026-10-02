import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
  const users = await prisma.user.count()
  const depts = await prisma.department.count()
  const problems = await prisma.problem.count()
  const startups = await prisma.startupProfile.count()
  const pitches = await prisma.pitch.count()
  const pilots = await prisma.pilot.count()
  const kpis = await prisma.kPI.count()
  const kpiResults = await prisma.kPIResult.count()
  const passports = await prisma.solutionPassport.count()
  const solutions = await prisma.startupSolution.count()
  const marketplaceRequests = await prisma.marketplaceRequest.count()
  const unregProblems = await prisma.unregisteredProblem.count()
  const notifications = await prisma.notification.count()
  const auditLogs = await prisma.auditLog.count()

  console.log(JSON.stringify({
    users,
    depts,
    problems,
    startups,
    pitches,
    pilots,
    kpis,
    kpiResults,
    passports,
    solutions,
    marketplaceRequests,
    unregProblems,
    notifications,
    auditLogs
  }, null, 2))
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
