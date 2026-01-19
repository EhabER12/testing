"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import RoleBasedGuard from "@/components/auth/RoleBasedGuard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Search,
  Eye,
  Users,
  Activity,
  CheckCircle,
  Clock,
  Wifi,
  Calendar,
  DollarSign,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getAllEmployees } from "@/store/services/employeeService";
import { resetEmployeeStatus } from "@/store/slices/employeeSlice";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export default function EmployeesDashboardPage() {
  return (
    <RoleBasedGuard allowedRoles={["admin"]} fallbackUrl="/dashboard">
      <EmployeesContent />
    </RoleBasedGuard>
  );
}

function EmployeesContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, isRtl, locale } = useAdminLocale();
  const {
    employees,
    isLoading,
    isError,
    message,
    totalPages,
    currentPage,
    totalEmployees,
  } = useAppSelector((state) => state.employees);

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchEmployees = useCallback(
    (pageNum = 1, search = "", status = "") => {
      setPage(pageNum);
      dispatch(
        getAllEmployees({
          page: pageNum,
          limit: 10,
          search: search || undefined,
          status: status === "all" ? undefined : status,
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    fetchEmployees(1, searchQuery, statusFilter);

    return () => {
      dispatch(resetEmployeeStatus());
    };
  }, [dispatch, fetchEmployees, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmployees(1, searchQuery, statusFilter);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleViewEmployee = (employeeId: string) => {
    router.push(`/dashboard/employees/${employeeId}`);
  };

  const formatLastActivity = (dateStr?: string) => {
    if (!dateStr) return t("admin.employees.neverActive") || "Never";
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: locale === "ar" ? ar : enUS,
      });
    } catch {
      return t("admin.employees.unknown") || "Unknown";
    }
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return "-";
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency: currency || "EGP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate stats
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const activeToday = employees.filter((e) => {
    if (!e.activityInfo?.lastActivityAt) return false;
    const lastActive = new Date(e.activityInfo.lastActivityAt);
    const today = new Date();
    return lastActive.toDateString() === today.toDateString();
  }).length;

  // Render Loading State
  if (isLoading && employees.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {t("admin.employees.title") || "Employee Management"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.employees.subtitle") ||
            "Manage your team members, tasks, and performance"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("admin.employees.totalEmployees") || "Total Employees"}
              </p>
              <p className="text-2xl font-bold">{totalEmployees}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("admin.employees.activeEmployees") || "Active"}
              </p>
              <p className="text-2xl font-bold">{activeEmployees}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-blue-100">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("admin.employees.activeToday") || "Active Today"}
              </p>
              <p className="text-2xl font-bold">{activeToday}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-orange-100">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("admin.employees.pendingTasks") || "Pending Tasks"}
              </p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search
                  className={`absolute ${
                    isRtl ? "right-3" : "left-3"
                  } top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`}
                />
                <Input
                  placeholder={
                    t("admin.employees.searchPlaceholder") ||
                    "Search by name or email..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={isRtl ? "pr-10" : "pl-10"}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {t("admin.common.search") || "Search"}
              </Button>
            </form>

            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue
                  placeholder={t("admin.employees.filterByStatus") || "Status"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("admin.common.all") || "All"}
                </SelectItem>
                <SelectItem value="active">
                  {t("admin.employees.active") || "Active"}
                </SelectItem>
                <SelectItem value="inactive">
                  {t("admin.employees.inactive") || "Inactive"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
          {message || t("admin.common.errorOccurred") || "An error occurred"}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && employees.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("admin.employees.noEmployees") || "No Employees Found"}
            </h3>
            <p className="text-muted-foreground">
              {t("admin.employees.noEmployeesDescription") ||
                "Employees are users with the 'moderator' role. Create a moderator from the Users page."}
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push("/dashboard/users")}
            >
              {t("admin.employees.goToUsers") || "Go to Users"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Employees Table */}
      {employees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t("admin.employees.employeesList") || "Employees List"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t("admin.employees.name") || "Name"}</TableHead>
                  <TableHead className="text-start">{t("admin.employees.email") || "Email"}</TableHead>
                  <TableHead className="text-start">
                    {t("admin.employees.position") || "Position"}
                  </TableHead>
                  <TableHead className="text-start">
                    {t("admin.employees.salary") || "Salary"}
                  </TableHead>
                  <TableHead className="text-start">
                    {t("admin.employees.lastActivity") || "Last Activity"}
                  </TableHead>
                  <TableHead className="text-start">
                    {t("admin.employees.status") || "Status"}
                  </TableHead>
                  <TableHead className="text-start">
                    {t("admin.employees.actions") || "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="inline-block h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  employees.map((employee) => (
                    <TableRow
                      key={employee._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewEmployee(employee._id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {employee.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {employee.name || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {employee.employeeInfo?.department || "-"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        {employee.employeeInfo?.position || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          {formatCurrency(
                            employee.employeeInfo?.salary?.amount,
                            employee.employeeInfo?.salary?.currency
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wifi
                            className={`h-4 w-4 ${
                              employee.activityInfo?.lastActivityAt
                                ? "text-green-500"
                                : "text-gray-300"
                            }`}
                          />
                          <span className="text-sm">
                            {formatLastActivity(
                              employee.activityInfo?.lastActivityAt
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            employee.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewEmployee(employee._id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    fetchEmployees(page - 1, searchQuery, statusFilter)
                  }
                  disabled={page === 1 || isLoading}
                >
                  {t("admin.common.previous") || "Previous"}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t("admin.common.pageOf")
                    ?.replace("{current}", page.toString())
                    ?.replace("{total}", totalPages.toString()) ||
                    `Page ${page} of ${totalPages}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    fetchEmployees(page + 1, searchQuery, statusFilter)
                  }
                  disabled={page === totalPages || isLoading}
                >
                  {t("admin.common.next") || "Next"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
