import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import os from "os";

function getDatabaseUrl(): string {
  // Only use /tmp on Vercel environment where filesystem is read-only
  if (process.env.VERCEL) {
    const tmpDir = process.platform === "win32" ? os.tmpdir() : "/tmp";
    const tmpDbPath = path.join(tmpDir, "dev.db");
    try {
      if (!fs.existsSync(tmpDbPath)) {
        const candidates = [
          path.join(process.cwd(), "prisma", "dev.db"),
          path.join(process.cwd(), "dev.db"),
        ];

        let foundSource: string | null = null;
        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            foundSource = candidate;
            break;
          }
        }

        if (foundSource) {
          fs.copyFileSync(foundSource, tmpDbPath);
          console.log(`Copied SQLite database from ${foundSource} to ${tmpDbPath}`);
        } else {
          console.warn("Source SQLite database file not found in build artifact.");
        }
      }
      return `file:${tmpDbPath}`;
    } catch (err) {
      console.error("Error setting up temp SQLite database:", err);
    }
  }

  // Local development or local production server
  const localDb = path.join(process.cwd(), "prisma", "dev.db");
  if (fs.existsSync(localDb)) {
    return `file:${localDb}`;
  }

  return process.env.DATABASE_URL || "file:./prisma/dev.db";
}

const dbUrl = getDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
