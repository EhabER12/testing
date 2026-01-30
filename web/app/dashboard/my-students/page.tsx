"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getTeacherStudents } from "@/store/services/userService";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  Loader2,
  UserCheck,
  Package,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

interface Student {
  id: string;
  _id: string;
  fullName: string | { ar?: string; en?: string };
  name: string | { ar?: string; en?: string };
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  status?: string;
  type: "direct" | "subscription";
  createdAt: string;
}

export default function MyStudentsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t, isRtl } = useAdminLocale();

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  const { user } = useAppSelector((state) => state.auth);

  const fetchStudents = async (page = 1, search = "") => {
    if (!user?._id) return;

    setIsLoading(true);
    try {
      const response = await dispatch(
        getTeacherStudents({
          teacherId: user._id,
          params: { page, limit: 20, search },
        })
      ).unwrap();

      // Handle response structure - can be nested in data or direct
      const data = (response as any).data || response;
      const results = data.results || [];
      const pagination = data.pagination || {};
      
      // Map results to include type field if missing
      const mappedStudents = results.map((s: any) => ({
        ...s,
        type: s.type || "direct",
      }));
      
      setStudents(mappedStudents);
      setTotalPages(pagination.pages || data.totalPages || 1);
      setTotalStudents(pagination.total || data.totalResults || results.length);
      setCurrentPage(page);
    } catch (error: any) {
      toast.error(error || "Failed to fetch students");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "teacher") {
      router.push("/dashboard");
      return;
    }

    fetchStudents();
  }, [user, router]);

  const handleSearch = () => {
    fetchStudents(1, searchQuery);
  };

  const getDisplayName = (student: Student): string => {
    const name = student.fullName || student.name;
    if (typeof name === "object" && name !== null) {
      return isRtl ? name.ar || name.en || "-" : name.en || name.ar || "-";
    }
    return name || "-";
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">{t("admin.myStudents.active") || "Active"}</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">{t("admin.myStudents.inactive") || "Inactive"}</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800">{t("admin.myStudents.expired") || "Expired"}</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">{status || "N/A"}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === "subscription") {
      return (
        <Badge variant="outline" className="border-purple-300 text-purple-700">
          <Package className="w-3 h-3 mr-1" />
          {t("admin.myStudents.subscription") || "Subscription"}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-blue-300 text-blue-700">
        <UserCheck className="w-3 h-3 mr-1" />
        {t("admin.myStudents.direct") || "Direct"}
      </Badge>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("admin.myStudents.title") || "My Students"}
        </h1>
        <p className="text-gray-600">
          {t("admin.myStudents.description") || "View and manage students assigned to you"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t("admin.myStudents.totalStudents") || "Total Students"}</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t("admin.myStudents.subscriptionStudents") || "Subscription Students"}</p>
                <p className="text-2xl font-bold">
                  {students.filter((s) => s.type === "subscription").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t("admin.myStudents.directStudents") || "Direct Students"}</p>
                <p className="text-2xl font-bold">
                  {students.filter((s) => s.type === "direct").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("admin.myStudents.searchPlaceholder") || "Search by name, phone, or email..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => fetchStudents(currentPage, searchQuery)}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              {t("admin.common.refresh") || "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.myStudents.studentList") || "Student List"}</CardTitle>
          <CardDescription>
            {t("admin.myStudents.studentListDescription") || "All students assigned to you from courses and subscriptions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {t("admin.myStudents.noStudents") || "No students found"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.myStudents.name") || "Name"}</TableHead>
                    <TableHead>{t("admin.myStudents.contact") || "Contact"}</TableHead>
                    <TableHead>{t("admin.myStudents.type") || "Type"}</TableHead>
                    <TableHead>{t("admin.myStudents.status") || "Status"}</TableHead>
                    <TableHead>{t("admin.myStudents.joinedDate") || "Joined"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student._id || student.id}>
                      <TableCell>
                        <div className="font-medium">{getDisplayName(student)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {(student.phone || student.whatsappNumber) && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {student.phone || student.whatsappNumber}
                            </div>
                          )}
                          {student.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              {student.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(student.type)}</TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {student.createdAt
                            ? format(new Date(student.createdAt), "yyyy-MM-dd")
                            : "-"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    {t("admin.common.page") || "Page"} {currentPage} {t("admin.common.of") || "of"} {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchStudents(currentPage - 1, searchQuery)}
                      disabled={currentPage === 1 || isLoading}
                    >
                      {t("admin.common.previous") || "Previous"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchStudents(currentPage + 1, searchQuery)}
                      disabled={currentPage === totalPages || isLoading}
                    >
                      {t("admin.common.next") || "Next"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
