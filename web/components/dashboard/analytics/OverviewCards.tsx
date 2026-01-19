"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Activity, Eye, Clock } from "lucide-react";

interface OverviewCardsProps {
  users: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
  realtimeUsers: number;
  isRtl: boolean;
  formatValue: (val: number | undefined) => string;
  formatDuration: (seconds: number | undefined) => string;
}

export function OverviewCards({
  users,
  sessions,
  pageViews,
  avgSessionDuration,
  realtimeUsers,
  isRtl,
  formatValue,
  formatDuration,
}: OverviewCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {isRtl ? "المستخدمون" : "Users"}
            <Users className="h-4 w-4 text-blue-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {formatValue(users)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {isRtl ? "الجلسات" : "Sessions"}
            <Activity className="h-4 w-4 text-green-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {formatValue(sessions)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {isRtl ? "المشاهدات" : "Page Views"}
            <Eye className="h-4 w-4 text-purple-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {formatValue(pageViews)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-200 dark:border-orange-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {isRtl ? "متوسط الجلسة" : "Avg Session"}
            <Clock className="h-4 w-4 text-orange-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {formatDuration(avgSessionDuration)}
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
        <CardHeader className="pb-2 relative">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {isRtl ? "الآن" : "Live Now"}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-2xl font-bold text-primary">{realtimeUsers}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export function OverviewCardsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}
