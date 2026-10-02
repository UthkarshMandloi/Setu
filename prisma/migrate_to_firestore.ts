import { db } from "../src/lib/firebase";
import { collection, doc, writeBatch } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

const collectionMap: Record<string, string> = {
  User: "users",
  StartupProfile: "startupProfiles",
  Document: "documents",
  Department: "departments",
  Problem: "problems",
  Pitch: "pitches",
  Pilot: "pilots",
  KPI: "kpis",
  KPIResult: "kpiResults",
  LegalDocument: "legalDocuments",
  SolutionPassport: "solutionPassports",
  MarketplaceRequest: "marketplaceRequests",
  StartupSolution: "startupSolutions",
  StartupSolutionRequest: "startupSolutionRequests",
  UnregisteredProblem: "unregisteredProblems",
  AuditLog: "auditLogs",
  Notification: "notifications"
};

const booleanFields = new Set([
  "aiAssisted",
  "reviewedByAdmin",
  "isSigned",
  "isPublished",
  "isListed",
  "isRead"
]);

const numberFields = new Set([
  "psNumber",
  "eligibilityScore",
  "foundedYear",
  "aiConfidence",
  "pilotDurationWeeks",
  "techReadinessLevel",
  "budget",
  "measuredBenefit",
  "target",
  "weight",
  "actual",
  "impactScore",
  "roiPercent"
]);

async function runMigration() {
  const dumpPath = path.join(__dirname, "dev_db_dump.json");
  if (!fs.existsSync(dumpPath)) {
    console.error("dev_db_dump.json not found!");
    process.exit(1);
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, "utf-8"));
  console.log("Starting migration to Firestore project:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

  let totalMigrated = 0;

  for (const [table, rows] of Object.entries<any[]>(dump)) {
    const colName = collectionMap[table] || table.toLowerCase();
    if (!rows || rows.length === 0) {
      console.log(`Skipping empty table ${table}`);
      continue;
    }

    console.log(`Migrating ${rows.length} records from ${table} -> ${colName}...`);

    // Firestore allows up to 500 operations per batch
    const BATCH_SIZE = 400;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = rows.slice(i, i + BATCH_SIZE);

      for (const row of chunk) {
        const docId = row.id ? String(row.id) : doc(collection(db, colName)).id;
        const cleanData: Record<string, any> = { id: docId };

        for (const [k, v] of Object.entries(row)) {
          if (v === undefined) continue;

          // Convert booleans
          if (booleanFields.has(k)) {
            cleanData[k] = Boolean(v === 1 || v === true || v === "1" || v === "true");
          } else if (numberFields.has(k) && v !== null) {
            cleanData[k] = Number(v);
          } else if (typeof v === "string" && (k.endsWith("At") || k === "deadline" || k === "startDate" || k === "endDate")) {
            cleanData[k] = v; // keep ISO date string
          } else if (k === "suggestedKpis" && typeof v === "string") {
            try {
              cleanData[k] = JSON.parse(v);
            } catch {
              cleanData[k] = v;
            }
          } else {
            cleanData[k] = v;
          }
        }

        const docRef = doc(db, colName, docId);
        batch.set(docRef, cleanData);
      }

      await batch.commit();
      totalMigrated += chunk.length;
    }

    console.log(`Successfully migrated ${rows.length} records to ${colName}`);
  }

  console.log(`\nMigration complete! Total documents written: ${totalMigrated}`);
}

runMigration().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
