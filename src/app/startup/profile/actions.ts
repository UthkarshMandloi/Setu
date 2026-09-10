"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyDocument } from "@/lib/ai/verifyDocument";
import { calculateEligibilityScore } from "@/lib/scoring/eligibility";
import { revalidatePath } from "next/cache";



export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'STARTUP') throw new Error("Unauthorized");
  
  const userId = (session.user as any).id;
  
  await prisma.startupProfile.upsert({
    where: { userId },
    update: {
      companyName: formData.get('companyName') as string,
      cinNumber: formData.get('cinNumber') as string,
      dpiitNumber: formData.get('dpiitNumber') as string,
      sector: formData.get('sector') as string,
      description: formData.get('description') as string,
      website: formData.get('website') as string,
    },
    create: {
      userId,
      companyName: formData.get('companyName') as string,
      cinNumber: formData.get('cinNumber') as string,
      dpiitNumber: formData.get('dpiitNumber') as string,
      sector: formData.get('sector') as string,
      description: formData.get('description') as string,
      website: formData.get('website') as string,
    }
  });

  revalidatePath('/startup/profile');
  return { success: true };
}

export async function uploadDocument(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'STARTUP') throw new Error("Unauthorized");
  
  const userId = (session.user as any).id;
  const profile = await prisma.startupProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  const file = formData.get('file') as File;
  const docType = formData.get('type') as string;
  
  // In a real app we'd upload to S3/local-disk. Mock URL for hackathon:
  const url = `/uploads/${file.name}`;
  
  // Simulated OCR extraction text. 
  // We'll vary it slightly so the mock Gemini has different lengths and returns varied verdicts based on length
  const fakeExtractedText = `This is a simulated ${docType} document for ${profile.companyName}. ` + "X".repeat(Math.floor(Math.random() * 5));

  const aiResult = await verifyDocument(fakeExtractedText, docType);

  await prisma.document.create({
    data: {
      startupId: profile.id,
      type: docType,
      url,
      extractedFields: JSON.stringify(aiResult.fieldsFound),
      aiVerdict: aiResult.verdict,
      aiConfidence: aiResult.confidence
    }
  });

  // Re-calculate eligibility
  const allDocs = await prisma.document.findMany({ where: { startupId: profile.id } });
  const docVerdicts = allDocs.map(d => ({ type: d.type, verdict: d.aiVerdict || 'PENDING' }));
  
  const { score, status } = calculateEligibilityScore(docVerdicts);
  
  await prisma.startupProfile.update({
    where: { id: profile.id },
    data: { eligibilityScore: score, verificationStatus: status }
  });

  revalidatePath('/startup/profile');
  return { success: true, aiResult };
}
