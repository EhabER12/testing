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
} from "@/store/services/certificateService";
import { getCourses, Course } from "@/store/services/courseService";
import { getAllUsers } from "@/store/services/userService";
import { getStudentMembers } from "@/store/services/studentMemberService";
import { resetStatus } from "@/store/slices/certificateSlice";
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
  MoreHorizontal,
  Download,
  XCircle,
  Award,
  Search,
  CheckCircle,
  Calendar,
  User,
  Plus,
  RefreshCw,
  FileText,
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
  const [issueLoading, setIssueLoading] = useState(false);
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

    if (!isAdmin()) {
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
                        {isRtl ? "شهادة صحيحة ✓" : "Valid Certificate ✓"}
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
    </div>
  );
}
