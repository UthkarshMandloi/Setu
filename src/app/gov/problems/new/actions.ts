"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";



export async function createProblem(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const theme = formData.get("theme") as string;
  const budgetBand = formData.get("budgetBand") as string;
  const deadline = formData.get("deadline") as string;
  const expectedOutcomes = formData.get("expectedOutcomes") as string;
  const status = formData.get("status") as string;

  await prisma.problem.create({
    data: {
      title,
      description,
      theme,
      budgetBand,
      deadline: deadline ? new Date(deadline) : null,
      expectedOutcomes,
      status: status || "DRAFT",
      sourceType: "OFFICIAL",
      departmentId: (session.user as any).departmentId,
      authorId: (session.user as any).id
    }
  });

  revalidatePath("/gov/problems");
}
