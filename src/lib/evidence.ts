import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Prototype storage: local disk outside /public, served only through the auth-checked
// route in app/api/files/evidence/[name]/route.ts.
export const EVIDENCE_DIR = path.join(process.cwd(), "uploads", "evidence");
export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

export const EVIDENCE_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".csv": "text/csv",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// Stored names are server-generated, so the route can reject anything else (no path traversal).
export const STORED_NAME_PATTERN = /^[0-9a-f-]{36}\.(pdf|png|jpg|jpeg|csv|xlsx)$/;

export async function saveEvidenceFile(file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const ext = path.extname(file.name).toLowerCase();
  if (!EVIDENCE_TYPES[ext]) return { ok: false, error: "Evidence must be a PDF, PNG/JPG image, CSV or Excel (.xlsx) file." };
  if (file.size > MAX_EVIDENCE_BYTES) return { ok: false, error: "Evidence files must be 5 MB or smaller." };

  const stored = `${randomUUID()}${ext}`;
  try {
    await mkdir(EVIDENCE_DIR, { recursive: true });
    await writeFile(path.join(EVIDENCE_DIR, stored), Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    // e.g. Vercel's read-only filesystem
    console.error("saveEvidenceFile failed:", err);
    return { ok: false, error: "File uploads aren't available on this server. Put a link to the evidence in the note instead." };
  }
  return { ok: true, url: `/api/files/evidence/${stored}` };
}
