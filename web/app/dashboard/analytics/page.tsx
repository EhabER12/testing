"use client";

import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import {
  getAnalytics,
  getPageAnalytics,
  AnalyticsData,
  PageDetails,
} from "@/store/services/dashboardService";

// Import modular components
import {
  OverviewCards,
  OverviewCardsSkeleton,
  TrafficSourcesCard,
  DevicesCard,
  TopCountriesCard,
  TopPagesCard,
  PageDetailsModal,
  DateFilter,
} from "@/components/dashboard/analytics";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t, isRtl } = useAdminLocale();

  // Date filter state
  const [datePreset, setDatePreset] = useState<string>("30days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Page detail modal state
  const [selectedPage, setSelectedPage] = useState<PageDetails | null>(null);
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [loadingPageDetails, setLoadingPageDetails] = useState(false);

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
    }

    return { startDate, endDate };
  }, [datePreset, customStartDate, customEndDate]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(
    async (showRefreshSpinner = false) => {
      if (showRefreshSpinner) setRefreshing(true);
      try {
        const { startDate, endDate } = getDateRange();
        const analyticsData = await getAnalytics(startDate, endDate);
        setData(analyticsData);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getDateRange]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Handle date preset change
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    if (preset !== "custom") {
      setLoading(true);
      setTimeout(() => fetchAnalytics(), 100);
    }
  };

  // Fetch page details
  const handlePageClick = async (pagePath: string) => {
    setLoadingPageDetails(true);
    setPageModalOpen(true);
    try {
      const { startDate, endDate } = getDateRange();
      const pageData = await getPageAnalytics(pagePath, startDate, endDate);
      setSelectedPage(pageData);
    } catch (error) {
      console.error("Failed to fetch page details:", error);
      setSelectedPage(null);
    } finally {
      setLoadingPageDetails(false);
    }
  };

  // Helper functions
  const formatValue = (val: number | undefined) => (val || 0).toLocaleString();

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins > 0) {
      return `${mins}${isRtl ? "د" : "m"} ${secs}${isRtl ? "ث" : "s"}`;
    }
    return `${secs}${isRtl ? "ث" : "s"}`;
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!data) return;

    const rows = [
      ["Metric", "Value"],
      ["Total Users", data.overview.users.toString()],
      ["Sessions", data.overview.sessions.toString()],
      ["Page Views", data.overview.pageViews.toString()],
      [
        "Avg Session Duration",
        formatDuration(data.overview.avgSessionDuration),
      ],
      [],
      ["Top Pages", "Views"],
      ...data.topPages.map((p) => [p.path, p.views.toString()]),
      [],
      ["Countries", "Users"],
      ...data.topCountries.map((c) => [c.country, c.users.toString()]),
      [],
      ["Traffic Source", "Medium", "Sessions"],
      ...data.trafficSources.map((s) => [
        s.source,
        s.medium,
        s.sessions.toString(),
      ]),
    ];

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${data.dateRange.startDate}-${data.dateRange.endDate}.csv`;
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
        <OverviewCardsSkeleton />
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="p-4 md:p-8 text-center text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold mb-2">
          {isRtl ? "لا توجد بيانات تحليلية" : "No Analytics Data"}
        </h3>
        <p className="text-sm">
          {isRtl
            ? "تأكد من تكوين Google Analytics بشكل صحيح"
            : "Make sure Google Analytics is properly configured"}
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
            {t("admin.sidebar.analytics")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isRtl
              ? "تحليلات شاملة للموقع من Google Analytics"
              : "Comprehensive website analytics from Google Analytics"}
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
            fetchAnalytics();
          }}
          onExport={exportToCSV}
          onRefresh={() => fetchAnalytics(true)}
          refreshing={refreshing}
          isRtl={isRtl}
        />
      </div>

      {/* Overview Cards */}
      <OverviewCards
        users={data.overview.users}
        sessions={data.overview.sessions}
        pageViews={data.overview.pageViews}
        avgSessionDuration={data.overview.avgSessionDuration}
        realtimeUsers={data.overview.realtimeUsers}
        isRtl={isRtl}
        formatValue={formatValue}
        formatDuration={formatDuration}
      />

      {/* Traffic Sources & Devices */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <TrafficSourcesCard
          trafficSources={data.trafficSources}
          isRtl={isRtl}
        />
        <DevicesCard
          devices={data.devices}
          browsers={data.browsers}
          totalSessions={data.overview.sessions}
          isRtl={isRtl}
        />
      </div>

      {/* Countries & Top Pages */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <TopCountriesCard
          countries={data.topCountries}
          totalUsers={data.overview.users}
          isRtl={isRtl}
        />
        <TopPagesCard
          pages={data.topPages}
          isRtl={isRtl}
          onPageClick={handlePageClick}
        />
      </div>

      {/* Page Details Modal */}
      <PageDetailsModal
        open={pageModalOpen}
        onOpenChange={setPageModalOpen}
        loading={loadingPageDetails}
        pageDetails={selectedPage}
        isRtl={isRtl}
        formatDuration={formatDuration}
      />
    </div>
  );
}
