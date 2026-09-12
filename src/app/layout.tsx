import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Shell } from "@/components/layout/Shell";
import { getNavCounts } from "@/lib/navCounts";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PilotSetu - Innovation Exchange",
  description: "Government-Startup Procurement Exchange",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  const counts = await getNavCounts(userId, role);
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <Shell user={session?.user} counts={counts}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
