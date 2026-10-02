import { firestorePrisma } from "../src/lib/firestorePrisma";

async function testAdapter() {
  console.log("=== TEST 1: User findUnique with relation ===");
  const user = await firestorePrisma.user.findUnique({
    where: { email: "officer.mh@gov.in" },
    include: { department: true }
  });
  console.log("Found user:", user?.name, "| Department:", user?.department?.name);

  console.log("\n=== TEST 2: Problem findMany with department & author ===");
  const problems = await firestorePrisma.problem.findMany({
    where: { status: "PUBLISHED" },
    include: { department: true },
    take: 3
  });
  console.log(`Found ${problems.length} published problems:`, problems.map((p: any) => `${p.psNumber}: ${p.title} (${p.department?.name})`));

  console.log("\n=== TEST 3: Pitch groupBy by status ===");
  const groups = await firestorePrisma.pitch.groupBy({
    by: ["status"],
    _count: { _all: true }
  });
  console.log("Pitch groups:", groups);

  console.log("\n=== TEST 4: Pilot findMany with complex relations ===");
  const pilots = await firestorePrisma.pilot.findMany({
    include: {
      pitch: { include: { startup: true, problem: true } },
      kpis: { include: { results: true } }
    },
    take: 2
  });
  console.log(`Found ${pilots.length} pilots:`, pilots.map((p: any) => ({
    status: p.status,
    startup: p.pitch?.startup?.companyName,
    problem: p.pitch?.problem?.title,
    kpiCount: p.kpis?.length
  })));

  console.log("\n=== TEST 5: Counts ===");
  const startupCount = await firestorePrisma.startupProfile.count();
  const publishedProbCount = await firestorePrisma.problem.count({ where: { status: "PUBLISHED" } });
  console.log("Startup count:", startupCount, "| Published problem count:", publishedProbCount);

  console.log("\n=== TEST 6: Create, Update, Delete Problem in Firestore ===");
  const testProb = await firestorePrisma.problem.create({
    data: {
      title: "Temporary Firebase Integration Test Problem",
      description: "Testing create directly in Firebase Firestore",
      status: "DRAFT",
      departmentId: user.departmentId,
      authorId: user.id
    }
  });
  console.log("Created problem with ID:", testProb.id, "and psNumber:", testProb.psNumber);

  const updatedProb = await firestorePrisma.problem.update({
    where: { id: testProb.id },
    data: { title: "Updated Firebase Integration Test Problem" }
  });
  console.log("Updated problem title:", updatedProb.title);

  await firestorePrisma.problem.delete({
    where: { id: testProb.id }
  });
  console.log("Deleted test problem successfully!");

  console.log("\nALL FIRESTORE ADAPTER TESTS PASSED!");
  process.exit(0);
}

testAdapter().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
