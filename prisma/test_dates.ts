import { prisma } from "../src/lib/prisma";

async function testPitchesDate() {
  console.log("Fetching pitches from Firestore via prisma...");
  const pitches = await prisma.pitch.findMany({
    include: {
      problem: true,
      startup: true
    }
  });

  console.log(`Fetched ${pitches.length} pitches:`);
  for (const p of pitches) {
    const isDate = p.createdAt instanceof Date;
    const formatted = p.createdAt.toLocaleDateString("en-IN");
    console.log(`- Pitch ${p.id}: isDate=${isDate}, formattedDate="${formatted}"`);
  }

  console.log("\nTesting pilots date...");
  const pilots = await prisma.pilot.findMany();
  for (const p of pilots) {
    const isDate = p.createdAt instanceof Date;
    const formatted = p.createdAt.toLocaleDateString("en-IN");
    console.log(`- Pilot ${p.id}: isDate=${isDate}, formattedDate="${formatted}"`);
  }

  console.log("\nALL DATE TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

testPitchesDate().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
