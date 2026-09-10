"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";



export async function markAllRead() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await prisma.notification.updateMany({
    where: {
      userId: (session.user as any).id,
      isRead: false
    },
    data: { isRead: true }
  });

  revalidatePath("/notifications");
}

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  link?: string;
}) {
  return await prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || "INFO",
      link: data.link
    }
  });
}
