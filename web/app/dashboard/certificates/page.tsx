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
  bulkIssuePackageCertificates,
} from "@/store/services/certificateService";
import { getCourses, Course } from "@/store/services/courseService";
import { getAllUsers } from "@/store/services/userService";
import { getStudentMembers, importStudentMembers } from "@/store/services/studentMemberService";
import { getPackages } from "@/store/services/packageService";
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
  const [selectedPackageId, setSelectedPackageId] = useState<string>("all");
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
  const { packages } = useAppSelector((state) => state.packages);
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
    dispatch(getPackages({ isActive: true }));
    dispatch(getAllUsers());
    dispatch(getAllTemplates());
    dispatch(getStudentMembers());
  }, [dispatch, user, router]);

  useEffect(() => {
    if (isSuccess && issueDialog.open) {
      toast.success(isRtl ? "ØªÙ… Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ø´Ù‡Ø§Ø¯Ø© Ø¨Ù†Ø¬Ø§Ø­" : "Certificate issued successfully");
      setIssueDialog({ open: false, userId: "", studentMemberId: "", courseId: "", templateId: "" });
      dispatch(resetStatus());
    }
  }, [isSuccess, issueDialog.open, dispatch, isRtl]);

  const handleRevoke = async (id: string) => {
    if (
      confirm(
        isRtl
          ? "Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø¥Ù„ØºØ§Ø¡ Ù‡Ø°Ù‡ Ø§Ù„Ø´Ù‡Ø§Ø¯Ø©ØŸ"
          : "Are you sure you want to revoke this certificate?"
      )
    ) {
      setRevokeLoading(id);
      try {
        await dispatch(revokeCertificate(id)).unwrap();
        toast.success(isRtl ? "ØªÙ… Ø¥Ù„ØºØ§Ø¡ Ø§Ù„Ø´Ù‡Ø§Ø¯Ø©" : "Certificate revoked");
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
          ? "Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ù‡ Ø§Ù„Ø´Ù‡Ø§Ø¯Ø© Ù†Ù‡Ø§Ø¦ÙŠØ§Ù‹ØŸ Ù‡Ø°Ø§ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø§Ù„ØªØ±Ø§Ø¬Ø¹ Ø¹Ù†Ù‡."
          : "Are you sure you want to permanently delete this certificate? This action cannot be undone."
      )
    ) {
      setDeleteLoading(id);
      try {
        await dispatch(deleteCertificate(id)).unwrap();
        toast.success(isRtl ? "ØªÙ… Ø­Ø°Ù Ø§Ù„Ø´Ù‡Ø§Ø¯Ø©" : "Certificate deleted");
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
            ? "Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ù‡Ø°Ù‡ Ø§Ù„Ø´Ù‡Ø§Ø¯Ø© Ø¥Ù„Ù‰ Ø­Ø§Ù„Ø© Ù…ØµØ¯Ø±Ø©ØŸ"
            : "Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø¥Ù„ØºØ§Ø¡ Ù‡Ø°Ù‡ Ø§Ù„Ø´Ù‡Ø§Ø¯Ø©ØŸ"
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
              ? "ØªÙ… Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„Ø´Ù‡Ø§Ø¯Ø© Ø¨Ù†Ø¬Ø§Ø­" 
              : "ØªÙ… Ø¥Ù„ØºØ§Ø¡ Ø§Ù„Ø´Ù‡Ø§Ø¯Ø© Ø¨Ù†Ø¬Ø§Ø­"
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
      toast.success(isRtl ? "ØªÙ… ØªØ¬Ø¯ÙŠØ¯ PDF Ø¨Ù†Ø¬Ø§Ø­" : "PDF regenerated successfully");
    } catch (err) {
      console.warn("Failed to regenerate PDF:", err);
      toast.error(typeof err === 'string' ? err : "Failed to regenerate PDF");
    } finally {
      setRegenerateLoading(null);
    }
  };

  const handleIssue = async () => {
    if ((!issueDialog.userId && !issueDialog.studentMemberId) || !issueDialog.courseId) {
      toast.error(isRtl ? "ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø·Ø§Ù„Ø¨ ÙˆØ§Ù„Ø¯ÙˆØ±Ø©" : "Please select a student and a course");
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
    if (selectedPackageId === "all") {
      toast.error(isRtl ? "الرجاء اختيار باقة أولاً" : "Please select a package first");
      return;
    }

    if (confirm(isRtl ? "هل أنت متأكد من استخراج شهادات لجميع الطلاب النشطين في هذه الباقة؟" : "Are you sure you want to generate certificates for all active students in this package?")) {
      setGenerateLoading(true);
      try {
        const result = await dispatch(bulkIssuePackageCertificates(selectedPackageId)).unwrap();
        const successCount = result.data?.success?.length || 0;
        const failedCount = result.data?.failed?.length || 0;

        if (successCount > 0) {
          toast.success(
            isRtl
              ? `تم إصدار ${successCount} شهادة بنجاح. جاري التحميل...` : `Successfully issued ${successCount} certificates. Downloading...`
          );

          await dispatch(getCertificates()).unwrap();

          const issuedCertificates = result.data?.success || [];
          let downloadedCount = 0;

          for (const cert of issuedCertificates) {
            const certId = cert.certificateId || cert.certificate?.id || cert.certificate?._id;
            if (certId) {
              try {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const blob = await dispatch(downloadCertificate(certId)).unwrap();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                const nameValue = cert.name;
                const studentName = typeof nameValue === "object"
                  ? (nameValue?.ar || nameValue?.en || `student_${downloadedCount + 1}`)
                  : (nameValue || cert.studentName || `student_${downloadedCount + 1}`);
                link.download = `certificate-${String(studentName).replace(/\\s+/g, "_")}.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
                downloadedCount++;
              } catch (downloadErr) {
                console.error(`Failed to download certificate ${certId}:`, downloadErr);
              }
            }
          }

          if (downloadedCount > 0) {
            toast.success(
              isRtl
                ? `تم تحميل ${downloadedCount} شهادة بنجاح` : `Successfully downloaded ${downloadedCount} certificates`
            );
          }
        }

        if (failedCount > 0) {
          const failedNames = result.data.failed.map((f: any) => {
            const name = f.name;
            return typeof name === "object" ? (name?.ar || name?.en || "Unknown") : (name || "Unknown");
          }).join("، ");
          const msg = isRtl
            ? `فشل إصدار ${failedCount} شهادة. الطلاب: ${failedNames}.` : `Failed to issue ${failedCount} certificates. Students: ${failedNames}.`;

          toast.error(msg, { duration: 6000 });
          console.error("Failed certificates:", result.data.failed);
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
      toast.error(isRtl ? "Ù…Ø¹Ø±Ù Ø§Ù„Ø´Ù‡Ø§Ø¯Ø© ØºÙŠØ± ØµØ§Ù„Ø­" : "Invalid certificate ID");
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "issued":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            {isRtl ? "Ù…ØµØ¯Ø±" : "Issued"}
          </Badge>
        );
      case "revoked":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            {isRtl ? "Ù…Ù„ØºÙŠ" : "Revoked"}
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
            {isRtl ? "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø´Ù‡Ø§Ø¯Ø§Øª" : "Certificates Management"}
          </h2>
          <p className="text-muted-foreground">
            {isRtl
              ? "Ø¹Ø±Ø¶ ÙˆØ¥Ø¯Ø§Ø±Ø© Ø´Ù‡Ø§Ø¯Ø§Øª Ø§Ù„Ø·Ù„Ø§Ø¨"
              : "View and manage student certificates"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/certificates/templates">
            <Button variant="outline">
              <Award className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
              {isRtl ? "ØªØµÙ…ÙŠÙ… Ø§Ù„Ù‚ÙˆØ§Ù„Ø¨" : "Design Templates"}
            </Button>
          </Link>
          <Button
            onClick={() => setIssueDialog({ open: true, userId: "", studentMemberId: "", courseId: "", templateId: "" })}
            className="bg-genoun-green hover:bg-genoun-green/90"
          >
            <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {isRtl ? "Ø¥ØµØ¯Ø§Ø± Ø´Ù‡Ø§Ø¯Ø© ÙŠØ¯ÙˆÙŠØ§Ù‹" : "Issue Manually"}
          </Button>
          <Button
            onClick={() => setVerifyDialog({ open: true, certificateNumber: "" })}
            variant="outline"
          >
            <Search className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {isRtl ? "Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø´Ù‡Ø§Ø¯Ø©" : "Verify Certificate"}
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

      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-900">
            {isRtl ? "إدارة الشهادات الجماعية" : "Bulk Certificates"}
          </CardTitle>
          <CardDescription className="text-purple-700">
            {isRtl
              ? "ارفع شيت الطلاب ثم اختر الباقة لإصدار الشهادات دفعة واحدة"
              : "Upload students CSV then choose a package to issue certificates in bulk"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-2">
            <Label>{isRtl ? "الباقة" : "Package"}</Label>
            <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder={isRtl ? "اختر الباقة" : "Select package"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRtl ? "اختر الباقة" : "Select package"}</SelectItem>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id || pkg._id} value={pkg.id || pkg._id || ""}>
                    {isRtl ? pkg.name.ar : pkg.name.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-purple-700">
              {selectedPackageId === "all"
                ? (isRtl ? "اختر باقة لعرض زر الإصدار الجماعي." : "Choose a package to enable bulk issuing.")
                : (isRtl
                  ? `عدد الطلاب النشطين: ${studentMembers.filter(s => s.status === "active" && (s.packageId?.id === selectedPackageId || s.packageId?._id === selectedPackageId)).length}`
                  : `Active students: ${studentMembers.filter(s => s.status === "active" && (s.packageId?.id === selectedPackageId || s.packageId?._id === selectedPackageId)).length}`)}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
              {isRtl ? "رفع شيت الطلاب (CSV)" : "Upload Students CSV"}
            </Button>
            <Button
              onClick={handleGenerateCertificates}
              disabled={
                generateLoading ||
                selectedPackageId === "all" ||
                studentMembers.filter(s => s.status === "active" && (s.packageId?.id === selectedPackageId || s.packageId?._id === selectedPackageId)).length === 0
              }
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Award className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
              {generateLoading
                ? (isRtl ? "جاري الإصدار..." : "Generating...")
                : (isRtl ? "إصدار شهادات بالجملة" : "Issue Bulk Certificates")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRtl ? "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø´Ù‡Ø§Ø¯Ø§Øª" : "Total Certificates"}
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
              {isRtl ? "Ø§Ù„Ø´Ù‡Ø§Ø¯Ø§Øª Ø§Ù„Ù…ØµØ¯Ø±Ø©" : "Issued"}
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
              {isRtl ? "Ø§Ù„Ø´Ù‡Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ù„ØºØ§Ø©" : "Revoked"}
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
              <CardTitle>{isRtl ? "Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø´Ù‡Ø§Ø¯Ø§Øª" : "All Certificates"}</CardTitle>
              <CardDescription>
                {isRtl
                  ? `${certificates.length} Ø´Ù‡Ø§Ø¯Ø© Ù…ØµØ¯Ø±Ø©`
                  : `${certificates.length} certificates issued`}
              </CardDescription>
            </div>
            <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={isRtl ? "ØªØµÙÙŠØ© Ø­Ø³Ø¨ Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©" : "Filter by Governorate"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRtl ? "Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø§Øª" : "All Governorates"}</SelectItem>
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
                {isRtl ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø´Ù‡Ø§Ø¯Ø§Øª" : "No certificates"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {isRtl
                  ? "Ø³ÙŠØªÙ… Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ø´Ù‡Ø§Ø¯Ø§Øª ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ø¹Ù†Ø¯ Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø·Ù„Ø§Ø¨ Ù„Ù„Ø¯ÙˆØ±Ø§Øª"
                  : "Certificates will be issued automatically when students complete courses"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRtl ? "Ø±Ù‚Ù… Ø§Ù„Ø´Ù‡Ø§Ø¯Ø©" : "Certificate #"}</TableHead>
                  <TableHead>{isRtl ? "Ø§Ù„Ø·Ø§Ù„Ø¨" : "Student"}</TableHead>
                  <TableHead>{isRtl ? "Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©" : "Governorate"}</TableHead>
                  <TableHead>{isRtl ? "Ø§Ù„Ø¯ÙˆØ±Ø© / Ø§Ù„Ø¨Ø§Ù‚Ø©" : "Course / Package"}</TableHead>
                  <TableHead>{isRtl ? "ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¥ØµØ¯Ø§Ø±" : "Issue Date"}</TableHead>
                  <TableHead>{isRtl ? "Ø§Ù„Ø­Ø§Ù„Ø©" : "Status"}</TableHead>
                  <TableHead className="text-right">
                    {isRtl ? "Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª" : "Actions"}
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
                        : (certificate.packageId ? (isRtl ? `Ø¨Ø§Ù‚Ø©: ${getTextValue(certificate.packageId.name)}` : `Package: ${getTextValue(certificate.packageId.name)}`) : "-")}
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
                            {isRtl ? "Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª" : "Actions"}
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleDownload((certificate.id || certificate._id)!)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {isRtl ? "ØªØ­Ù…ÙŠÙ„ PDF" : "Download PDF"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRegeneratePDF((certificate.id || certificate._id)!)}
                            disabled={regenerateLoading === (certificate.id || certificate._id)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {regenerateLoading === (certificate.id || certificate._id)
                              ? isRtl ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ¬Ø¯ÙŠØ¯..." : "Regenerating..."
                              : isRtl ? "ØªØ¬Ø¯ÙŠØ¯ PDF" : "Regenerate PDF"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleReissue((certificate.id || certificate._id)!)}
                            disabled={reissueLoading === (certificate.id || certificate._id)}
                            className={certificate.status === "revoked" ? "" : "text-orange-600"}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {reissueLoading === (certificate.id || certificate._id)
                              ? isRtl ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØºÙŠÙŠØ±..." : "Toggling..."
                              : certificate.status === "revoked"
                                ? isRtl ? "Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„Ø´Ù‡Ø§Ø¯Ø©" : "Restore Certificate"
                                : isRtl ? "Ø¥Ù„ØºØ§Ø¡ Ø§Ù„Ø´Ù‡Ø§Ø¯Ø©" : "Revoke Certificate"}
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
                                    ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ù„ØºØ§Ø¡..."
                                    : "Revoking..."
                                  : isRtl
                                    ? "Ø¥Ù„ØºØ§Ø¡ Ø§Ù„Ø´Ù‡Ø§Ø¯Ø©"
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
                                ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­Ø°Ù..."
                                : "Deleting..."
                              : isRtl
                                ? "Ø­Ø°Ù Ù†Ù‡Ø§Ø¦ÙŠ"
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
                      {isRtl ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø´Ù‡Ø§Ø¯Ø§Øª ØªØ·Ø§Ø¨Ù‚ Ø§Ù„ÙÙ„ØªØ± Ø§Ù„Ù…Ø­Ø¯Ø¯" : "No certificates match the selected filter"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={verifyDialog.open}
        onOpenChange={(open) =>
          setVerifyDialog({ open, certificateNumber: "" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRtl ? "Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø´Ù‡Ø§Ø¯Ø©" : "Verify Certificate"}
            </DialogTitle>
            <DialogDescription>
              {isRtl
                ? "Ø£Ø¯Ø®Ù„ Ø±Ù‚Ù… Ø§Ù„Ø´Ù‡Ø§Ø¯Ø© Ù„Ù„ØªØ­Ù‚Ù‚ Ù…Ù† ØµØ­ØªÙ‡Ø§"
                : "Enter the certificate number to verify its authenticity"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="certificateNumber">
                {isRtl ? "Ø±Ù‚Ù… Ø§Ù„Ø´Ù‡Ø§Ø¯Ø©" : "Certificate Number"}
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
                        ? "Ø§Ù„Ø´Ù‡Ø§Ø¯Ø© ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø© Ø£Ùˆ Ù…Ù„ØºØ§Ø©"
                        : "Certificate not found or revoked"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-semibold text-green-800">
                        {isRtl ? "Ø´Ù‡Ø§Ø¯Ø© ØµØ­ÙŠØ­Ø© âœ“" : "Valid Certificate âœ“"}
                      </p>
                      <p className="text-sm">
                        <strong>{isRtl ? "Ø§Ù„Ø·Ø§Ù„Ø¨:" : "Student:"}</strong>{" "}
                        {getTextValue(verifyResult.userId?.fullName)}
                      </p>
                      <p className="text-sm">
                        <strong>{isRtl ? "Ø§Ù„Ø¯ÙˆØ±Ø©:" : "Course:"}</strong>{" "}
                        {getTextValue(verifyResult.courseId?.title)}
                      </p>
                      <p className="text-sm">
                        <strong>{isRtl ? "ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¥ØµØ¯Ø§Ø±:" : "Issue Date:"}</strong>{" "}
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
              {isRtl ? "Ø¥ØºÙ„Ø§Ù‚" : "Close"}
            </Button>
            <Button
              className="bg-genoun-green hover:bg-genoun-green/90"
              onClick={handleVerify}
              disabled={!verifyDialog.certificateNumber}
            >
              {isRtl ? "Ø§Ù„ØªØ­Ù‚Ù‚" : "Verify"}
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
              {isRtl ? "Ø¥ØµØ¯Ø§Ø± Ø´Ù‡Ø§Ø¯Ø© ÙŠØ¯ÙˆÙŠØ§Ù‹" : "Issue Certificate Manually"}
            </DialogTitle>
            <DialogDescription>
              {isRtl
                ? "Ø§Ø®ØªØ± Ø§Ù„Ø·Ø§Ù„Ø¨ ÙˆØ§Ù„Ø¯ÙˆØ±Ø© Ù„Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ø´Ù‡Ø§Ø¯Ø© Ù„Ù‡ Ù…Ø¨Ø§Ø´Ø±Ø©"
                : "Select a student and a course to issue a certificate immediately"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{isRtl ? "Ø§Ù„Ø·Ø§Ù„Ø¨ (Ù…Ù† Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†)" : "Student (From Users)"}</Label>
              <Select
                value={issueDialog.userId}
                onValueChange={(val) => setIssueDialog({ ...issueDialog, userId: val, studentMemberId: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRtl ? "Ø§Ø®ØªØ± Ø§Ù„Ø·Ø§Ù„Ø¨" : "Select Student"} />
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
              <Label>{isRtl ? "Ø£Ùˆ Ø·Ø§Ù„Ø¨ Ù…Ù† Ø¨Ø§Ù‚Ø©" : "Or Package Student"}</Label>
              <Select
                value={issueDialog.studentMemberId}
                onValueChange={(val) => setIssueDialog({ ...issueDialog, studentMemberId: val, userId: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRtl ? "Ø§Ø®ØªØ± Ø·Ø§Ù„Ø¨ Ø¨Ø§Ù‚Ø©" : "Select Package Student"} />
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
              <Label>{isRtl ? "Ø§Ù„Ø¯ÙˆØ±Ø©" : "Course"}</Label>
              <Select
                value={issueDialog.courseId}
                onValueChange={(val) => setIssueDialog({ ...issueDialog, courseId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRtl ? "Ø§Ø®ØªØ± Ø§Ù„Ø¯ÙˆØ±Ø©" : "Select Course"} />
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
              <Label>{isRtl ? "Ø§Ù„Ù‚Ø§Ù„Ø¨ (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)" : "Template (Optional)"}</Label>
              <Select
                value={issueDialog.templateId}
                onValueChange={(val) => setIssueDialog({ ...issueDialog, templateId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRtl ? "Ø§Ø³ØªØ®Ø¯Ù… Ù‚Ø§Ù„Ø¨ Ø§Ù„Ø¯ÙˆØ±Ø© Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ" : "Use Course Default Template"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {isRtl ? "Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ (Ø­Ø³Ø¨ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø¯ÙˆØ±Ø©)" : "Default (Based on Course Settings)"}
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
              {isRtl ? "Ø¥Ù„ØºØ§Ø¡" : "Cancel"}
            </Button>
            <Button
              className="bg-genoun-green hover:bg-genoun-green/90"
              onClick={handleIssue}
              disabled={issueLoading || ((!issueDialog.userId && !issueDialog.studentMemberId) || !issueDialog.courseId)}
            >
              {issueLoading ? (isRtl ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥ØµØ¯Ø§Ø±..." : "Issuing...") : (isRtl ? "Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ø´Ù‡Ø§Ø¯Ø©" : "Issue Certificate")}
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


