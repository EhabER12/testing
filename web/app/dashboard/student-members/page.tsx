"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getStudentMembers,
  deleteStudentMember,
  importStudentMembers,
  exportStudentMembers,
  StudentMember,
} from "@/store/services/studentMemberService";
import { getPackages } from "@/store/services/packageService";
import { bulkIssuePackageCertificates } from "@/store/services/certificateService";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Upload,
  UserCircle,
  Calendar,
  Phone,
  FileText,
  AlertCircle,
  Download,
  Award,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function StudentMembersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t, isRtl } = useAdminLocale();


  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("all");
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>("all");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");
  const [showOverdueOnly, setShowOverdueOnly] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState(false);

  const { studentMembers, isLoading } = useAppSelector((state) => state.studentMembers);
  const { packages } = useAppSelector((state) => state.packages);
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
          ? "هل أنت متأكد من حذف هذا الطالب؟"
          : "Are you sure you want to delete this student?"
      )
    ) {
      setDeleteLoading(id);
      try {
        await dispatch(deleteStudentMember(id)).unwrap();
        toast.success(isRtl ? "تم حذف الطالب بنجاح" : "Student deleted successfully");
        dispatch(getStudentMembers());
      } catch (err) {
        console.error("Failed to delete student:", err);
        toast.error(isRtl ? "فشل حذف الطالب" : "Failed to delete student");
      } finally {
        setDeleteLoading(null);
      }
    }
  };


  const handleGenerateCertificates = async () => {
    if (selectedPackageId === "all") {
      toast.error(isRtl ? "الرجاء اختيار باقة أولاً" : "Please select a package first");
      return;
    }

    if (confirm(isRtl ? "هل أنت متأكد من استخراج شهادات لجميع الطلاب النشطين في هذه الباقة؟" : "Are you sure you want to generate certificates for all active students in this package?")) {
      setGenerateLoading(true);
      try {
        const result = await dispatch(bulkIssuePackageCertificates(selectedPackageId)).unwrap();
        toast.success(
          isRtl
            ? `تم إصدار ${result.data.success.length} شهادة بنجاح`
            : `Successfully issued ${result.data.success.length} certificates`
        );
        if (result.data.failed.length > 0) {
          const failedNames = result.data.failed.map((f: any) => f.name).join("، ");
          const msg = isRtl
            ? `فشل إصدار ${result.data.failed.length} شهادة. الطلاب: ${failedNames}. (السبب غالباً: عدم وجود حساب مستخدم مرتبط)`
            : `Failed to issue ${result.data.failed.length} certificates. Students: ${failedNames}. (Effect: No linked user account)`;

          toast.error(msg, { duration: 6000 });
          console.error("Failed certificates:", result.data.failed);
        }
      } catch (err: any) {
        toast.error(err || "Failed to generate certificates");
      } finally {
        setGenerateLoading(false);
      }
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImportLoading(true);
    try {
      const result = await dispatch(importStudentMembers(importFile)).unwrap();
      setImportResult(result.data); // Assuming backend returns { data: { success: n, failed: n, errors: [] } }
      dispatch(getStudentMembers());
      toast.success(isRtl ? "تم استيراد الملف" : "File imported");
    } catch (err: any) {
      console.error("Import failed:", err);
      toast.error(typeof err === 'string' ? err : "Import failed");
    } finally {
      setImportLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ["name", "phone", "governorate", "plan", "teacher", "start time (YYYY-MM-DD)", "billingDay"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "students_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const filters: any = {};
      if (selectedPackageId !== "all") filters.packageId = selectedPackageId;
      if (selectedGovernorate !== "all") filters.governorate = selectedGovernorate;
      if (selectedTeacherId !== "all") {
        // Check if filtering by text name
        if (selectedTeacherId.startsWith('name:')) {
          filters.assignedTeacherName = selectedTeacherId.replace('name:', '');
        } else {
          filters.assignedTeacherId = selectedTeacherId;
        }
      }
      if (showOverdueOnly) filters.status = "overdue";

      const blob = await exportStudentMembers(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `student_members_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(isRtl ? "تم تصدير البيانات بنجاح" : "Data exported successfully");
    } catch (err: any) {
      console.error("Export failed:", err);
      toast.error(isRtl ? "فشل التصدير" : "Export failed");
    } finally {
      setExportLoading(false);
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
        return <Badge className="bg-green-100 text-green-800">{isRtl ? "نشط" : "Active"}</Badge>;
      case "due_soon":
        return <Badge className="bg-yellow-100 text-yellow-800">{isRtl ? "تجديد قريباً" : "Due Soon"}</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">{isRtl ? "متأخر" : "Overdue"}</Badge>;
      case "paused":
        return <Badge className="bg-gray-100 text-gray-800">{isRtl ? "موقف" : "Paused"}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading && studentMembers.length === 0) {
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
            {isRtl ? "طلاب الباقات" : "Package Students"}
          </h2>
          <p className="text-muted-foreground">
            {isRtl
              ? "إدارة الطلاب المشتركين في الباقات بنظام منفصل"
              : "Manage package-based students"}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedPackageId !== "all" && (
            <Button
              onClick={handleGenerateCertificates}
              disabled={generateLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Award className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
              {generateLoading ? (isRtl ? "جاري الإصدار..." : "Generating...") : (isRtl ? "استخراج الشهادات" : "Generate Certificates")}
            </Button>
          )}
          <Button
            onClick={handleExportCSV}
            disabled={exportLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {exportLoading ? (isRtl ? "جاري التصدير..." : "Exporting...") : (isRtl ? "تصدير CSV" : "Export CSV")}
          </Button>
          <Button onClick={() => {
            setImportDialogOpen(true);
            setImportResult(null);
            setImportFile(null);
          }} className="bg-blue-600 hover:bg-blue-700">
            <Upload className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {isRtl ? "استيراد CSV" : "Import CSV"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRtl ? "إجمالي الطلاب" : "Total Students"}
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
              {isRtl ? "طلاب نشطين" : "Active Students"}
            </CardTitle>
            <UserCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {studentMembers.filter((s) => s.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRtl ? "متأخرين بالدفع" : "Overdue Payment"}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {studentMembers.filter((s) => s.status === "overdue").length}
            </div>
          </CardContent>
        </Card>
      </div>



      <div className="space-y-4">
        <Tabs defaultValue="all" value={selectedPackageId} onValueChange={setSelectedPackageId} dir={isRtl ? "rtl" : "ltr"}>
          <TabsList className="bg-muted/60 p-1 h-auto flex-wrap justify-start">
            <TabsTrigger value="all" className="px-4 py-2">
              {isRtl ? "جميع الباقات" : "All Packages"}
            </TabsTrigger>
            {packages.map(pkg => (
              <TabsTrigger key={pkg.id || pkg._id} value={pkg.id || pkg._id || ""} className="px-4 py-2">
                {isRtl ? pkg.name.ar : pkg.name.en}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{isRtl ? "قائمة الطلاب" : "Students List"}</CardTitle>
              <div className="flex gap-2">
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={isRtl ? "تصفية حسب المعلم" : "Filter by Teacher"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRtl ? "جميع المعلمين" : "All Teachers"}</SelectItem>
                    {Array.from(new Set(
                      studentMembers
                        .filter(s => s.assignedTeacherName)
                        .map(s => s.assignedTeacherName)
                    ))
                      .sort((a, b) => (a || '').localeCompare(b || ''))
                      .map((teacherName) => (
                        <SelectItem key={teacherName} value={`name:${teacherName}`}>
                          {teacherName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={isRtl ? "تصفية حسب المحافظة" : "Filter by Governorate"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRtl ? "جميع المحافظات" : "All Governorates"}</SelectItem>
                    {Array.from(new Set(studentMembers.map(s => s.governorate).filter(Boolean))).sort().map((gov) => (
                      <SelectItem key={gov} value={gov!}>{gov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={showOverdueOnly ? "overdue" : "all"} onValueChange={(val) => setShowOverdueOnly(val === "overdue")}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={isRtl ? "حالة الدفع" : "Payment Status"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRtl ? "جميع الطلاب" : "All Students"}</SelectItem>
                    <SelectItem value="overdue">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                        {isRtl ? "المتأخرين فقط" : "Overdue Only"}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {studentMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                  {isRtl ? "لا يوجد طلاب باقات" : "No package students found"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {isRtl ? "قم باستيراد ملف لملء القائمة" : "Import a file to populate the list"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRtl ? "الاسم" : "Name"}</TableHead>
                      <TableHead>{isRtl ? "رقم الهاتف" : "Phone"}</TableHead>
                      <TableHead>{isRtl ? "المحافظة" : "Governorate"}</TableHead>
                      <TableHead>{isRtl ? "الباقة" : "Plan"}</TableHead>
                      <TableHead>{isRtl ? "المعلم" : "Teacher"}</TableHead>
                      <TableHead>{isRtl ? "تاريخ البداية" : "Start Date"}</TableHead>
                      <TableHead>{isRtl ? "التجديد القادم" : "Next Due"}</TableHead>
                      <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="text-right">
                        {isRtl ? "الإجراءات" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentMembers
                      .filter(s => selectedPackageId === "all" || (s.packageId?.id === selectedPackageId || s.packageId?._id === selectedPackageId))
                      .filter(s => selectedGovernorate === "all" || s.governorate === selectedGovernorate)
                      .filter(s => {
                        if (selectedTeacherId === "all") return true;
                        // Check if filtering by text name
                        if (selectedTeacherId.startsWith('name:')) {
                          const teacherName = selectedTeacherId.replace('name:', '');
                          return s.assignedTeacherName === teacherName;
                        }
                        // Filter by linked teacher ID
                        return s.assignedTeacherId?.id === selectedTeacherId || s.assignedTeacherId?._id === selectedTeacherId;
                      })
                      .filter(s => !showOverdueOnly || s.status === "overdue")
                      .map((student, index) => (
                        <TableRow key={student.id || student._id || index}>
                          <TableCell className="font-medium">
                            {getTextValue(student.studentName || student.name)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span dir="ltr">{student.phone || student.whatsappNumber}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{student.governorate || "-"}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {student.packageId ? getTextValue(student.packageId.name) : (isRtl ? "غير محدد" : "N/A")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UserCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {student.assignedTeacherId 
                                  ? getTextValue(student.assignedTeacherId.fullName)
                                  : (student.assignedTeacherName || (isRtl ? "غير محدد" : "-"))}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.startDate ? format(new Date(student.startDate), "yyyy-MM-dd") : "-"}
                          </TableCell>
                          <TableCell>
                            <div className={`font-medium ${student.status === 'overdue' ? 'text-red-600' :
                              student.status === 'due_soon' ? 'text-orange-600' : ''
                              }`}>
                              {student.nextDueDate ? format(new Date(student.nextDueDate), "yyyy-MM-dd") : "-"}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(student.status)}</TableCell>
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
                                  <Link href={`/dashboard/student-members/${student.id || student._id}`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    {isRtl ? "التفاصيل / تعديل" : "Details / Edit"}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDelete(student.id || student._id || "")}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {isRtl ? "حذف" : "Delete"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    {studentMembers
                      .filter(s => selectedPackageId === "all" || (s.packageId?.id === selectedPackageId || s.packageId?._id === selectedPackageId))
                      .filter(s => selectedGovernorate === "all" || s.governorate === selectedGovernorate)
                      .filter(s => {
                        if (selectedTeacherId === "all") return true;
                        if (selectedTeacherId.startsWith('name:')) {
                          const teacherName = selectedTeacherId.replace('name:', '');
                          return s.assignedTeacherName === teacherName;
                        }
                        return s.assignedTeacherId?.id === selectedTeacherId || s.assignedTeacherId?._id === selectedTeacherId;
                      })
                      .filter(s => !showOverdueOnly || s.status === "overdue").length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          {isRtl ? "لا يوجد طلاب يطابقون الفلاتر المحددة" : "No students match the selected filters"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isRtl ? "استيراد طلاب (CSV)" : "Import Students (CSV)"}</DialogTitle>
            <DialogDescription>
              {isRtl ? "قم برفع ملف CSV. (اسم الباقة يقبل بالعربي أو الإنجليزي)" : "Upload a CSV file. (Plan accepts Arabic or English names)"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-fit">
                <Download className="h-4 w-4 mr-2" />
                {isRtl ? "تحميل نموذج CSV" : "Download Template"}
              </Button>
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="csv-file">{isRtl ? "ملف CSV" : "CSV File"}</Label>
              <Input id="csv-file" type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
            </div>

            {importResult && (
              <div className={`p-4 rounded-md text-sm ${importResult.failed > 0 ? "bg-red-50" : "bg-green-50"}`}>
                <p className="font-bold">
                  {isRtl ? "نتيجة الاستيراد:" : "Import Result:"}
                </p>
                <p className="text-green-700">
                  {isRtl ? `ناجح: ${importResult.success}` : `Success: ${importResult.success}`}
                </p>
                {importResult.failed > 0 && (
                  <div className="mt-2 text-red-700">
                    <p>{isRtl ? `فشل: ${importResult.failed}` : `Failed: ${importResult.failed}`}</p>
                    <ul className="list-disc list-inside mt-1 max-h-32 overflow-y-auto">
                      {importResult.errors.map((err: any, i: number) => (
                        <li key={i}>
                          {isRtl ? `صف ${err.row}: ${err.error}` : `Row ${err.row}: ${err.error}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              {isRtl ? "إغلاق" : "Close"}
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || importLoading}
              className="bg-genoun-green hover:bg-genoun-green/90"
            >
              {importLoading ? (isRtl ? "جاري الرفع..." : "Uploading...") : (isRtl ? "استيراد" : "Import")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
