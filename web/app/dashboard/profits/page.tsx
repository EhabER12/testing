"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getMyProfitStatsThunk } from "@/store/services/teacherProfitService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { useCurrency } from "@/hooks/dashboard/useCurrency";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  Filter,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function TeacherProfitsPage() {
  const dispatch = useAppDispatch();
  const { t, isRtl } = useAdminLocale();
  const { formatMoney } = useCurrency();
  const { myStats, isLoading, error } = useAppSelector(
    (state) => state.teacherProfit
  );

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    revenueType: "all",
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = () => {
    const params: any = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.revenueType !== "all") params.revenueType = filters.revenueType;
    
    dispatch(getMyProfitStatsThunk(params));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchStats();
  };

  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      revenueType: "all",
    });
    dispatch(getMyProfitStatsThunk());
  };

  return (
    <div
      className={`flex-1 space-y-4 p-4 md:p-8 pt-4 md:pt-6 ${
        isRtl ? "text-right" : ""
      }`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isRtl ? "الأرباح والتفاصيل" : "Profits & Details"}
          </h2>
          <p className="text-muted-foreground">
            {isRtl
              ? "تابع أرباحك من الدورات والاشتراكات"
              : "Track your earnings from courses and subscriptions"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {isRtl ? "تصدير" : "Export"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isRtl ? "من تاريخ" : "From Date"}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-10"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isRtl ? "إلى تاريخ" : "To Date"}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-10"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isRtl ? "النوع" : "Type"}
              </label>
              <Select
                value={filters.revenueType}
                onValueChange={(v) => handleFilterChange("revenueType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRtl ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="course_sale">
                    {isRtl ? "مبيعات الدورات" : "Course Sales"}
                  </SelectItem>
                  <SelectItem value="subscription">
                    {isRtl ? "الاشتراكات" : "Subscriptions"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={applyFilters} className="flex-1 bg-genoun-green hover:bg-genoun-green/90">
                <Filter className="h-4 w-4 mr-2" />
                {isRtl ? "تصفية" : "Filter"}
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                {isRtl ? "إعادة تعيين" : "Reset"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRtl ? "إجمالي الأرباح" : "Total Profit"}
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {myStats ? formatMoney(myStats.totalProfit, myStats.currency) : "0.00"}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              {myStats?.totalTransactions || 0} {isRtl ? "معاملة" : "transactions"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRtl ? "أرباح الدورات" : "Course Earnings"}
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {myStats ? formatMoney(myStats.courseSales?.totalProfit || 0, myStats.currency) : "0.00"}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {isRtl ? "متوسط النسبة" : "Avg Rate"}: {myStats?.courseSales?.avgPercentage || 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRtl ? "أرباح الاشتراكات" : "Subscription Earnings"}
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {myStats ? formatMoney(myStats.subscriptions?.totalProfit || 0, myStats.currency) : "0.00"}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {isRtl ? "متوسط النسبة" : "Avg Rate"}: {myStats?.subscriptions?.avgPercentage || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isRtl ? "سجل المعاملات" : "Transaction History"}</CardTitle>
          <CardDescription>
            {isRtl
              ? "تفاصيل جميع عمليات الربح الخاصة بك"
              : "Detailed history of all your profit transactions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={isRtl ? "text-right" : ""}>
                    {isRtl ? "التاريخ" : "Date"}
                  </TableHead>
                  <TableHead className={isRtl ? "text-right" : ""}>
                    {isRtl ? "النوع" : "Type"}
                  </TableHead>
                  <TableHead className={isRtl ? "text-right" : "text-right"}>
                    {isRtl ? "المبلغ الكلي" : "Total Amount"}
                  </TableHead>
                  <TableHead className={isRtl ? "text-right" : "text-right"}>
                    {isRtl ? "النسبة" : "Percentage"}
                  </TableHead>
                  <TableHead className={isRtl ? "text-right" : "text-right"}>
                    {isRtl ? "ربح المعلم" : "Teacher Profit"}
                  </TableHead>
                  <TableHead className="text-center">
                    {isRtl ? "الحالة" : "Status"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {t("common.loading")}
                    </TableCell>
                  </TableRow>
                ) : myStats?.recentTransactions &&
                  myStats.recentTransactions.length > 0 ? (
                  myStats.recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {format(new Date(tx.transactionDate), "yyyy/MM/dd HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {tx.revenueType === "course_sale" ? (
                            <BookOpen className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Users className="h-4 w-4 text-purple-500" />
                          )}
                          <span>
                            {tx.revenueType === "course_sale"
                              ? isRtl
                                ? "بيع دورة"
                                : "Course Sale"
                              : isRtl
                              ? "اشتراك"
                              : "Subscription"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(tx.totalAmount, tx.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.profitPercentage}%
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        {formatMoney(tx.profitAmount, tx.currency)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            tx.status === "paid"
                              ? "default"
                              : tx.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                          className={
                            tx.status === "paid"
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              : ""
                          }
                        >
                          {tx.status === "paid"
                            ? isRtl
                              ? "مدفوع"
                              : "Paid"
                            : tx.status === "pending"
                            ? isRtl
                              ? "قيد الانتظار"
                              : "Pending"
                            : isRtl
                            ? "ملغي"
                            : "Cancelled"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {isRtl ? "لا توجد معاملات" : "No transactions found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
