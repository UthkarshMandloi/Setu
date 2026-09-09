import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";
import MarkReadForm from "./MarkReadForm";

const prisma = new PrismaClient();

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SUCCESS": return <CheckCircle className="text-green-600" size={18} />;
      case "WARNING": return <AlertCircle className="text-yellow-600" size={18} />;
      case "ERROR": return <XCircle className="text-red-600" size={18} />;
      default: return <Info className="text-blue-600" size={18} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SUCCESS": return "border-l-green-500";
      case "WARNING": return "border-l-yellow-500";
      case "ERROR": return "border-l-red-500";
      default: return "border-l-blue-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">Notifications</h1>
          <p className="text-slate-500 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <MarkReadForm />
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto text-slate-400 mb-3" size={48} />
            <p className="text-slate-500">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <Card
              key={notification.id}
              className={`border-l-4 ${getTypeColor(notification.type)} ${
                notification.isRead ? "bg-white" : "bg-blue-50"
              } border-slate-200 shadow-sm`}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className="mt-1">{getTypeIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                    {!notification.isRead && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs border-0">New</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{notification.message}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {notification.link && (
                  <a href={notification.link} className="text-sm text-[#D97706] hover:underline">
                    View
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
