"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getStudentMembers,
  deleteStudentMember,
  renewSubscription,
} from "@/store/services/studentMemberService";
import { getPackages } from "@/store/services/packageService";
import { isAuthenticated, isAdmin } from "@/store/services/authService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Users,
  Calendar,
  Phone,
  Filter,
  Package as PackageIcon,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function StudentMembersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t, isRtl } = useAdminLocale();
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPackage, setFilterPackage] = useState<string>("all");
  const [renewDialog, setRenewDialog] = useState<{
    open: boolean;
    memberId: string | null;
    endDate: string;
  }>({ open: false, memberId: null, endDate: "" });

  const { studentMembers, isLoading, error } = useAppSelector(
    (state) => state.studentMembers
  );
  const { packages, isLoading: packagesLoading } = useAppSelector((state) => state.packages);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      router.push("/login");
      return;
    }

    if (!isAdmin()) {
      router.push("/");
      return;
    }

    dispatch(getStudentMembers());
    dispatch(getPackages());
  }, [dispatch, user, router]);

  const handleDelete = async (id: string) => {
    if (
      confirm(
        isRtl
          ? "هل أنت متأكد من حذف هذا العضو؟"
          : "Are you sure you want to delete this member?"
      )
    ) {
      setDeleteLoading(id);
      try {
        await dispatch(deleteStudentMember(id)).unwrap();
      } catch (err) {
        console.error("Failed to delete student member:", err);
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const handleRenewSubmit = async () => {
    if (!renewDialog.memberId || !renewDialog.endDate) return;

    try {
      await dispatch(
        renewSubscription({
          id: renewDialog.memberId,
          endDate: renewDialog.endDate,
        })
      ).unwrap();
      setRenewDialog({ open: false, memberId: null, endDate: "" });
    } catch (err) {
      console.error("Failed to renew subscription:", err);
    }
  };

  const getTextValue = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return (isRtl ? value.ar : value.en) || value.en || value.ar || "";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            {isRtl ? "نشط" : "Active"}
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800">
            {isRtl ? "منتهي" : "Expired"}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary">{isRtl ? "ملغي" : "Cancelled"}</Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter students by status and package
  const filteredStudents = studentMembers.filter((member) => {
    // Filter by status
    if (filterStatus !== "all" && member.status !== filterStatus) {
      return false;
    }

    // Filter by package
    if (filterPackage !== "all") {
      if (filterPackage === "no_package") {
        return !member.packageId;
      } else {
        const pkgId = member.packageId?.id || member.packageId?._id;
        return pkgId === filterPackage;
      }
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-genoun-green border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 space-y-4 p-8 pt-6 ${isRtl ? "text-right" : ""}`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isRtl ? "إدارة أعضاء التحفيظ" : "Student Members Management"}
          </h2>
          <p className="text-muted-foreground">
            {isRtl
              ? "إدارة اشتراكات أعضاء التحفيظ والتذكيرات"
              : "Manage student member subscriptions and reminders"}
          </p>
        </div>
        {/* Create functionality disabled - needs to be implemented */}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRtl ? "إجمالي الأعضاء" : "Total Members"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRtl ? "الأعضاء النشطين" : "Active Members"}
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {studentMembers.filter((m) => m.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRtl ? "الاشتراكات المنتهية" : "Expired"}
            </CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {studentMembers.filter((m) => m.status === "expired").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isRtl ? "جميع الأعضاء" : "All Members"}</CardTitle>
          <CardDescription>
            {isRtl
              ? `${studentMembers.length} عضو مسجل`
              : `${studentMembers.length} members registered`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="status-filter" className="mb-2 block">
                {isRtl ? "تصفية حسب الحالة" : "Filter by Status"}
              </Label>
              <select
                id="status-filter"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">{isRtl ? "جميع الحالات" : "All Statuses"}</option>
                <option value="active">{isRtl ? "نشط" : "Active"}</option>
                <option value="due_soon">{isRtl ? "قريب من الانتهاء" : "Due Soon"}</option>
                <option value="overdue">{isRtl ? "متأخر" : "Overdue"}</option>
                <option value="paused">{isRtl ? "متوقف" : "Paused"}</option>
                <option value="expired">{isRtl ? "منتهي" : "Expired"}</option>
                <option value="cancelled">{isRtl ? "ملغي" : "Cancelled"}</option>
              </select>
            </div>
            <div className="flex-1">
              <Label htmlFor="package-filter" className="mb-2 block">
                {isRtl ? "تصفية حسب الباقة" : "Filter by Package"}
              </Label>
              <select
                id="package-filter"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterPackage}
                onChange={(e) => setFilterPackage(e.target.value)}
                disabled={packagesLoading}
              >
                <option value="all">{isRtl ? "جميع الباقات" : "All Packages"}</option>
                <option value="no_package">{isRtl ? "بدون باقة" : "No Package"}</option>
                {packages.map((pkg, index) => (
                  <option key={`pkg-${pkg.id || pkg._id || index}`} value={(pkg.id || pkg._id)!}>
                    {getTextValue(pkg.name)}
                  </option>
                ))}
              </select>
            </div>
            {(filterStatus !== "all" || filterPackage !== "all") && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterPackage("all");
                  }}
                  className="w-full sm:w-auto"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isRtl ? "إزالة الفلاتر" : "Clear Filters"}
                </Button>
              </div>
            )}
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                {isRtl ? "لا يوجد أعضاء" : "No members"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {isRtl
                  ? "ابدأ بإضافة عضو جديد"
                  : "Get started by adding a new member"}
              </p>
              {/* Create functionality disabled - needs to be implemented */}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRtl ? "الاسم" : "Name"}</TableHead>
                  <TableHead>{isRtl ? "الباقة" : "Package"}</TableHead>
                  <TableHead>{isRtl ? "رقم الواتساب" : "WhatsApp"}</TableHead>
                  <TableHead>{isRtl ? "تاريخ البداية" : "Start Date"}</TableHead>
                  <TableHead>{isRtl ? "تاريخ الانتهاء" : "End Date"}</TableHead>
                  <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isRtl ? "التذكيرات" : "Reminders"}</TableHead>
                  <TableHead className="text-right">
                    {isRtl ? "الإجراءات" : "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((member, index) => (
                  <TableRow key={`member-${member.id || member._id || index}`}>
                    <TableCell className="font-medium">
                      {getTextValue(member.studentName)}
                    </TableCell>
                    <TableCell>
                      {member.packageId ? (
                        <Badge variant="outline" className="font-normal">
                          {getTextValue(member.packageId.name)}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {isRtl ? "لا توجد باقة" : "No package"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {member.whatsappNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(
                          new Date(member.subscriptionStartDate),
                          "yyyy-MM-dd"
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(
                          new Date(member.subscriptionEndDate),
                          "yyyy-MM-dd"
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.remindersSent}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>
                            {isRtl ? "الإجراءات" : "Actions"}
                          </DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/student-members/${member.id || member._id}/edit`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              {isRtl ? "تعديل" : "Edit"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setRenewDialog({
                                open: true,
                                memberId: (member.id || member._id)!,
                                endDate: "",
                              })
                            }
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {isRtl ? "تجديد الاشتراك" : "Renew"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete((member.id || member._id)!)}
                            disabled={deleteLoading === (member.id || member._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleteLoading === (member.id || member._id)
                              ? isRtl
                                ? "جاري الحذف..."
                                : "Deleting..."
                              : isRtl
                                ? "حذف"
                                : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={renewDialog.open} onOpenChange={(open) => setRenewDialog({ ...renewDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRtl ? "تجديد الاشتراك" : "Renew Subscription"}
            </DialogTitle>
            <DialogDescription>
              {isRtl
                ? "قم بتحديد تاريخ انتهاء الاشتراك الجديد"
                : "Set the new subscription end date"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="endDate">
                {isRtl ? "تاريخ الانتهاء" : "End Date"}
              </Label>
              <Input
                id="endDate"
                type="date"
                value={renewDialog.endDate}
                onChange={(e) =>
                  setRenewDialog({ ...renewDialog, endDate: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRenewDialog({ open: false, memberId: null, endDate: "" })
              }
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              className="bg-genoun-green hover:bg-genoun-green/90"
              onClick={handleRenewSubmit}
              disabled={!renewDialog.endDate}
            >
              {isRtl ? "تجديد" : "Renew"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
