"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  DollarSign,
  RefreshCcw,
  Eye,
  TrendingUp,
} from "lucide-react";

interface ProductTotals {
  totalSales: number;
  totalRevenue: number;
  totalRefunds: number;
  totalRefundAmount: number;
  totalViews: number;
}

interface SummaryCardsProps {
  totals: ProductTotals;
  isRtl: boolean;
  formatCurrency: (val: number) => string;
}

export function SummaryCards({
  totals,
  isRtl,
  formatCurrency,
}: SummaryCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {isRtl ? "إجمالي المبيعات" : "Total Sales"}
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {totals.totalSales}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {isRtl ? "إجمالي الإيرادات" : "Total Revenue"}
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(totals.totalRevenue)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-red-200 dark:border-red-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {isRtl ? "المرتجعات" : "Refunds"}
            <RefreshCcw className="h-4 w-4 text-red-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">
            {totals.totalRefunds}
          </div>
          <p className="text-xs text-red-600 dark:text-red-400">
            {formatCurrency(totals.totalRefundAmount)}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {isRtl ? "المشاهدات" : "Total Views"}
            <Eye className="h-4 w-4 text-purple-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {totals.totalViews.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-200 dark:border-orange-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {isRtl ? "صافي الإيرادات" : "Net Revenue"}
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {formatCurrency(totals.totalRevenue - totals.totalRefundAmount)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SummaryCardsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}
