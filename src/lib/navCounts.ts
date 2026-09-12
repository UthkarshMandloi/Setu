import { prisma } from "@/lib/prisma";

export interface NavCounts {
  openProblems?: number;
  marketplace?: number;
  myProblems?: number;
  reviewPitches?: number;
  myPitches?: number;
  activePilots?: number;
  mySolutions?: number;
  verifications?: number;
  solutionSubmissions?: number;
  communityReports?: number;
  notifications?: number;
}

export async function getNavCounts(userId?: string, role?: string): Promise<NavCounts> {
  try {
    const counts: NavCounts = {};

    // 1. Global counts: Open Problems & Marketplace
    const [openProblemsCount, passportCount, verifiedSolutionCount] = await Promise.all([
      prisma.problem.count({ where: { status: "PUBLISHED" } }),
      prisma.solutionPassport.count({ where: { isPublished: true } }),
      prisma.startupSolution.count({ where: { status: "VERIFIED", isListed: true } }),
    ]);

    if (openProblemsCount > 0) counts.openProblems = openProblemsCount;
    const totalMarketplace = passportCount + verifiedSolutionCount;
    if (totalMarketplace > 0) counts.marketplace = totalMarketplace;

    if (!userId || !role) {
      return counts;
    }

    // 2. User unread notifications
    const unreadNotifications = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    if (unreadNotifications > 0) counts.notifications = unreadNotifications;

    // 3. Role-specific real counts
    if (role === "STARTUP") {
      const profile = await prisma.startupProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (profile) {
        const [pitches, pilots, solutions] = await Promise.all([
          prisma.pitch.count({ where: { startupId: profile.id } }),
          prisma.pilot.count({ where: { pitch: { startupId: profile.id }, status: "IN_PROGRESS" } }),
          prisma.startupSolution.count({ where: { startupId: profile.id } }),
        ]);

        if (pitches > 0) counts.myPitches = pitches;
        if (pilots > 0) counts.activePilots = pilots;
        if (solutions > 0) counts.mySolutions = solutions;
      }
    } else if (role === "GOV_OFFICER") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { departmentId: true },
      });

      if (user?.departmentId) {
        const [deptProblems, deptPitches, deptPilots] = await Promise.all([
          prisma.problem.count({ where: { departmentId: user.departmentId } }),
          prisma.pitch.count({
            where: { problem: { departmentId: user.departmentId }, status: "SUBMITTED" },
          }),
          prisma.pilot.count({
            where: { departmentId: user.departmentId, status: "IN_PROGRESS" },
          }),
        ]);

        if (deptProblems > 0) counts.myProblems = deptProblems;
        if (deptPitches > 0) counts.reviewPitches = deptPitches;
        if (deptPilots > 0) counts.activePilots = deptPilots;
      }
    } else if (role === "GOV_ADMIN" || role === "PLATFORM_ADMIN") {
      const [pendingProfiles, pendingSolutions, pendingReports] = await Promise.all([
        prisma.startupProfile.count({ where: { verificationStatus: "PENDING" } }),
        prisma.startupSolution.count({ where: { status: "PENDING" } }),
        prisma.unregisteredProblem.count({ where: { status: "PENDING" } }),
      ]);

      if (pendingProfiles > 0) counts.verifications = pendingProfiles;
      if (pendingSolutions > 0) counts.solutionSubmissions = pendingSolutions;
      if (pendingReports > 0) counts.communityReports = pendingReports;
    }

    return counts;
  } catch (error) {
    console.error("Error computing nav counts:", error);
    return {};
  }
}
