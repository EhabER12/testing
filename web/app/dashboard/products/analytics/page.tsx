"use client";

import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { useCurrency } from "@/hooks/dashboard/useCurrency";
import {
  getProductAnalytics,
  ProductAnalyticsData,
} from "@/store/services/dashboardService";
import { DateFilter } from "@/components/dashboard/analytics/DateFilter";
import {
  SummaryCards,
  SummaryCardsSkeleton,
  ProductsTable,
} from "@/components/dashboard/products/analytics";

export default function ProductAnalyticsPage() {
  const [data, setData] = useState<ProductAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t, isRtl } = useAdminLocale();
  const { formatMoney } = useCurrency();

  // Date filter state
  const [datePreset, setDatePreset] = useState<string>("30days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Get date range based on preset
  const getDateRange = useCallback(() => {
    if (datePreset === "custom") {
      return { startDate: customStartDate, endDate: customEndDate };
    }

    const today = new Date();
    const endDate = today.toISOString().split("T")[0];
    let startDate = endDate;

    switch (datePreset) {
      case "7days":
        const week = new Date(today);
        week.setDate(today.getDate() - 7);
        startDate = week.toISOString().split("T")[0];
        break;
      case "30days":
        const month = new Date(today);
        month.setDate(today.getDate() - 30);
        startDate = month.toISOString().split("T")[0];
        break;
      case "90days":
        const quarter = new Date(today);
        quarter.setDate(today.getDate() - 90);
        startDate = quarter.toISOString().split("T")[0];
        break;
      case "year":
        startDate = `${today.getFullYear()}-01-01`;
        break;
      case "all":
        return { startDate: undefined, endDate: undefined };
    }

    return { startDate, endDate };
  }, [datePreset, customStartDate, customEndDate]);

  // Fetch data
  const fetchData = useCallback(
    async (showRefreshSpinner = false) => {
      if (showRefreshSpinner) setRefreshing(true);
      try {
        const { startDate, endDate } = getDateRange();
        const result = await getProductAnalytics(startDate, endDate);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch product analytics:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getDateRange]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle date preset change
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    if (preset !== "custom") {
      setLoading(true);
      setTimeout(() => fetchData(), 100);
    }
  };

  // Format currency - using base currency from settings
  const formatCurrency = (val: number) => formatMoney(val);

  // Export to CSV
  const exportToCSV = () => {
    if (!data) return;

    const rows = [
      [
        "Product",
        "Sales",
        "Revenue",
        "Refunds",
        "Refund Amount",
        "Views",
        "Net Revenue",
      ],
      ...data.products.map((p) => {
        const title = typeof p.title === "object" ? p.title.en : p.title;
        return [
          title,
          p.salesCount.toString(),
          p.revenue.toString(),
          p.refundsCount.toString(),
          p.refundAmount.toString(),
          p.views.toString(),
          p.netRevenue.toString(),
        ];
      }),
    ];

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `product-analytics-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <SummaryCardsSkeleton />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="p-4 md:p-8 text-center text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold mb-2">
          {isRtl ? "لا توجد بيانات" : "No Data"}
        </h3>
        <p className="text-sm">
          {isRtl ? "لا توجد مبيعات منتجات بعد" : "No product sales data yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {isRtl ? "تحليلات المنتجات" : "Product Analytics"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isRtl
              ? "تحليلات المبيعات والإيرادات والمرتجعات لكل منتج"
              : "Sales, revenue, and refund analytics per product"}
          </p>
        </div>

        <DateFilter
          datePreset={datePreset}
          onPresetChange={handlePresetChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onStartDateChange={setCustomStartDate}
          onEndDateChange={setCustomEndDate}
          onApplyCustomDate={() => {
            setLoading(true);
            fetchData();
          }}
          onExport={exportToCSV}
          onRefresh={() => fetchData(true)}
          refreshing={refreshing}
          isRtl={isRtl}
        />
      </div>

      {/* Summary Cards */}
      <SummaryCards
        totals={data.totals}
        isRtl={isRtl}
        formatCurrency={formatCurrency}
      />

      {/* Products Table */}
      <ProductsTable
        products={data.products}
        isRtl={isRtl}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
