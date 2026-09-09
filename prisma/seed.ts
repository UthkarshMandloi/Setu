import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Clean DB
  await prisma.auditLog.deleteMany()
  await prisma.marketplaceRequest.deleteMany()
  await prisma.solutionPassport.deleteMany()
  await prisma.legalDocument.deleteMany()
  await prisma.kPIResult.deleteMany()
  await prisma.kPI.deleteMany()
  await prisma.pilot.deleteMany()
  await prisma.pitch.deleteMany()
  await prisma.unregisteredProblem.deleteMany()
  await prisma.problem.deleteMany()
  await prisma.document.deleteMany()
  await prisma.startupProfile.deleteMany()
  await prisma.department.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('password123', 10)

  // 1. Departments (Maharashtra prominent + others)
  const depts = await Promise.all([
    prisma.department.create({ data: { name: 'Department of Revenue', state: 'Maharashtra', description: 'Handles land records and tax' } }),
    prisma.department.create({ data: { name: 'Department of Agriculture', state: 'Maharashtra', description: 'Farmers welfare and crop management' } }),
    prisma.department.create({ data: { name: 'Municipal Corporation', state: 'Maharashtra', description: 'Urban tech and sanitation' } }),
    prisma.department.create({ data: { name: 'Department of Transport', state: 'Maharashtra', description: 'Public transit and smart roads' } }),
    prisma.department.create({ data: { name: 'Department of Health', state: 'Karnataka', description: 'Public healthcare and infra' } }),
  ])
  const [revMH, agriMH, mcMH, transMH, healthKA] = depts

  // 2. Govt Users
  const govUserMH = await prisma.user.create({
    data: { name: 'Aakash Deshmukh', email: 'officer.mh@gov.in', password: passwordHash, role: 'GOV_OFFICER', departmentId: revMH.id }
  })
  const govAdminMH = await prisma.user.create({
    data: { name: 'Priya Sharma', email: 'admin.mh@gov.in', password: passwordHash, role: 'GOV_ADMIN', departmentId: mcMH.id }
  })
  const govUserKA = await prisma.user.create({
    data: { name: 'Rahul Gowda', email: 'officer.ka@gov.in', password: passwordHash, role: 'GOV_OFFICER', departmentId: healthKA.id }
  })
  const platformAdmin = await prisma.user.create({
    data: { name: 'Super Admin', email: 'admin@setu.gov.in', password: passwordHash, role: 'PLATFORM_ADMIN' }
  })

  // 3. Startups & Profiles
  const startupData = [
    { name: 'CropAI Tech', sector: 'Agritech', verified: 'VERIFIED', score: 95 },
    { name: 'GeoSpatial Analytics', sector: 'Govtech', verified: 'VERIFIED', score: 100 },
    { name: 'MedLink Solutions', sector: 'Healthtech', verified: 'VERIFIED', score: 85 },
    { name: 'CivicSense', sector: 'Smart Cities', verified: 'VERIFIED', score: 90 },
    { name: 'FinFlow AI', sector: 'Fintech', verified: 'NEEDS_REVIEW', score: 65 },
    { name: 'EcoWaste Management', sector: 'Cleantech', verified: 'REJECTED', score: 40 },
    { name: 'TransitFlow', sector: 'Govtech', verified: 'VERIFIED', score: 88 },
    { name: 'AgriDrone Systems', sector: 'Agritech', verified: 'VERIFIED', score: 92 },
    { name: 'EduSphere', sector: 'Edtech', verified: 'PENDING', score: 0 },
    { name: 'SecureRecords Blockchain', sector: 'Govtech', verified: 'VERIFIED', score: 98 }
  ]

  const startupUsers = []
  const startupProfiles = []

  for (let i = 0; i < startupData.length; i++) {
    const s = startupData[i]
    const user = await prisma.user.create({
      data: {
        name: `Founder ${i+1}`,
        email: `founder${i+1}@${s.name.replace(/\s+/g,'').toLowerCase()}.com`,
        password: passwordHash,
        role: 'STARTUP'
      }
    })
    startupUsers.push(user)

    const profile = await prisma.startupProfile.create({
      data: {
        userId: user.id,
        companyName: s.name,
        cinNumber: 'U' + Math.floor(10000 + Math.random() * 90000) + 'MH202' + (1+Math.floor(Math.random()*4)) + 'PTC',
        dpiitNumber: 'DIPP' + Math.floor(10000 + Math.random() * 90000),
        sector: s.sector,
        foundedYear: 2020 + Math.floor(Math.random() * 4),
        description: `Innovative solutions in the ${s.sector} space.`,
        verificationStatus: s.verified,
        eligibilityScore: s.score
      }
    })
    startupProfiles.push(profile)
  }

  // 4. Problems
  const problemTitles = [
    'Automated Land Record Digitisation & Verification', // Rev MH - 0
    'Crop Yield Prediction based on Satellite Imagery', // Agri MH - 1
    'Smart Pothole Detection and Reporting System', // MC MH - 2
    'AI-based Traffic Signal Optimization', // Trans MH - 3
    'Telemedicine Platform for Remote Villages', // Health KA - 4
    'Blockchain for Government Subsidies', // Rev MH - 5
    'Drone-based Pesticide Spraying Control', // Agri MH - 6
    'Waste Segregation using Computer Vision', // MC MH - 7
    'Predictive Maintenance for Public Buses', // Trans MH - 8
    'Digital Health Records Interoperability', // Health KA - 9
    'IoT Sensors for Flood Warning', // MC MH - 10
    'Chatbot for Citizen Grievances Registration', // Rev MH - 11
    'Water Quality Monitoring in Reservoirs', // MC MH - 12
    'Augmented Reality for Historical Monuments', // Trans MH - 13
    'Supply Chain Tracking for Medical Supplies' // Health KA - 14
  ]

  const problems = []
  for (let i = 0; i < problemTitles.length; i++) {
    const deptIdx = i % 5
    const author = deptIdx === 0 ? govUserMH : deptIdx === 4 ? govUserKA : govAdminMH
    const dept = depts[deptIdx]

    // Some are closed, most published
    const status = i === 12 || i === 1 ? 'CLOSED' : 'PUBLISHED'

    const prob = await prisma.problem.create({
      data: {
        title: problemTitles[i],
        description: `We are looking for an innovative solution to address: ${problemTitles[i]}. The solution should be scalable, cost-effective, and easy to deploy across multiple districts.`,
        theme: deptIdx === 0 ? 'e-Governance' : 'Smart Tech',
        budgetBand: 'INR 10L - 25L',
        expectedOutcomes: 'Reduce manual effort by 50%, increase accuracy to 99%.',
        departmentId: dept.id,
        authorId: author.id,
        status,
        sourceType: 'OFFICIAL'
      }
    })
    problems.push(prob)
  }

  // Set up 1 community adopted problem
  const commProb1 = await prisma.problem.create({
    data: {
      title: 'Stray Animal Tracking in Urban Centers',
      description: 'Reported by citizens in Pune regarding traffic issues due to stray cattle.',
      theme: 'Urban Management',
      status: 'PUBLISHED',
      sourceType: 'COMMUNITY',
      authorId: govAdminMH.id,
      departmentId: mcMH.id
    }
  })
  problems.push(commProb1)

  // 5. Pitches
  // Pitch 1: GeoSpatial for Land Records (Selected -> Pilot Green)
  const pitch1 = await prisma.pitch.create({
    data: {
      problemId: problems[0].id,
      startupId: startupProfiles[1].id,
      solutionSummary: 'AI powered satellite imagery analysis for land boundaries.',
      techReadinessLevel: 8,
      status: 'SELECTED',
      aiSummary: 'Strong technical fit with high readiness level. Good team background.'
    }
  })

  // Pitch 2: CivicSense for Potholes (Selected -> Pilot Yellow)
  const pitch2 = await prisma.pitch.create({
    data: {
      problemId: problems[2].id,
      startupId: startupProfiles[3].id,
      solutionSummary: 'Dashcam computer vision module for garbage trucks to map potholes.',
      techReadinessLevel: 7,
      status: 'SELECTED'
    }
  })

  // Pitch 3: EcoWaste (Rejected)
  await prisma.pitch.create({
    data: {
      problemId: problems[7].id,
      startupId: startupProfiles[5].id, // rejected startup
      solutionSummary: 'Hardware sorting solution',
      techReadinessLevel: 4,
      status: 'REJECTED'
    }
  })

  // Pitch 4: CropAI for Crop Yield (Selected -> Pilot in progress)
  const pitch4 = await prisma.pitch.create({
    data: {
      problemId: problems[1].id,
      startupId: startupProfiles[0].id,
      solutionSummary: 'Machine learning model predicting yield using weather and soil data.',
      status: 'SELECTED',
      techReadinessLevel: 8
    }
  })

  // Pitch 5: MedLink for Telemedicine (Selected -> Pilot Red)
  const pitch5 = await prisma.pitch.create({
    data: {
      problemId: problems[4].id,
      startupId: startupProfiles[2].id,
      solutionSummary: 'Rural kiosk based video consultation software.',
      status: 'SELECTED',
      techReadinessLevel: 6
    }
  })

  // Other submitted / shortlisted pitches
  await prisma.pitch.create({ data: { problemId: problems[3].id, startupId: startupProfiles[6].id, solutionSummary: 'AI traffic cameras', status: 'SHORTLISTED', techReadinessLevel: 6 } })
  await prisma.pitch.create({ data: { problemId: problems[5].id, startupId: startupProfiles[9].id, solutionSummary: 'Blockchain ledger', status: 'SUBMITTED', techReadinessLevel: 5 } })
  await prisma.pitch.create({ data: { problemId: problems[6].id, startupId: startupProfiles[7].id, solutionSummary: 'Autonomous drones', status: 'SUBMITTED', techReadinessLevel: 7 } })

  // 6. Pilots & KPIs & Results & Passports
  // Pilot 1: Completed, GREEN
  const pilot1 = await prisma.pilot.create({
    data: {
      pitchId: pitch1.id,
      departmentId: problems[0].departmentId,
      status: 'COMPLETED',
      budget: 1200000,
      measuredBenefit: 3500000, // Good ROI
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-06-01')
    }
  })
  const kpi1_1 = await prisma.kPI.create({ data: { pilotId: pilot1.id, metric: 'Accuracy of Boundary Mapping', target: 95, unit: '%', direction: 'HIGHER_IS_BETTER' }})
  const kpi1_2 = await prisma.kPI.create({ data: { pilotId: pilot1.id, metric: 'Manual Survey Time Saved', target: 1000, unit: 'hours', direction: 'HIGHER_IS_BETTER' }})
  await prisma.kPIResult.create({ data: { kpiId: kpi1_1.id, actual: 96 } }) // Met
  await prisma.kPIResult.create({ data: { kpiId: kpi1_2.id, actual: 1200 } }) // Met
  const passport1 = await prisma.solutionPassport.create({
    data: {
      pilotId: pilot1.id,
      startupId: startupProfiles[1].id,
      title: 'AI Land Record Digitisation',
      summary: 'Automated extraction of land boundaries directly from high-res satellite imagery.',
      impactScore: 98.5,
      trustBadge: 'GREEN',
      roiPercent: ((3500000 - 1200000) / 1200000) * 100,
      ipStatus: 'OPEN',
      isPublished: true
    }
  })

  // Pilot 2: Completed, YELLOW
  const pilot2 = await prisma.pilot.create({
    data: {
      pitchId: pitch2.id,
      departmentId: problems[2].departmentId,
      status: 'COMPLETED',
      budget: 500000,
      measuredBenefit: 400000,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-05-01')
    }
  })
  const kpi2_1 = await prisma.kPI.create({ data: { pilotId: pilot2.id, metric: 'Potholes Detected per week', target: 500, unit: 'count', direction: 'HIGHER_IS_BETTER' }})
  const kpi2_2 = await prisma.kPI.create({ data: { pilotId: pilot2.id, metric: 'False Positive Rate', target: 5, unit: '%', direction: 'LOWER_IS_BETTER' }})
  await prisma.kPIResult.create({ data: { kpiId: kpi2_1.id, actual: 350 } }) // Partial
  await prisma.kPIResult.create({ data: { kpiId: kpi2_2.id, actual: 8 } }) // Partial
  const passport2 = await prisma.solutionPassport.create({
    data: {
      pilotId: pilot2.id,
      startupId: startupProfiles[3].id,
      title: 'Dashcam Road Survey',
      summary: 'Mounted cameras on existing fleet to report road conditions.',
      impactScore: 68.0,
      trustBadge: 'YELLOW',
      roiPercent: -20, // Negative ROI
      ipStatus: 'PROPRIETARY',
      isPublished: true
    }
  })

  // Pilot 3: In Progress
  const pilot3 = await prisma.pilot.create({
    data: {
      pitchId: pitch4.id,
      departmentId: problems[1].departmentId,
      status: 'IN_PROGRESS',
      budget: 800000,
      startDate: new Date('2025-08-01')
    }
  })
  await prisma.kPI.create({ data: { pilotId: pilot3.id, metric: 'Farmers Onboarded', target: 1000, unit: 'users', direction: 'HIGHER_IS_BETTER' }})
  await prisma.kPI.create({ data: { pilotId: pilot3.id, metric: 'Yield Prediction Accuracy', target: 90, unit: '%', direction: 'HIGHER_IS_BETTER' }})
  // No results or passport yet

  // Pilot 4: Completed, RED
  const pilot4 = await prisma.pilot.create({
    data: {
      pitchId: pitch5.id,
      departmentId: problems[4].departmentId,
      status: 'COMPLETED',
      budget: 1500000,
      measuredBenefit: 200000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-04-01')
    }
  })
  const kpi4_1 = await prisma.kPI.create({ data: { pilotId: pilot4.id, metric: 'Remote Consultations', target: 10000, unit: 'count', direction: 'HIGHER_IS_BETTER' }})
  const kpi4_2 = await prisma.kPI.create({ data: { pilotId: pilot4.id, metric: 'Kiosk Uptime', target: 99, unit: '%', direction: 'HIGHER_IS_BETTER' }})
  await prisma.kPIResult.create({ data: { kpiId: kpi4_1.id, actual: 1200 } }) // Not Met
  await prisma.kPIResult.create({ data: { kpiId: kpi4_2.id, actual: 75 } }) // Not Met
  // We can create a RED passport to show
  await prisma.solutionPassport.create({
    data: {
      pilotId: pilot4.id,
      startupId: startupProfiles[2].id,
      title: 'Rural Telemedicine Kiosk',
      summary: 'Video consultation booths in panchayat offices.',
      impactScore: 25.0, // Failed badly
      trustBadge: 'RED',
      roiPercent: -86.6,
      ipStatus: 'PROPRIETARY',
      isPublished: true
    }
  })

  // 7. Marketplace Request
  await prisma.marketplaceRequest.create({
    data: {
      passportId: passport1.id,
      departmentId: transMH.id, // Transport dept requesting Land dept's solution
      status: 'PENDING',
      notes: 'We want to use this for surveying land required for a new highway.'
    }
  })

  // 8. Unregistered problems
  await prisma.unregisteredProblem.create({
    data: {
      title: 'Mosquito Breeding in Open Drains',
      description: 'The open drains in Sector 4 are causing severe health issues.',
      location: 'Nagpur',
      reporter: 'Ravi Kumar',
      status: 'PENDING'
    }
  })
  await prisma.unregisteredProblem.create({
    data: {
      title: 'Delay in Birth Certificate Issuance',
      description: 'It takes 3 months despite applying online.',
      location: 'Mumbai',
      reporter: 'Anonymous Citizen',
      status: 'ADOPTED'
    }
  })

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
