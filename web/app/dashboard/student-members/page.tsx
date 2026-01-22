"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getAllUsers,
  deleteUser,
} from "@/store/services/userService";
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
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Mail,
  UserCircle,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function StudentMembersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t, isRtl } = useAdminLocale();
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const { users, isLoading, error } = useAppSelector((state) => state.users);
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

    dispatch(getAllUsers());
  }, [dispatch, user, router]);

  const handleDelete = async (id: string) => {
    if (
      confirm(
        isRtl
          ? "هل أنت متأكد من حذف هذا المستخدم؟"
          : "Are you sure you want to delete this user?"
      )
    ) {
      setDeleteLoading(id);
      try {
        await dispatch(deleteUser(id)).unwrap();
      } catch (err) {
        console.error("Failed to delete user:", err);
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  // Filter only regular students (exclude admins and moderators)
  const students = (users?.results || []).filter(
    (user: any) => user.role === "user" || (!user.role && !user.isAdmin)
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-red-100 text-red-800">
            {isRtl ? "مدير" : "Admin"}
          </Badge>
        );
      case "moderator":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            {isRtl ? "مشرف" : "Moderator"}
          </Badge>
        );
      case "teacher":
        return (
          <Badge className="bg-purple-100 text-purple-800">
            {isRtl ? "معلم" : "Teacher"}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-green-100 text-green-800">
            {isRtl ? "طالب" : "Student"}
          </Badge>
        );
    }
  };

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
            {isRtl ? "الطلاب المسجلين" : "Registered Students"}
          </h2>
          <p className="text-muted-foreground">
            {isRtl
              ? "إدارة حسابات الطلاب المسجلين في المنصة"
              : "Manage registered student accounts"}
          </p>
        </div>
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
              {isRtl ? "إجمالي الطلاب" : "Total Students"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRtl ? "طلاب جدد (هذا الشهر)" : "New This Month"}
            </CardTitle>
            <UserCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {students.filter((s: any) => {
                const createdAt = new Date(s.createdAt);
                const now = new Date();
                return (
                  createdAt.getMonth() === now.getMonth() &&
                  createdAt.getFullYear() === now.getFullYear()
                );
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRtl ? "طلاب نشطين" : "Active Students"}
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {students.filter((s: any) => s.status === "active" || !s.status).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isRtl ? "جميع الطلاب" : "All Students"}</CardTitle>
          <CardDescription>
            {isRtl
              ? `${students.length} طالب مسجل`
              : `${students.length} students registered`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                {isRtl ? "لا يوجد طلاب" : "No students"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {isRtl
                  ? "لم يتم تسجيل أي طلاب بعد"
                  : "No students have registered yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRtl ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{isRtl ? "البريد الإلكتروني" : "Email"}</TableHead>
                    <TableHead>{isRtl ? "الدور" : "Role"}</TableHead>
                    <TableHead>{isRtl ? "تاريخ التسجيل" : "Registered"}</TableHead>
                    <TableHead className="text-right">
                      {isRtl ? "الإجراءات" : "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: any, index: number) => (
                    <TableRow key={`student-${student.id || student._id || index}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-muted-foreground" />
                          {student.name || student.fullName || isRtl ? "غير معروف" : "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {student.email}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(student.role || "user")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {student.createdAt
                            ? format(new Date(student.createdAt), "yyyy-MM-dd")
                            : isRtl ? "غير معروف" : "Unknown"}
                        </div>
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
                                href={`/dashboard/users/${student.id || student._id}/edit`}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                {isRtl ? "تعديل" : "Edit"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete((student.id || student._id)!)}
                              disabled={deleteLoading === (student.id || student._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {deleteLoading === (student.id || student._id)
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
