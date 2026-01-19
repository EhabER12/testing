"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getMyProfile } from "@/store/services/employeeService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Clock,
  DollarSign,
  MapPin,
  CheckCircle,
  AlertCircle,
  ListTodo,
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

export default function MyProfilePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t, locale, isRtl } = useAdminLocale();

  const { currentEmployee, isLoading } = useAppSelector(
    (state) => state.employees
  );
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getMyProfile());
  }, [dispatch]);

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "-";
    return format(new Date(date), "PPP", {
      locale: locale === "ar" ? ar : enUS,
    });
  };

  const formatCurrency = (amount: number | undefined, currency = "EGP") => {
    if (!amount) return "-";
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  if (isLoading && !currentEmployee) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const profile = currentEmployee;

  return (
    <div className="p-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{profile?.name || user?.name}</h1>
          <p className="text-muted-foreground">
            {profile?.employeeInfo?.position || t("admin.myProfile.employee")}
          </p>
        </div>
        <Badge variant={profile?.status === "active" ? "default" : "secondary"}>
          {profile?.status === "active"
            ? t("admin.employees.active")
            : t("admin.employees.inactive")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("admin.employees.basicInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t("admin.employees.name")}
                </p>
                <p className="text-lg font-medium">{profile?.name || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t("admin.employees.email")}
                </p>
                <p className="text-lg flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {profile?.email || "-"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t("admin.employees.phone")}
                </p>
                <p className="text-lg flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {profile?.phone || "-"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t("admin.employees.position")}
                </p>
                <p className="text-lg flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  {profile?.employeeInfo?.position || "-"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t("admin.employees.department")}
                </p>
                <p className="text-lg">
                  {profile?.employeeInfo?.department || "-"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t("admin.employees.hireDate")}
                </p>
                <p className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(profile?.employeeInfo?.hireDate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              {t("admin.employees.taskStats")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  {profile?.taskStats?.total?.completed || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("admin.employees.completed")}
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">
                  {(profile?.taskStats?.total?.pending || 0) +
                    (profile?.taskStats?.total?.in_progress || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("admin.employees.pending")}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">
                  {profile?.taskStats?.thisWeek || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("admin.employees.thisWeek")}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">
                  {profile?.taskStats?.overdue || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("admin.employees.overdue")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salary Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t("admin.employees.salaryInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t("admin.employees.salary")}
              </p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(
                  profile?.employeeInfo?.salary?.amount,
                  profile?.employeeInfo?.salary?.currency
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t("admin.employees.paymentSchedule")}
              </p>
              <p className="text-lg capitalize">
                {profile?.employeeInfo?.salary?.paymentSchedule
                  ? t(
                      `admin.employees.${profile.employeeInfo.salary.paymentSchedule}`
                    )
                  : "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t("admin.employees.activity")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t("admin.employees.lastActivity")}
              </p>
              <p className="text-lg">
                {profile?.activityInfo?.lastActivityAt
                  ? formatDistanceToNow(
                      new Date(profile.activityInfo.lastActivityAt),
                      {
                        addSuffix: true,
                        locale: locale === "ar" ? ar : enUS,
                      }
                    )
                  : "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t("admin.employees.lastLogin")}
              </p>
              <p className="text-lg">
                {formatDate(profile?.activityInfo?.lastLoginAt)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t("admin.employees.loginCount")}
              </p>
              <p className="text-lg">
                {profile?.activityInfo?.loginCount || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t("admin.employees.address")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.employeeInfo?.address?.street ? (
              <div className="space-y-1">
                <p>{profile.employeeInfo.address.street}</p>
                <p className="text-muted-foreground">
                  {[
                    profile.employeeInfo.address.city,
                    profile.employeeInfo.address.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
