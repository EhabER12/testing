"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { isAuthenticated, isAdmin, isModerator } from "@/store/services/authService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import {
  Coupon,
  CouponReportResponse,
  createCouponThunk,
  deleteCouponThunk,
  getCouponReportThunk,
  getCouponsThunk,
  updateCouponThunk,
} from "@/store/services/couponService";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calendar, Edit, Plus, RefreshCw, Search, TicketPercent, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

type DiscountType = "percentage" | "fixed";
type AppliesTo = "all" | "checkout" | "package";

interface CouponForm {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: string;
  minOrderAmount: number;
  currency: "EGP" | "SAR" | "USD";
  appliesTo: AppliesTo;
  usageLimit: string;
  perUserLimit: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  limit: number;
}

const defaultForm: CouponForm = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: 10,
  maxDiscountAmount: "",
  minOrderAmount: 0,
  currency: "EGP",
  appliesTo: "all",
  usageLimit: "",
  perUserLimit: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

const toDateTimeInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
};

const toDateInput = (date: Date) => {
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().split("T")[0];
};

const defaultReportFilters = (): ReportFilters => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return {
    startDate: toDateInput(start),
    endDate: toDateInput(end),
    limit: 8,
  };
};

export default function CouponsDashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, isRtl } = useAdminLocale();
  const { user } = useAppSelector((state) => state.auth);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [report, setReport] = useState<CouponReportResponse | null>(null);
  const [reportFilters, setReportFilters] = useState<ReportFilters>(defaultReportFilters());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>(defaultForm);

  const loadCoupons = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await dispatch(getCouponsThunk(undefined)).unwrap();
      setCoupons(data);
    } catch (error: any) {
      toast.error(error || "Failed to load coupons");
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const loadReport = useCallback(
    async (filters: ReportFilters) => {
      try {
        setIsReportLoading(true);
        const data = await dispatch(
          getCouponReportThunk({
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            limit: filters.limit,
          })
        ).unwrap();
        setReport(data);
      } catch (error: any) {
        toast.error(error || "Failed to load report");
      } finally {
        setIsReportLoading(false);
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      router.push("/login");
      return;
    }
    if (!isAdmin() && !isModerator()) {
      router.push("/");
      return;
    }
    void Promise.all([loadCoupons(), loadReport(reportFilters)]);
  }, [router, user, loadCoupons, loadReport]);

  const filteredCoupons = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter(
      (coupon) =>
        coupon.code.toLowerCase().includes(q) ||
        (coupon.description || "").toLowerCase().includes(q)
    );
  }, [coupons, search]);

  const reportCurrency = report?.currency || "EGP";

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat(isRtl ? "ar-SA" : "en-US", {
      style: "currency",
      currency: reportCurrency,
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const formatPercent = (value: number) => `${Number(value || 0).toFixed(1)}%`;

  const openCreate = () => {
    setEditingCoupon(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      discountValue: Number(coupon.discountValue || 0),
      maxDiscountAmount:
        coupon.maxDiscountAmount === null || coupon.maxDiscountAmount === undefined
          ? ""
          : String(coupon.maxDiscountAmount),
      minOrderAmount: Number(coupon.minOrderAmount || 0),
      currency: coupon.currency || "EGP",
      appliesTo: coupon.appliesTo || "all",
      usageLimit:
        coupon.usageLimit === null || coupon.usageLimit === undefined
          ? ""
          : String(coupon.usageLimit),
      perUserLimit:
        coupon.perUserLimit === null || coupon.perUserLimit === undefined
          ? ""
          : String(coupon.perUserLimit),
      startsAt: toDateTimeInput(coupon.startsAt),
      expiresAt: toDateTimeInput(coupon.expiresAt),
      isActive: !!coupon.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    if (form.discountValue <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }
    if (form.discountType === "percentage" && form.discountValue > 100) {
      toast.error("Percentage discount must be at most 100");
      return;
    }

    const payload: Partial<Coupon> = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      minOrderAmount: Number(form.minOrderAmount || 0),
      currency: form.currency,
      appliesTo: form.appliesTo,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : null,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      isActive: form.isActive,
    };

    try {
      setIsSaving(true);
      if (editingCoupon) {
        await dispatch(
          updateCouponThunk({
            id: editingCoupon.id || (editingCoupon as any)._id,
            data: payload,
          })
        ).unwrap();
        toast.success("Coupon updated successfully");
      } else {
        await dispatch(createCouponThunk(payload)).unwrap();
        toast.success("Coupon created successfully");
      }
      setDialogOpen(false);
      await Promise.all([loadCoupons(), loadReport(reportFilters)]);
    } catch (error: any) {
      toast.error(error || "Failed to save coupon");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await dispatch(deleteCouponThunk(id)).unwrap();
      toast.success("Coupon deleted successfully");
      await Promise.all([loadCoupons(), loadReport(reportFilters)]);
    } catch (error: any) {
      toast.error(error || "Failed to delete coupon");
    }
  };

  const applyDatePreset = async (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const next = {
      ...reportFilters,
      startDate: toDateInput(start),
      endDate: toDateInput(end),
    };
    setReportFilters(next);
    await loadReport(next);
  };

  return (
    <div className={`flex-1 space-y-4 p-8 pt-6 ${isRtl ? "text-right" : ""}`} dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("admin.sidebar.coupons") || "Coupons"}</h2>
          <p className="text-muted-foreground">{isRtl ? "إدارة الكوبونات وتقارير الأداء" : "Manage coupons and performance reports"}</p>
        </div>
        <Button onClick={openCreate} className="bg-genoun-green hover:bg-genoun-green/90">
          <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
          {isRtl ? "إنشاء كوبون" : "Create Coupon"}
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {isRtl ? "تقرير الكوبونات" : "Coupon Report"}
          </CardTitle>
          <CardDescription>{isRtl ? "إحصائيات الخصم والاستخدام" : "Discount and redemption analytics"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px]">
              <Label>{isRtl ? "من" : "From"}</Label>
              <Input
                type="date"
                value={reportFilters.startDate}
                onChange={(e) => setReportFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="min-w-[160px]">
              <Label>{isRtl ? "إلى" : "To"}</Label>
              <Input
                type="date"
                value={reportFilters.endDate}
                onChange={(e) => setReportFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="min-w-[120px]">
              <Label>{isRtl ? "أفضل كوبونات" : "Top Coupons"}</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={reportFilters.limit}
                onChange={(e) =>
                  setReportFilters((prev) => ({ ...prev, limit: Math.max(1, Math.min(50, Number(e.target.value || 8))) }))
                }
              />
            </div>
            <Button variant="outline" onClick={() => void applyDatePreset(7)}>7d</Button>
            <Button variant="outline" onClick={() => void applyDatePreset(30)}>30d</Button>
            <Button variant="outline" onClick={() => void applyDatePreset(90)}>90d</Button>
            <Button onClick={() => void loadReport(reportFilters)} disabled={isReportLoading} className="bg-genoun-green hover:bg-genoun-green/90">
              <RefreshCw className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"} ${isReportLoading ? "animate-spin" : ""}`} />
              {isRtl ? "تحديث" : "Refresh"}
            </Button>
          </div>

          {isReportLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-genoun-green border-t-transparent" />
            </div>
          ) : report ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <Card><CardHeader className="pb-2"><CardDescription>{isRtl ? "إجمالي الاستخدام" : "Total Uses"}</CardDescription><CardTitle className="text-2xl">{report.overview.totalRedemptions}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>{isRtl ? "الخصم" : "Discount"}</CardDescription><CardTitle className="text-2xl">{formatMoney(report.overview.totalDiscountAmount)}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>{isRtl ? "الإيراد" : "Net Revenue"}</CardDescription><CardTitle className="text-2xl">{formatMoney(report.overview.totalNetRevenue)}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>{isRtl ? "نجاح" : "Success"}</CardDescription><CardTitle className="text-2xl">{formatPercent(report.overview.successRate)}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>{isRtl ? "الكوبونات المستخدمة" : "Used Coupons"}</CardDescription><CardTitle className="text-2xl">{report.overview.usedCoupons}/{report.overview.totalCoupons}</CardTitle></CardHeader></Card>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle>{isRtl ? "اتجاه يومي" : "Daily Trend"}</CardTitle>
                    <CardDescription>{isRtl ? "استخدام وخصم وإيراد" : "Uses, discount, and revenue"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {report.dailyTrend.length === 0 ? (
                      <div className="py-10 text-center text-muted-foreground">{isRtl ? "لا توجد بيانات" : "No data"}</div>
                    ) : (
                      <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={report.dailyTrend}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="money" />
                            <YAxis yAxisId="uses" orientation={isRtl ? "left" : "right"} />
                            <Tooltip formatter={(value: number, key) => (key === "uses" ? [value, "Uses"] : [formatMoney(Number(value || 0)), key])} />
                            <Area yAxisId="money" type="monotone" dataKey="totalNetRevenue" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} name="Net Revenue" />
                            <Area yAxisId="money" type="monotone" dataKey="totalDiscount" stroke="#f97316" fill="#f97316" fillOpacity={0.2} name="Discount" />
                            <Line yAxisId="uses" type="monotone" dataKey="uses" stroke="#2563eb" strokeWidth={2} dot={false} name="Uses" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{isRtl ? "حسب السياق" : "By Context"}</CardTitle>
                    <CardDescription>Checkout vs Package</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {report.contextBreakdown.length === 0 ? (
                      <div className="text-sm text-muted-foreground">{isRtl ? "لا توجد بيانات" : "No data"}</div>
                    ) : (
                      report.contextBreakdown.map((item) => (
                        <div key={item.context} className="rounded-md border p-3">
                          <div className="mb-1 flex items-center justify-between">
                            <div className="font-medium uppercase">{item.context}</div>
                            <Badge variant="secondary">{item.totalUses}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{isRtl ? "الخصم" : "Discount"}: {formatMoney(item.totalDiscount)}</div>
                          <div className="text-xs text-muted-foreground">{isRtl ? "الإيراد" : "Revenue"}: {formatMoney(item.totalNetRevenue)}</div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{isRtl ? "أفضل الكوبونات" : "Top Coupons"}</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.topCoupons.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">{isRtl ? "لا توجد بيانات" : "No redeemed coupons"}</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isRtl ? "الكود" : "Code"}</TableHead>
                          <TableHead>{isRtl ? "استخدام" : "Uses"}</TableHead>
                          <TableHead>{isRtl ? "نجاح" : "Success"}</TableHead>
                          <TableHead>{isRtl ? "الخصم" : "Discount"}</TableHead>
                          <TableHead>{isRtl ? "الإيراد" : "Revenue"}</TableHead>
                          <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.topCoupons.map((item) => (
                          <TableRow key={item.code}>
                            <TableCell className="font-mono font-semibold">{item.code}</TableCell>
                            <TableCell>{item.totalUses}{item.usageLimit ? ` / ${item.usageLimit}` : ""}</TableCell>
                            <TableCell>{formatPercent(item.successRate)}</TableCell>
                            <TableCell>{formatMoney(item.totalDiscount)}</TableCell>
                            <TableCell>{formatMoney(item.totalNetRevenue)}</TableCell>
                            <TableCell>
                              {item.isActive ? <Badge className="bg-green-100 text-green-800">{isRtl ? "نشط" : "Active"}</Badge> : <Badge variant="secondary">{isRtl ? "غير نشط" : "Inactive"}</Badge>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isRtl ? "البحث" : "Search"}</CardTitle>
          <CardDescription>{isRtl ? "ابحث بالكود أو الوصف" : "Search by code or description"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRtl ? "right-3" : "left-3"}`} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className={isRtl ? "pr-9" : "pl-9"} placeholder={isRtl ? "اكتب الكود أو الوصف..." : "Type code or description..."} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isRtl ? "قائمة الكوبونات" : "Coupons List"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-genoun-green border-t-transparent" /></div>
          ) : filteredCoupons.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground"><TicketPercent className="mx-auto mb-3 h-10 w-10 opacity-40" />{isRtl ? "لا توجد كوبونات" : "No coupons found"}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRtl ? "الكود" : "Code"}</TableHead>
                  <TableHead>{isRtl ? "الخصم" : "Discount"}</TableHead>
                  <TableHead>{isRtl ? "النطاق" : "Scope"}</TableHead>
                  <TableHead>{isRtl ? "الصلاحية" : "Validity"}</TableHead>
                  <TableHead>{isRtl ? "الاستخدام" : "Usage"}</TableHead>
                  <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-right">{isRtl ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.map((coupon) => (
                  <TableRow key={coupon.id || (coupon as any)._id}>
                    <TableCell className="font-mono font-semibold">{coupon.code}</TableCell>
                    <TableCell>{coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `${coupon.discountValue} ${coupon.currency}`}</TableCell>
                    <TableCell><Badge variant="secondary">{coupon.appliesTo}</Badge></TableCell>
                    <TableCell className="text-xs">
                      <div>{coupon.startsAt ? new Date(coupon.startsAt).toLocaleDateString() : isRtl ? "بدون بداية" : "No start"}</div>
                      <div>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : isRtl ? "بدون نهاية" : "No expiry"}</div>
                    </TableCell>
                    <TableCell>{coupon.usageCount || 0}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}</TableCell>
                    <TableCell>{coupon.isActive ? <Badge className="bg-green-100 text-green-800">{isRtl ? "نشط" : "Active"}</Badge> : <Badge variant="secondary">{isRtl ? "غير نشط" : "Inactive"}</Badge>}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(coupon)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(coupon.id || (coupon as any)._id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[650px]" dir={isRtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{editingCoupon ? (isRtl ? "تعديل كوبون" : "Edit Coupon") : (isRtl ? "إنشاء كوبون" : "Create Coupon")}</DialogTitle>
            <DialogDescription>{isRtl ? "حدد نوع الخصم والقيمة والصلاحية." : "Set discount type/value and validity."}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{isRtl ? "كود الكوبون" : "Coupon Code"}</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" />
              </div>
              <div className="grid gap-2">
                <Label>{isRtl ? "النطاق" : "Applies To"}</Label>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value as AppliesTo })}>
                  <option value="all">all</option>
                  <option value="checkout">checkout</option>
                  <option value="package">package</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{isRtl ? "الوصف" : "Description"}</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{isRtl ? "نوع الخصم" : "Discount Type"}</Label>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })}>
                  <option value="percentage">percentage</option>
                  <option value="fixed">fixed</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>{isRtl ? "قيمة الخصم" : "Discount Value"}</Label>
                <Input type="number" min={0} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value || 0) })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>{isRtl ? "العملة" : "Currency"}</Label>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as "EGP" | "SAR" | "USD" })}>
                  <option value="EGP">EGP</option>
                  <option value="SAR">SAR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>{isRtl ? "حد أدنى" : "Min Order"}</Label>
                <Input type="number" min={0} value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value || 0) })} />
              </div>
              <div className="grid gap-2">
                <Label>{isRtl ? "حد أقصى" : "Max Discount"}</Label>
                <Input type="number" min={0} value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} placeholder={isRtl ? "اختياري" : "Optional"} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{isRtl ? "حد الاستخدام الكلي" : "Total Usage Limit"}</Label>
                <Input type="number" min={1} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder={isRtl ? "غير محدود" : "Unlimited"} />
              </div>
              <div className="grid gap-2">
                <Label>{isRtl ? "حد لكل مستخدم" : "Per User Limit"}</Label>
                <Input type="number" min={1} value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} placeholder={isRtl ? "غير محدود" : "Unlimited"} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{isRtl ? "تبدأ في" : "Starts At"}</Label>
                <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>{isRtl ? "تنتهي في" : "Expires At"}</Label>
                <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{isRtl ? "تفعيل الكوبون" : "Coupon Active"}</p>
                <p className="text-xs text-muted-foreground">{isRtl ? "يمكن استخدامه أثناء الدفع" : "Can be used during checkout"}</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{isRtl ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-genoun-green hover:bg-genoun-green/90">
              {isSaving ? (isRtl ? "جارٍ الحفظ..." : "Saving...") : editingCoupon ? (isRtl ? "تحديث" : "Update") : (isRtl ? "إنشاء" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
