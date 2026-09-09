"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function submitProblemReport(data: {
  title: string;
  description: string;
  location?: string;
  reporter?: string;
}) {
  if (!data.title.trim() || !data.description.trim()) {
    throw new Error("Title and description are required");
  }

  const report = await prisma.unregisteredProblem.create({
    data: {
      title: data.title,
      description: data.description,
      location: data.location || null,
      reporter: data.reporter || "Anonymous",
      status: "PENDING"
    }
  });

  revalidatePath("/admin/community");
  return report;
}
