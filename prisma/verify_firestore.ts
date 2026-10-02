import { db } from "../src/lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

async function verify() {
  const collections = [
    "users",
    "startupProfiles",
    "departments",
    "problems",
    "pitches",
    "pilots",
    "kpis",
    "kpiResults",
    "solutionPassports",
    "marketplaceRequests",
    "unregisteredProblems"
  ];

  for (const c of collections) {
    const snap = await getDocs(collection(db, c));
    console.log(`Collection ${c}: ${snap.size} documents`);
  }
}

verify().catch(console.error);
