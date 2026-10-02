import type { PrismaClient } from "@prisma/client";
import { firestorePrisma } from "./firestorePrisma";

// Database switched to Firebase Firestore (bhoomiconnect-d9fc0)
export const prisma = firestorePrisma as unknown as PrismaClient;

export default prisma;

