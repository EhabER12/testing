"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getStudentMembers,
  StudentMember,
} from "@/store/services/studentMemberService";
import {
  getWebsiteSettingsThunk,
  updateWebsiteSettingsThunk,
  SubscriptionTeacher,
} from "@/store/services/settingsService";
import {
  isAuthenticated,
  isAdmin,
  isModerator,
} from "@/store/services/authService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { useCurrency } from "@/hooks/dashboard/useCurrency";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Users,
  UserCircle,
  Mail,
  Phone,
  Search,
  Plus,
  Trash2,
  Edit,
  Calendar,
  Package as PackageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

interface TeacherWithStats {
  teacher: SubscriptionTeacher;
  students: StudentMember[];
  activeStudents: StudentMember[];
  profitPercentage: number;
  totalProfit: number;
}

const normalizeText = (value?: string | null) =>
  (value || "").toString().trim().toLowerCase();

const getTextValue = (value: any, isRtl: boolean): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (isRtl ? value.ar : value.en) || value.en || value.ar || "";
};

const getTeacherKey = (teacher: SubscriptionTeacher, index: number) => {
  if (teacher._id) return teacher._id;
  const nameKey = `${normalizeText(teacher.name?.ar)}|${normalizeText(
    teacher.name?.en
  )}`;
  const emailKey = normalizeText(teacher.email);
  const base = `${nameKey}|${emailKey}`;
  return base === "||" ? `teacher-${index}` : base;
};

const isPayingStudent = (student: StudentMember) =>
  student.status === "active" || student.status === "due_soon";

export default function SubscriptionTeachersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t, isRtl } = useAdminLocale();
  const { formatMoney, baseCurrency } = useCurrency();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacherKey, setSelectedTeacherKey] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] =
    useState<SubscriptionTeacher | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nameAr: "",
    nameEn: "",
    email: "",
    phone: "",
    profitPercentage: "",
    notes: "",
  });

  const { studentMembers, isLoading: studentsLoading } = useAppSelector(
    (state) => state.studentMembers
  );
  const { settings, isLoading: settingsLoading } = useAppSelector(
    (state) => state.settings
  );
  const { user } = useAppSelector((state) => state.auth);

  const subscriptionProfitSettings = settings?.subscriptionStudentProfitSettings;
  const subscriptionProfitEnabled = subscriptionProfitSettings?.enabled ?? true;
  const defaultProfitPercentage =
    subscriptionProfitSettings?.defaultPercentage ?? 35;

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      router.push("/login");
      return;
    }

    if (!isAdmin() && !isModerator()) {
      router.push("/");
      return;
    }

    dispatch(getStudentMembers());
    dispatch(getWebsiteSettingsThunk());
  }, [dispatch, user, router]);

  useEffect(() => {
    if (dialogOpen && !editingTeacher) {
      setFormData({
        nameAr: "",
        nameEn: "",
        email: "",
        phone: "",
        profitPercentage: String(defaultProfitPercentage),
        notes: "",
      });
    }
  }, [dialogOpen, editingTeacher, defaultProfitPercentage]);

  const subscriptionTeachers = settings?.subscriptionTeachers || [];

  const derivedTeachers = useMemo<SubscriptionTeacher[]>(() => {
    const existingTokens = new Set<string>();
    subscriptionTeachers.forEach((teacher) => {
      [teacher.name?.ar, teacher.name?.en, teacher.email]
        .filter(Boolean)
        .forEach((value) => existingTokens.add(normalizeText(value)));
    });

    const names = new Map<string, string>();
    studentMembers.forEach((student) => {
      const rawName = student.assignedTeacherName?.trim();
      const normalized = normalizeText(rawName);
      if (!normalized) return;
      if (!names.has(normalized)) {
        names.set(normalized, rawName || "");
      }
    });

    const derivedList: SubscriptionTeacher[] = [];
    names.forEach((displayName, normalized) => {
      if (existingTokens.has(normalized)) return;
      derivedList.push({
        name: { ar: displayName, en: displayName },
        isActive: true,
      });
    });

    return derivedList;
  }, [studentMembers, subscriptionTeachers]);

  const allTeachers = useMemo(
    () => [...subscriptionTeachers, ...derivedTeachers],
    [subscriptionTeachers, derivedTeachers]
  );

  const teachersWithStats = useMemo<TeacherWithStats[]>(() => {
    return allTeachers.map((teacher) => {
      const teacherTokens = new Set(
        [teacher.name?.ar, teacher.name?.en, teacher.email]
          .filter(Boolean)
          .map((value) => normalizeText(value))
      );

      const students = studentMembers.filter((student) => {
        const assignedName = normalizeText(student.assignedTeacherName);
        return assignedName && teacherTokens.has(assignedName);
      });

      const activeStudents = students.filter(isPayingStudent);
      const profitPercentage = subscriptionProfitEnabled
        ? teacher.profitPercentage ?? defaultProfitPercentage
        : 0;
      const totalProfit = subscriptionProfitEnabled
        ? activeStudents.reduce((sum, student) => {
            const price = Number(student.packagePrice || 0);
            return sum + price * (profitPercentage / 100);
          }, 0)
        : 0;

      return {
        teacher,
        students,
        activeStudents,
        profitPercentage,
        totalProfit,
      };
    });
  }, [
    allTeachers,
    studentMembers,
    defaultProfitPercentage,
    subscriptionProfitEnabled,
  ]);

  const filteredTeachers = teachersWithStats.filter((entry, index) => {
    const teacherKey = getTeacherKey(entry.teacher, index);
    if (selectedTeacherKey !== "all" && teacherKey !== selectedTeacherKey) {
      return false;
    }

    if (!searchQuery.trim()) return true;

    const query = normalizeText(searchQuery);
    const nameAr = normalizeText(entry.teacher.name?.ar);
    const nameEn = normalizeText(entry.teacher.name?.en);
    const email = normalizeText(entry.teacher.email);
    const phone = normalizeText(entry.teacher.phone);

    return (
      nameAr.includes(query) ||
      nameEn.includes(query) ||
      email.includes(query) ||
      phone.includes(query)
    );
  });

  const totalTeachers = allTeachers.length;
  const totalStudents = teachersWithStats.reduce(
    (sum, entry) => sum + entry.students.length,
    0
  );
  const totalActiveStudents = teachersWithStats.reduce(
    (sum, entry) => sum + entry.activeStudents.length,
    0
  );
  const totalProfit = teachersWithStats.reduce(
    (sum, entry) => sum + entry.totalProfit,
    0
  );

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (teacher: SubscriptionTeacher) => {
    setEditingTeacher(teacher);
    setFormData({
      nameAr: teacher.name?.ar || "",
      nameEn: teacher.name?.en || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      profitPercentage: String(
        teacher.profitPercentage ?? defaultProfitPercentage
      ),
      notes: teacher.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSaveTeacher = async () => {
    const nameAr = formData.nameAr.trim();
    const nameEn = formData.nameEn.trim();
    const safeNameAr = nameAr || nameEn;
    const safeNameEn = nameEn || nameAr;

    if (!safeNameAr || !safeNameEn) {
      toast.error(t("admin.subscriptionTeachers.teacherNameRequired"));
      return;
    }

    const profitPercentageValue = Number(formData.profitPercentage);
    const profitPercentage = Number.isFinite(profitPercentageValue)
      ? Math.min(Math.max(profitPercentageValue, 0), 100)
      : defaultProfitPercentage;

    const updatedTeacher: SubscriptionTeacher = {
      ...(editingTeacher?._id ? { _id: editingTeacher._id } : {}),
      name: { ar: safeNameAr, en: safeNameEn },
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      profitPercentage,
      notes: formData.notes.trim(),
      isActive: editingTeacher?.isActive ?? true,
    };

    const canUpdateExisting = Boolean(editingTeacher?._id);
    const updatedList = canUpdateExisting
      ? subscriptionTeachers.map((teacher) =>
          teacher._id === editingTeacher?._id ? updatedTeacher : teacher
        )
      : [...subscriptionTeachers, updatedTeacher];

    setSaving(true);
    try {
      await dispatch(
        updateWebsiteSettingsThunk({ subscriptionTeachers: updatedList })
      ).unwrap();
      toast.success(t("admin.subscriptionTeachers.save"));
      setDialogOpen(false);
      setEditingTeacher(null);
    } catch (error: any) {
      console.error("Failed to save subscription teacher:", error);
      toast.error(
        typeof error === "string" ? error : t("admin.subscriptionTeachers.save")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async (
    teacher: SubscriptionTeacher,
    index: number
  ) => {
    if (!confirm(t("admin.subscriptionTeachers.confirmDelete"))) return;

    if (!teacher._id) {
      toast.error(t("admin.subscriptionTeachers.delete"));
      return;
    }

    const updatedList = subscriptionTeachers.filter((item, itemIndex) => {
      if (teacher._id) return item._id !== teacher._id;
      return itemIndex !== index;
    });

    setSaving(true);
    try {
      await dispatch(
        updateWebsiteSettingsThunk({ subscriptionTeachers: updatedList })
      ).unwrap();
      toast.success(t("admin.subscriptionTeachers.delete"));
    } catch (error: any) {
      console.error("Failed to delete subscription teacher:", error);
      toast.error(
        typeof error === "string" ? error : t("admin.subscriptionTeachers.delete")
      );
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">{t("admin.subscriptionTeachers.active")}</Badge>;
      case "due_soon":
        return <Badge className="bg-yellow-100 text-yellow-800">{t("admin.subscriptionTeachers.dueSoon")}</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">{t("admin.subscriptionTeachers.overdue")}</Badge>;
      case "paused":
        return <Badge className="bg-gray-100 text-gray-800">{t("admin.subscriptionTeachers.paused")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (studentsLoading || settingsLoading) {
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
            {t("admin.subscriptionTeachers.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("admin.subscriptionTeachers.description")}
          </p>
        </div>
        <Button
          className="bg-genoun-green hover:bg-genoun-green/90"
          onClick={handleOpenAdd}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("admin.subscriptionTeachers.addTeacher")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.subscriptionTeachers.totalTeachers")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.subscriptionTeachers.totalStudents")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.subscriptionTeachers.activeStudents")}
            </CardTitle>
            <UserCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalActiveStudents}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.subscriptionTeachers.totalProfit")}
            </CardTitle>
            <UserCircle className="h-4 w-4 text-genoun-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-genoun-green">
              {formatMoney(totalProfit, baseCurrency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.subscriptionTeachers.filterTeacher")}</CardTitle>
          <CardDescription>
            {t("admin.subscriptionTeachers.searchPlaceholder")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search
                className={`absolute top-2.5 h-4 w-4 text-muted-foreground ${
                  isRtl ? "right-2" : "left-2"
                }`}
              />
              <Input
                placeholder={t("admin.subscriptionTeachers.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isRtl ? "pr-8" : "pl-8"}
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                value={selectedTeacherKey}
                onValueChange={setSelectedTeacherKey}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("admin.subscriptionTeachers.filterTeacher")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.subscriptionTeachers.allTeachers")}
                  </SelectItem>
                  {allTeachers.map((teacher, index) => (
                    <SelectItem
                      key={getTeacherKey(teacher, index)}
                      value={getTeacherKey(teacher, index)}
                    >
                      {getTextValue(teacher.name, isRtl) ||
                        teacher.email ||
                        `Teacher ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.subscriptionTeachers.teacherList")}</CardTitle>
          <CardDescription>
            {filteredTeachers.length === 0
              ? t("admin.subscriptionTeachers.noTeachers")
              : `${filteredTeachers.length} / ${totalTeachers}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                {t("admin.subscriptionTeachers.noTeachers")}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t("admin.subscriptionTeachers.noTeachersDesc")}
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredTeachers.map((entry, index) => {
                const teacherName =
                  getTextValue(entry.teacher.name, isRtl) ||
                  entry.teacher.email ||
                  `Teacher ${index + 1}`;
                const teacherKey = getTeacherKey(entry.teacher, index);

                return (
                  <AccordionItem key={teacherKey} value={teacherKey}>
                    <AccordionTrigger className="hover:no-underline">
                      <div
                        className={`flex items-center gap-4 w-full ${
                          isRtl ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`flex items-center gap-3 flex-1 ${
                            isRtl ? "flex-row-reverse" : ""
                          }`}
                        >
                          <div className="h-10 w-10 rounded-full bg-genoun-green/10 flex items-center justify-center">
                            <UserCircle className="h-6 w-6 text-genoun-green" />
                          </div>
                          <div className={isRtl ? "text-right" : "text-left"}>
                            <p className="font-medium">{teacherName}</p>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              {entry.teacher.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {entry.teacher.email}
                                </span>
                              )}
                              {entry.teacher.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {entry.teacher.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`flex items-center gap-2 ${
                            isRtl ? "flex-row-reverse" : ""
                          }`}
                        >
                          <Badge variant="outline" className="bg-blue-50">
                            {entry.students.length}{" "}
                            {t("admin.subscriptionTeachers.students")}
                          </Badge>
                          {entry.activeStudents.length > 0 && (
                            <Badge className="bg-green-100 text-green-800">
                              {entry.activeStudents.length}{" "}
                              {t("admin.subscriptionTeachers.active")}
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {entry.profitPercentage}%{" "}
                            {t("admin.subscriptionTeachers.profit")}
                          </Badge>
                          <Badge className="bg-genoun-green/10 text-genoun-green">
                            {formatMoney(entry.totalProfit, baseCurrency)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(entry.teacher);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 text-red-500 ${
                              entry.teacher._id ? "" : "opacity-50 cursor-not-allowed"
                            }`}
                            disabled={!entry.teacher._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTeacher(entry.teacher, index);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {entry.students.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          {t("admin.subscriptionTeachers.noStudents")}
                        </div>
                      ) : (
                        <div className="overflow-x-auto pt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>
                                  {t("admin.subscriptionTeachers.studentName")}
                                </TableHead>
                                <TableHead>
                                  {t("admin.subscriptionTeachers.phone")}
                                </TableHead>
                                <TableHead>
                                  {t("admin.subscriptionTeachers.package")}
                                </TableHead>
                                <TableHead>
                                  {t("admin.subscriptionTeachers.startDate")}
                                </TableHead>
                                <TableHead>
                                  {t("admin.subscriptionTeachers.nextDue")}
                                </TableHead>
                                <TableHead>
                                  {t("admin.subscriptionTeachers.status")}
                                </TableHead>
                                <TableHead className="text-right">
                                  {t("admin.subscriptionTeachers.studentProfit")}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entry.students.map((student, studentIndex) => {
                                const studentName = getTextValue(
                                  student.studentName || student.name,
                                  isRtl
                                );
                                const profitValue =
                                  Number(student.packagePrice || 0) *
                                  (entry.profitPercentage / 100);

                                return (
                                  <TableRow
                                    key={student.id || student._id || studentIndex}
                                  >
                                    <TableCell className="font-medium">
                                      {studentName}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span dir="ltr">
                                          {student.phone || student.whatsappNumber || "-"}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className="bg-purple-50 text-purple-700 border-purple-200"
                                      >
                                        <PackageIcon className="h-3 w-3 mr-1" />
                                        {student.packageId
                                          ? getTextValue(student.packageId.name, isRtl)
                                          : "-"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        {student.startDate
                                          ? format(new Date(student.startDate), "yyyy-MM-dd")
                                          : "-"}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {student.nextDueDate
                                        ? format(new Date(student.nextDueDate), "yyyy-MM-dd")
                                        : "-"}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                                    <TableCell className="text-right">
                                      {formatMoney(profitValue, baseCurrency)}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]" dir={isRtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>
              {editingTeacher
                ? t("admin.subscriptionTeachers.edit")
                : t("admin.subscriptionTeachers.addTeacher")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.subscriptionTeachers.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="teacher-name-ar">
                {t("admin.subscriptionTeachers.teacherNameAr")}
              </Label>
              <Input
                id="teacher-name-ar"
                value={formData.nameAr}
                onChange={(e) =>
                  setFormData({ ...formData, nameAr: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="teacher-name-en">
                {t("admin.subscriptionTeachers.teacherNameEn")}
              </Label>
              <Input
                id="teacher-name-en"
                value={formData.nameEn}
                onChange={(e) =>
                  setFormData({ ...formData, nameEn: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="teacher-email">
                {t("admin.subscriptionTeachers.email")}
              </Label>
              <Input
                id="teacher-email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="teacher-phone">
                {t("admin.subscriptionTeachers.phone")}
              </Label>
              <Input
                id="teacher-phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="teacher-profit">
                {t("admin.subscriptionTeachers.profitPercentage")}
              </Label>
              <Input
                id="teacher-profit"
                type="number"
                min="0"
                max="100"
                value={formData.profitPercentage}
                onChange={(e) =>
                  setFormData({ ...formData, profitPercentage: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="teacher-notes">
                {t("admin.subscriptionTeachers.notes")}
              </Label>
              <Input
                id="teacher-notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("admin.subscriptionTeachers.cancel")}
            </Button>
            <Button
              onClick={handleSaveTeacher}
              disabled={saving}
              className="bg-genoun-green hover:bg-genoun-green/90"
            >
              {t("admin.subscriptionTeachers.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
