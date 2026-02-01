"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getCertificates,
  revokeCertificate,
  reissueCertificate,
  regenerateCertificatePDF,
  verifyCertificate,
  downloadCertificate,
  issueCertificate,
  getAllTemplates,
  deleteCertificate,
} from "@/store/services/certificateService";
import { getCourses } from "@/store/services/courseService";
import { getAllUsers } from "@/store/services/userService";
import { getStudentMembers, importStudentMembers } from "@/store/services/studentMemberService";
import { resetStatus } from "@/store/slices/certificateSlice";
import { isAuthenticated, isAdmin, isModerator } from "@/store/services/authService";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MoreHorizontal,
  Download,
  XCircle,
  Award,
  Upload,
  Search,
  CheckCircle,
  Calendar,
  User,
  Plus,
  RefreshCw,
  FileText,
  Trash2,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function CertificatesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t, isRtl } = useAdminLocale();
  const [revokeLoading, setRevokeLoading] = useState<string | null>(null);
  const [reissueLoading, setReissueLoading] = useState<string | null>(null);
  const [regenerateLoading, setRegenerateLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [issueLoading, setIssueLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("certificates");
  const [bulkGovernorate, setBulkGovernorate] = useState<string>("all");
  const [bulkTeacher, setBulkTeacher] = useState<string>("all");
  const [sheetRows, setSheetRows] = useState<Array<{
    name: string;
    phone: string;
    governorate: string;
    plan: string;
    teacher: string;
    startDate: string;
    billingDay: string;
  }>>([]);
  const [issueDialog, setIssueDialog] = useState({
    open: false,
    userId: "",
    studentMemberId: "",
    courseId: "",
    templateId: "",
  });
  const [verifyDialog, setVerifyDialog] = useState({
    open: false,
    certificateNumber: "",
  });
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>("all");

  const { certificates, templates, isLoading, error, isSuccess } = useAppSelector(
    (state) => state.certificates
  );

  const { courses } = useAppSelector((state) => state.courses);
  const { users } = useAppSelector((state) => state.userManagement);
  const { studentMembers } = useAppSelector((state) => state.studentMembers);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      router.push("/login");
      return;
    }

    if (!isAdmin() && !isModerator()) {
      router.push("/");
      return;
    }

    dispatch(getCertificates());
    dispatch(getCourses({}));
    dispatch(getAllUsers());
    dispatch(getAllTemplates());
    dispatch(getStudentMembers());
  }, [dispatch, user, router]);

  useEffect(() => {
    if (isSuccess && issueDialog.open) {
      toast.success(isRtl ? "تم إصدار الشهادة بنجاح" : "Certificate issued successfully");
      setIssueDialog({ open: false, userId: "", studentMemberId: "", courseId: "", templateId: "" });
      dispatch(resetStatus());
    }
  }, [isSuccess, issueDialog.open, dispatch, isRtl]);

  const handleRevoke = async (id: string) => {
    if (
      confirm(
        isRtl
          ? "هل أنت متأكد من إلغاء هذه الشهادة؟"
          : "Are you sure you want to revoke this certificate?"
      )
    ) {
      setRevokeLoading(id);
      try {
        await dispatch(revokeCertificate(id)).unwrap();
        toast.success(isRtl ? "تم إلغاء الشهادة" : "Certificate revoked");
        dispatch(getCertificates());
      } catch (err) {
        console.warn("Failed to revoke certificate:", err);
        toast.error(typeof err === 'string' ? err : "Failed to revoke certificate");
      } finally {
        setRevokeLoading(null);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        isRtl
          ? "هل أنت متأكد من حذف هذه الشهادة نهائياً؟ هذا الإجراء لا يمكن التراجع عنه."
          : "Are you sure you want to permanently delete this certificate? This action cannot be undone."
      )
    ) {
      setDeleteLoading(id);
      try {
        await dispatch(deleteCertificate(id)).unwrap();
        toast.success(isRtl ? "تم حذف الشهادة" : "Certificate deleted");
      } catch (err) {
        console.warn("Failed to delete certificate:", err);
        toast.error(typeof err === 'string' ? err : "Failed to delete certificate");
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const handleReissue = async (id: string) => {
    const cert = certificates.find(c => (c.id || c._id) === id);
    const isRevoked = cert?.status === "revoked";
    
    if (
      confirm(
        isRtl
          ? isRevoked 
            ? "هل أنت متأكد من استعادة هذه الشهادة إلى حالة مصدرة؟"
            : "هل أنت متأكد من إلغاء هذه الشهادة؟"
          : isRevoked
            ? "Are you sure you want to restore this certificate to issued status?"
            : "Are you sure you want to revoke this certificate?"
      )
    ) {
      setReissueLoading(id);
      try {
        await dispatch(reissueCertificate(id)).unwrap();
        toast.success(
          isRtl 
            ? isRevoked 
              ? "تم استعادة الشهادة بنجاح" 
              : "تم إلغاء الشهادة بنجاح"
            : isRevoked
              ? "Certificate restored successfully"
              : "Certificate revoked successfully"
        );
        dispatch(getCertificates());
      } catch (err) {
        console.warn("Failed to toggle certificate status:", err);
        toast.error(typeof err === 'string' ? err : "Failed to toggle certificate status");
      } finally {
        setReissueLoading(null);
      }
    }
  };

  const handleRegeneratePDF = async (id: string) => {
    setRegenerateLoading(id);
    try {
      await dispatch(regenerateCertificatePDF(id)).unwrap();
      toast.success(isRtl ? "تم تجديد PDF بنجاح" : "PDF regenerated successfully");
    } catch (err) {
      console.warn("Failed to regenerate PDF:", err);
      toast.error(typeof err === 'string' ? err : "Failed to regenerate PDF");
    } finally {
      setRegenerateLoading(null);
    }
  };

  const handleIssue = async () => {
    if ((!issueDialog.userId && !issueDialog.studentMemberId) || !issueDialog.courseId) {
      toast.error(isRtl ? "يرجى اختيار الطالب والدورة" : "Please select a student and a course");
      return;
    }

    setIssueLoading(true);
    try {
      await dispatch(issueCertificate({
        userId: issueDialog.userId || undefined,
        studentMemberId: issueDialog.studentMemberId || undefined,
        courseId: issueDialog.courseId,
        templateId: (issueDialog.templateId && issueDialog.templateId !== "none") ? issueDialog.templateId : undefined
      })).unwrap();
    } catch (err) {
      console.warn("Failed to issue certificate:", err);
      toast.error(typeof err === 'string' ? err : "Failed to issue certificate");
    } finally {
      setIssueLoading(false);
    }
  };

  const handleGenerateCertificates = async () => {
    const filteredRows = sheetRows
      .filter((r) => bulkGovernorate === "all" || r.governorate === bulkGovernorate)
      .filter((r) => bulkTeacher === "all" || r.teacher === bulkTeacher);

    if (filteredRows.length === 0) {
      toast.error(isRtl ? "لا يوجد طلاب من الشيت مطابقين للفلاتر" : "No sheet students match the selected filters");
      return;
    }

    if (confirm(isRtl ? "هل أنت متأكد من استخراج شهادات لجميع الطلاب حسب الفلاتر؟" : "Are you sure you want to generate certificates for all students in these filters?")) {
      setGenerateLoading(true);
      try {
        let successCount = 0;
        let failedCount = 0;
        const failedNames: string[] = [];
        const missingNames: string[] = [];

        const normalizePhone = (value: string) => value.replace(/\\D+/g, "");
        const normalizeName = (value: string) => value.trim().toLowerCase();

        const studentByPhone = new Map<string, any>();
        const studentByName = new Map<string, any>();
        for (const s of studentMembers) {
          const phone = normalizePhone(s.phone || s.whatsappNumber || "");
          if (phone) studentByPhone.set(phone, s);
          const name = normalizeName(getTextValue(s.studentName || s.name) || "");
          if (name) studentByName.set(name, s);
        }

        for (const row of filteredRows) {
          const rowPhone = normalizePhone(row.phone || "");
          const rowName = normalizeName(row.name || "");
          const matchedStudent = rowPhone
            ? studentByPhone.get(rowPhone)
            : (rowName ? studentByName.get(rowName) : null);

          if (!matchedStudent) {
            missingNames.push(row.name || row.phone || "Unknown");
            continue;
          }

          const studentId = matchedStudent.id || matchedStudent._id;
          const packageId = matchedStudent.packageId?.id || matchedStudent.packageId?._id;
          if (!studentId || !packageId) {
            failedCount += 1;
            failedNames.push(getTextValue(matchedStudent.studentName || matchedStudent.name) || "Unknown");
            continue;
          }

          const packageTemplate = templates.find(
            (t: any) => t.packageId === packageId || String(t.packageId) === String(packageId)
          );
          if (!packageTemplate) {
            failedCount += 1;
            failedNames.push(getTextValue(matchedStudent.studentName || matchedStudent.name) || "Unknown");
            continue;
          }

          try {
            const certificate = await dispatch(
              issueCertificate({
                studentMemberId: studentId,
                packageId: packageId,
                templateId: packageTemplate.id || packageTemplate._id,
              })
            ).unwrap();

            const certId = certificate?.id || certificate?._id;
            if (certId) {
              const blob = await dispatch(downloadCertificate(certId)).unwrap();
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              const studentName = getTextValue(matchedStudent.studentName || matchedStudent.name) || "student";
              link.download = `certificate-${studentName.replace(/\\s+/g, "_")}.pdf`;
              link.click();
              window.URL.revokeObjectURL(url);
            }
            successCount += 1;
          } catch (err) {
            failedCount += 1;
            failedNames.push(getTextValue(matchedStudent.studentName || matchedStudent.name) || "Unknown");
            console.error("Failed to issue certificate for student:", studentId, err);
          }
        }

        if (successCount > 0) {
          toast.success(
            isRtl
              ? `تم إصدار ${successCount} شهادة بنجاح` : `Successfully issued ${successCount} certificates`
          );
          await dispatch(getCertificates()).unwrap();
        }

        if (missingNames.length > 0) {
          const msg = isRtl
            ? `لم يتم العثور على ${missingNames.length} طالب من الشيت في النظام: ${missingNames.join("، ")}.`
            : `Could not find ${missingNames.length} sheet students in the system: ${missingNames.join(", ")}.`;
          toast.error(msg, { duration: 6000 });
        }

        if (failedCount > 0) {
          const msg = isRtl
            ? `فشل إصدار ${failedCount} شهادة. الطلاب: ${failedNames.join("، ")}.`
            : `Failed to issue ${failedCount} certificates. Students: ${failedNames.join(", ")}.`;
          toast.error(msg, { duration: 6000 });
        }
      } catch (err: any) {
        console.error("Bulk certificate generation failed:", err);
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
      setImportResult(result.data);
      dispatch(getStudentMembers());
      toast.success(isRtl ? "تم استيراد الملف" : "File imported");
    } catch (err: any) {
      console.error("Import failed:", err);
      toast.error(typeof err === "string" ? err : "Import failed");
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

  const handleVerify = async () => {
    if (!verifyDialog.certificateNumber) return;

    try {
      const result = await dispatch(
        verifyCertificate(verifyDialog.certificateNumber)
      ).unwrap();
      setVerifyResult(result);
    } catch (err) {
      console.warn("Failed to verify certificate:", err);
      setVerifyResult({ error: true });
    }
  };

  const handleDownload = async (id: string) => {
    if (!id || id === 'undefined') {
      toast.error(isRtl ? "معرف الشهادة غير صالح" : "Invalid certificate ID");
      return;
    }
    try {
      const blob = await dispatch(downloadCertificate(id)).unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Failed to download certificate:", err);
    }
  };

  const getTextValue = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return (isRtl ? value.ar : value.en) || value.en || value.ar || "";
  };

  const parseCsv = (csvText: string) => {
    const rows: string[][] = [];
    let current = "";
    let inQuotes = false;
    let row: string[] = [];

    for (let i = 0; i < csvText.length; i += 1) {
      const char = csvText[i];
      const next = csvText[i + 1];

      if (char === "\"") {
        if (inQuotes && next === "\"") {
          current += "\"";
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(current.trim());
        current = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (current !== "" || row.length > 0) {
          row.push(current.trim());
          rows.push(row);
          row = [];
          current = "";
        }
      } else {
        current += char;
      }
    }

    if (current !== "" || row.length > 0) {
      row.push(current.trim());
      rows.push(row);
    }

    return rows;
  };

  const handleSheetFileChange = async (file: File | null) => {
    setImportFile(file);
    if (!file) {
      setSheetRows([]);
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        setSheetRows([]);
        return;
      }

      const header = rows[0].map((h) => h.toLowerCase());
      const getIndex = (key: string) => header.findIndex((h) => h.includes(key));
      const idxName = getIndex("name");
      const idxPhone = getIndex("phone");
      const idxGovernorate = getIndex("governorate");
      const idxPlan = getIndex("plan");
      const idxTeacher = getIndex("teacher");
      const idxStartDate = getIndex("start");
      const idxBilling = getIndex("billing");

      const parsed = rows.slice(1).map((r) => ({
        name: idxName >= 0 ? (r[idxName] || "") : "",
        phone: idxPhone >= 0 ? (r[idxPhone] || "") : "",
        governorate: idxGovernorate >= 0 ? (r[idxGovernorate] || "") : "",
        plan: idxPlan >= 0 ? (r[idxPlan] || "") : "",
        teacher: idxTeacher >= 0 ? (r[idxTeacher] || "") : "",
        startDate: idxStartDate >= 0 ? (r[idxStartDate] || "") : "",
        billingDay: idxBilling >= 0 ? (r[idxBilling] || "") : "",
      })).filter((r) => r.name || r.phone);

      setSheetRows(parsed);
    } catch (err) {
      console.error("Failed to parse CSV:", err);
      setSheetRows([]);
    }
  };

  const getTeacherLabel = (student: any): string => {
    if (student?.assignedTeacherId?.fullName) {
      return getTextValue(student.assignedTeacherId.fullName);
    }
    return student?.assignedTeacherName || "";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "issued":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            {isRtl ? "مصدر" : "Issued"}
          </Badge>
        );
      case "revoked":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            {isRtl ? "ملغي" : "Revoked"}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
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
            {isRtl ? "إدارة الشهادات" : "Certificates Management"}
          </h2>
          <p className="text-muted-foreground">
            {isRtl
              ? "عرض وإدارة شهادات الطلاب"
              : "View and manage student certificates"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/certificates/templates">
            <Button variant="outline">
              <Award className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
              {isRtl ? "تصميم القوالب" : "Design Templates"}
            </Button>
          </Link>
          <Button
            onClick={() => setIssueDialog({ open: true, userId: "", studentMemberId: "", courseId: "", templateId: "" })}
            className="bg-genoun-green hover:bg-genoun-green/90"
          >
            <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {isRtl ? "إصدار شهادة يدوياً" : "Issue Manually"}
          </Button>
          <Button
            onClick={() => setVerifyDialog({ open: true, certificateNumber: "" })}
            variant="outline"
          >
            <Search className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {isRtl ? "التحقق من شهادة" : "Verify Certificate"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/60 p-1 h-auto flex-wrap justify-start">
          <TabsTrigger value="certificates" className="px-4 py-2">
            {isRtl ? "الشهادات" : "Certificates"}
          </TabsTrigger>
          <TabsTrigger value="bulk" className="px-4 py-2">
            {isRtl ? "إصدار بالجملة من الشيت" : "Bulk From Sheet"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {isRtl ? "إجمالي الشهادات" : "Total Certificates"}
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{certificates.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {isRtl ? "الشهادات المصدرة" : "Issued"}
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {certificates.filter((c) => c.status === "issued").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {isRtl ? "الشهادات الملغاة" : "Revoked"}
                </CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {certificates.filter((c) => c.status === "revoked").length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{isRtl ? "جميع الشهادات" : "All Certificates"}</CardTitle>
                  <CardDescription>
                    {isRtl
                      ? `${certificates.length} شهادة مصدرة`
                      : `${certificates.length} certificates issued`}
                  </CardDescription>
                </div>
                <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={isRtl ? "تصفية حسب المحافظة" : "Filter by Governorate"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRtl ? "جميع المحافظات" : "All Governorates"}</SelectItem>
                    {Array.from(new Set(certificates.map(c => c.governorate).filter(Boolean))).sort().map((gov) => (
                      <SelectItem key={gov} value={gov!}>{gov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {certificates.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">
                    {isRtl ? "لا توجد شهادات" : "No certificates"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isRtl
                      ? "سيتم إصدار الشهادات تلقائياً عند إتمام الطلاب للدورات"
                      : "Certificates will be issued automatically when students complete courses"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRtl ? "رقم الشهادة" : "Certificate #"}</TableHead>
                      <TableHead>{isRtl ? "الطالب" : "Student"}</TableHead>
                      <TableHead>{isRtl ? "المحافظة" : "Governorate"}</TableHead>
                      <TableHead>{isRtl ? "الدورة / الباقة" : "Course / Package"}</TableHead>
                      <TableHead>{isRtl ? "تاريخ الإصدار" : "Issue Date"}</TableHead>
                      <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="text-right">
                        {isRtl ? "الإجراءات" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates
                      .filter(c => selectedGovernorate === "all" || c.governorate === selectedGovernorate)
                      .map((certificate, index) => (
                      <TableRow key={certificate.id || certificate._id || `cert-${index}`}>
                        <TableCell className="font-mono font-medium">
                          {certificate.certificateNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {certificate.userId
                              ? getTextValue(certificate.userId.fullName)
                              : (certificate.studentName ? getTextValue(certificate.studentName) : "-")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{certificate.governorate || "-"}</span>
                        </TableCell>
                        <TableCell>
                          {certificate.courseId
                            ? getTextValue(certificate.courseId.title)
                            : (certificate.packageId ? (isRtl ? `باقة: ${getTextValue(certificate.packageId.name)}` : `Package: ${getTextValue(certificate.packageId.name)}`) : "-")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {certificate.issuedAt ? format(new Date(certificate.issuedAt), "yyyy-MM-dd") : "-"}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(certificate.status)}</TableCell>
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
                              <DropdownMenuItem
                                onClick={() => handleDownload((certificate.id || certificate._id)!)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {isRtl ? "تحميل PDF" : "Download PDF"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRegeneratePDF((certificate.id || certificate._id)!)}
                                disabled={regenerateLoading === (certificate.id || certificate._id)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                {regenerateLoading === (certificate.id || certificate._id)
                                  ? isRtl ? "جاري التجديد..." : "Regenerating..."
                                  : isRtl ? "تجديد PDF" : "Regenerate PDF"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleReissue((certificate.id || certificate._id)!)}
                                disabled={reissueLoading === (certificate.id || certificate._id)}
                                className={certificate.status === "revoked" ? "" : "text-orange-600"}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                {reissueLoading === (certificate.id || certificate._id)
                                  ? isRtl ? "جاري التغيير..." : "Toggling..."
                                  : certificate.status === "revoked"
                                    ? isRtl ? "استعادة الشهادة" : "Restore Certificate"
                                    : isRtl ? "إلغاء الشهادة" : "Revoke Certificate"}
                              </DropdownMenuItem>
                              {certificate.status === "issued" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleRevoke((certificate.id || certificate._id)!)}
                                    disabled={revokeLoading === (certificate.id || certificate._id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    {revokeLoading === (certificate.id || certificate._id)
                                      ? isRtl
                                        ? "جاري الإلغاء..."
                                        : "Revoking..."
                                      : isRtl
                                        ? "إلغاء الشهادة"
                                        : "Revoke"}
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete((certificate.id || certificate._id)!)}
                                disabled={deleteLoading === (certificate.id || certificate._id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {deleteLoading === (certificate.id || certificate._id)
                                  ? isRtl
                                    ? "جاري الحذف..."
                                    : "Deleting..."
                                  : isRtl
                                    ? "حذف نهائي"
                                    : "Delete Permanently"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {certificates.filter(c => selectedGovernorate === "all" || c.governorate === selectedGovernorate).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          {isRtl ? "لا توجد شهادات تطابق الفلتر المحدد" : "No certificates match the selected filter"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{isRtl ? "طلاب الشيت" : "Sheet Students"}</CardTitle>
                  <CardDescription>
                    {isRtl
                      ? `${sheetRows.length} طالب في الشيت`
                      : `${sheetRows.length} students in sheet`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sheetRows.length === 0 ? (
                <div className="text-center py-10">
                  <User className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">
                    {isRtl ? "لا توجد بيانات من الشيت" : "No sheet data"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isRtl ? "ارفع ملف CSV أولاً" : "Upload a CSV file first"}
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
                        <TableHead>{isRtl ? "تاريخ البدء" : "Start Date"}</TableHead>
                        <TableHead>{isRtl ? "يوم التجديد" : "Billing Day"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sheetRows
                        .filter((r) => bulkGovernorate === "all" || r.governorate === bulkGovernorate)
                        .filter((r) => bulkTeacher === "all" || r.teacher === bulkTeacher)
                        .map((row, index) => (
                          <TableRow key={`sheet-${index}`}>
                            <TableCell className="font-medium">{row.name || "-"}</TableCell>
                            <TableCell dir="ltr">{row.phone || "-"}</TableCell>
                            <TableCell>{row.governorate || "-"}</TableCell>
                            <TableCell>{row.plan || "-"}</TableCell>
                            <TableCell>{row.teacher || "-"}</TableCell>
                            <TableCell>{row.startDate || "-"}</TableCell>
                            <TableCell>{row.billingDay || "-"}</TableCell>
                          </TableRow>
                        ))}
                      {sheetRows
                        .filter((r) => bulkGovernorate === "all" || r.governorate === bulkGovernorate)
                        .filter((r) => bulkTeacher === "all" || r.teacher === bulkTeacher).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            {isRtl ? "لا توجد بيانات تطابق الفلتر" : "No rows match the filters"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-900">
                {isRtl ? "إدارة الشهادات من الشيت" : "Bulk Certificates From Sheet"}
              </CardTitle>
              <CardDescription className="text-purple-700">
                {isRtl
                  ? "ارفع الشيت ثم استورد الطلاب، وبعدها فلتر بالمعلم أو المحافظة لإصدار الشهادات"
                  : "Upload the sheet, import students, then filter by teacher or governorate to issue certificates"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-wrap gap-2">
                  <div className="grid gap-2">
                    <Label>{isRtl ? "المعلم" : "Teacher"}</Label>
                    <Select value={bulkTeacher} onValueChange={setBulkTeacher}>
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder={isRtl ? "تصفية حسب المعلم" : "Filter by Teacher"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRtl ? "جميع المعلمين" : "All Teachers"}</SelectItem>
                        {Array.from(new Set(sheetRows.map((r) => r.teacher).filter(Boolean))).sort().map((teacher) => (
                          <SelectItem key={teacher} value={teacher!}>{teacher}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>{isRtl ? "المحافظة" : "Governorate"}</Label>
                    <Select value={bulkGovernorate} onValueChange={setBulkGovernorate}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder={isRtl ? "تصفية حسب المحافظة" : "Filter by Governorate"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isRtl ? "جميع المحافظات" : "All Governorates"}</SelectItem>
                        {Array.from(new Set(sheetRows.map(r => r.governorate).filter(Boolean))).sort().map((gov) => (
                          <SelectItem key={gov} value={gov!}>{gov}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                    <Upload className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                    {isRtl ? "رفع شيت الطلاب (CSV)" : "Upload Students CSV"}
                  </Button>
                  <Button
                    onClick={handleGenerateCertificates}
                    disabled={generateLoading || sheetRows.length === 0}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Award className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                    {generateLoading
                      ? (isRtl ? "جاري الإصدار..." : "Generating...")
                      : (isRtl ? "إصدار شهادات بالجملة" : "Issue Bulk Certificates")}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-purple-700">
                {isRtl
                  ? `عدد طلاب الشيت بعد الفلتر: ${sheetRows
                      .filter((r) => bulkGovernorate === "all" || r.governorate === bulkGovernorate)
                      .filter((r) => bulkTeacher === "all" || r.teacher === bulkTeacher).length}`
                  : `Sheet students after filters: ${sheetRows
                      .filter((r) => bulkGovernorate === "all" || r.governorate === bulkGovernorate)
                      .filter((r) => bulkTeacher === "all" || r.teacher === bulkTeacher).length}`}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={verifyDialog.open}
        onOpenChange={(open) =>
          setVerifyDialog({ open, certificateNumber: "" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRtl ? "التحقق من شهادة" : "Verify Certificate"}
            </DialogTitle>
            <DialogDescription>
              {isRtl
                ? "أدخل رقم الشهادة للتحقق من صحتها"
                : "Enter the certificate number to verify its authenticity"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="certificateNumber">
                {isRtl ? "رقم الشهادة" : "Certificate Number"}
              </Label>
              <Input
                id="certificateNumber"
                placeholder="CERT-XXXX-XXXX"
                value={verifyDialog.certificateNumber}
                onChange={(e) =>
                  setVerifyDialog({
                    ...verifyDialog,
                    certificateNumber: e.target.value,
                  })
                }
              />
            </div>
            {verifyResult && (
              <Card
                className={
                  verifyResult.error
                    ? "border-red-200 bg-red-50"
                    : "border-green-200 bg-green-50"
                }
              >
                <CardContent className="pt-6">
                  {verifyResult.error ? (
                    <p className="text-red-800">
                      {isRtl
                        ? "الشهادة غير موجودة أو ملغاة"
                        : "Certificate not found or revoked"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-semibold text-green-800">
                        {isRtl ? "شهادة صحيحة ✓" : "Valid Certificate âœ“"}
                      </p>
                      <p className="text-sm">
                        <strong>{isRtl ? "الطالب:" : "Student:"}</strong>{" "}
                        {getTextValue(verifyResult.userId?.fullName)}
                      </p>
                      <p className="text-sm">
                        <strong>{isRtl ? "الدورة:" : "Course:"}</strong>{" "}
                        {getTextValue(verifyResult.courseId?.title)}
                      </p>
                      <p className="text-sm">
                        <strong>{isRtl ? "تاريخ الإصدار:" : "Issue Date:"}</strong>{" "}
                        {verifyResult.issuedAt ? format(new Date(verifyResult.issuedAt), "yyyy-MM-dd") : "-"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVerifyDialog({ open: false, certificateNumber: "" });
                setVerifyResult(null);
              }}
            >
              {isRtl ? "إغلاق" : "Close"}
            </Button>
            <Button
              className="bg-genoun-green hover:bg-genoun-green/90"
              onClick={handleVerify}
              disabled={!verifyDialog.certificateNumber}
            >
              {isRtl ? "التحقق" : "Verify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={issueDialog.open}
        onOpenChange={(open) =>
          setIssueDialog({ open, userId: "", studentMemberId: "", courseId: "", templateId: "" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRtl ? "إصدار شهادة يدوياً" : "Issue Certificate Manually"}
            </DialogTitle>
            <DialogDescription>
              {isRtl
                ? "اختر الطالب والدورة لإصدار الشهادة له مباشرة"
                : "Select a student and a course to issue a certificate immediately"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{isRtl ? "الطالب (من المستخدمين)" : "Student (From Users)"}</Label>
              <Select
                value={issueDialog.userId}
                onValueChange={(val) => setIssueDialog({ ...issueDialog, userId: val, studentMemberId: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRtl ? "اختر الطالب" : "Select Student"} />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => u && (u.id || u._id) && String(u.id || u._id) !== "").map((u, index) => (
                    <SelectItem key={u.id || u._id || `user-${index}`} value={String(u.id || u._id)}>
                      {u.fullName ? getTextValue(u.fullName) : u.name || u.email} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{isRtl ? "أو طالب من باقة" : "Or Package Student"}</Label>
              <Select
                value={issueDialog.studentMemberId}
                onValueChange={(val) => setIssueDialog({ ...issueDialog, studentMemberId: val, userId: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRtl ? "اختر طالب باقة" : "Select Package Student"} />
                </SelectTrigger>
                <SelectContent>
                  {studentMembers.filter(s => s && (s.id || s._id) && String(s.id || s._id) !== "").map((s, index) => (
                    <SelectItem key={s.id || s._id || `student-${index}`} value={String(s.id || s._id)}>
                      {getTextValue(s.name || s.studentName)} - {s.phone} {s.packageId ? `(${getTextValue(s.packageId.name)})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{isRtl ? "الدورة" : "Course"}</Label>
              <Select
                value={issueDialog.courseId}
                onValueChange={(val) => setIssueDialog({ ...issueDialog, courseId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRtl ? "اختر الدورة" : "Select Course"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.filter(c => c && (c.id || c._id) && String(c.id || c._id) !== "" && c.certificateSettings?.enabled).map((c, index) => (
                    <SelectItem key={c.id || c._id || `course-${index}`} value={String(c.id || c._id)}>
                      {getTextValue(c.title)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{isRtl ? "القالب (اختياري)" : "Template (Optional)"}</Label>
              <Select
                value={issueDialog.templateId}
                onValueChange={(val) => setIssueDialog({ ...issueDialog, templateId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRtl ? "استخدم قالب الدورة الافتراضي" : "Use Course Default Template"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {isRtl ? "الافتراضي (حسب إعدادات الدورة)" : "Default (Based on Course Settings)"}
                  </SelectItem>
                  {templates.filter(t => t && (t.id || t._id) && String(t.id || t._id) !== "").map((t, index) => (
                    <SelectItem key={t.id || t._id || `tpl-${index}`} value={String(t.id || t._id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIssueDialog({ open: false, userId: "", studentMemberId: "", courseId: "", templateId: "" });
              }}
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              className="bg-genoun-green hover:bg-genoun-green/90"
              onClick={handleIssue}
              disabled={issueLoading || ((!issueDialog.userId && !issueDialog.studentMemberId) || !issueDialog.courseId)}
            >
              {issueLoading ? (isRtl ? "جاري الإصدار..." : "Issuing...") : (isRtl ? "إصدار الشهادة" : "Issue Certificate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isRtl ? "استيراد طلاب (CSV)" : "Import Students (CSV)"}</DialogTitle>
            <DialogDescription>
              {isRtl ? "قم برفع ملف CSV. (اسم الباقة يقبل بالعربي أو الإنجليزي)" : "Upload a CSV file. (Plan accepts Arabic or English names)"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className={`h-4 w-4 text-blue-600 ${isRtl ? "ml-2" : "mr-2"}`} />
              <AlertDescription className="text-blue-800 text-sm">
                {isRtl ? (
                  <>
                    <strong>ملاحظة مهمة للمعلمين:</strong> عند رفع ملف CSV، يجب إدخال اسم المعلم بالضبط كما هو مسجل في النظام (بالعربي أو الإنجليزي). هذا يضمن ربط كل معلم بطلاب الباقة الخاصة به بشكل صحيح.
                  </>
                ) : (
                  <>
                    <strong>Important Notice for Teachers:</strong> When uploading a CSV file, you must enter the teacher's name exactly as it is registered in the system (in Arabic or English). This ensures proper linking between each teacher and their package students.
                  </>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-fit">
                <Download className="h-4 w-4 mr-2" />
                {isRtl ? "تحميل نموذج CSV" : "Download Template"}
              </Button>
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="csv-file">{isRtl ? "ملف CSV" : "CSV File"}</Label>
              <Input id="csv-file" type="file" accept=".csv" onChange={(e) => handleSheetFileChange(e.target.files?.[0] || null)} />
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



