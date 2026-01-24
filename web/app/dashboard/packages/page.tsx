"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getPackageStats,
} from "@/store/services/packageService";
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
  Edit,
  Trash2,
  Package as PackageIcon,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
} from "lucide-react";
import type { Package, CreatePackageData } from "@/store/services/packageService";

export default function PackagesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t, isRtl } = useAdminLocale();

  const { packages, isLoading, error } = useAppSelector(
    (state) => state.packages
  );
  const { user } = useAppSelector((state) => state.auth);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState<CreatePackageData>({
    name: { ar: "", en: "" },
    description: { ar: "", en: "" },
    name: { ar: "", en: "" },
    description: { ar: "", en: "" },
    price: 0,
    currency: "EGP",
    duration: { value: 1, unit: "month" },
    limits: {},
    features: [],
    isActive: true,
    isPopular: false,
    displayOrder: 0,
  });
  const [currentLang, setCurrentLang] = useState<"ar" | "en">("ar");
  const [featureInput, setFeatureInput] = useState({ ar: "", en: "" });

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      router.push("/login");
      return;
    }

    if (!isAdmin()) {
      router.push("/");
      return;
    }

    dispatch(getPackages());
  }, [dispatch, user, router]);

  const handleOpenDialog = (pkg?: Package) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        description: pkg.description || { ar: "", en: "" },
        name: pkg.name,
        description: pkg.description || { ar: "", en: "" },
        price: pkg.price,
        currency: pkg.currency,
        duration: pkg.duration,
        limits: pkg.limits || {},
        features: pkg.features || [],
        isActive: pkg.isActive,
        isPopular: pkg.isPopular,
        displayOrder: pkg.displayOrder,
      });
    } else {
      setEditingPackage(null);
      setFormData({
        name: { ar: "", en: "" },
        description: { ar: "", en: "" },
        name: { ar: "", en: "" },
        description: { ar: "", en: "" },
        price: 0,
        currency: "EGP",
        duration: { value: 1, unit: "month" },
        limits: {},
        features: [],
        isActive: true,
        isPopular: false,
        displayOrder: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingPackage) {
        await dispatch(
          updatePackage({ id: editingPackage.id || (editingPackage as any)._id, data: formData })
        ).unwrap();
      } else {
        await dispatch(createPackage(formData)).unwrap();
      }
      setDialogOpen(false);
      dispatch(getPackages());
    } catch (err) {
      console.error("Failed to save package:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        t("admin.packages.confirmDelete") ||
        "Are you sure you want to delete this package?"
      )
    ) {
      try {
        await dispatch(deletePackage(id)).unwrap();
        dispatch(getPackages());
      } catch (err) {
        console.error("Failed to delete package:", err);
      }
    }
  };

  const addFeature = () => {
    if (featureInput.ar || featureInput.en) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), featureInput],
      });
      setFeatureInput({ ar: "", en: "" });
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features?.filter((_, i) => i !== index) || [],
    });
  };

  const getTextValue = (value: any, lang: "ar" | "en" = currentLang): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.en || value.ar || "";
  };

  const formatCurrency = (price: number, currency: string) => {
    return `${price.toLocaleString()} ${currency}`;
  };

  if (isLoading && packages.length === 0) {
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
            {t("admin.packages.title") || "Packages Management"}
          </h2>
          <p className="text-muted-foreground">
            {t("admin.packages.description") ||
              "Manage subscription packages and pricing"}
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-genoun-green hover:bg-genoun-green/90"
        >
          <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
          {t("admin.packages.createPackage") || "Create Package"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.packages.title") || "Total Packages"}
            </CardTitle>
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.packages.activeCount") || "Active Packages"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packages.filter((p) => p.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.packages.enrolledCount") || "Total Enrolled"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packages.reduce((acc, p) => acc + (p.stats?.enrolledCount || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.packages.revenue") || "Total Revenue"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packages
                .reduce((acc, p) => acc + (p.stats?.revenue || 0), 0)
                .toLocaleString()}{" "}
              EGP
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Packages Table */}
      {packages.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <PackageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">
              {t("admin.packages.noPackages") || "No packages found"}
            </p>
            <p className="text-muted-foreground">
              {t("admin.packages.createFirst") ||
                "Create your first package to get started"}
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              className="mt-4 bg-genoun-green hover:bg-genoun-green/90"
            >
              <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
              {t("admin.packages.createPackage") || "Create Package"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.packages.packageName") || "Package Name"}</TableHead>
                <TableHead>{t("admin.packages.price") || "Price"}</TableHead>
                <TableHead>{t("admin.packages.duration") || "Duration"}</TableHead>
                <TableHead>{t("admin.packages.enrolledCount") || "Enrolled"}</TableHead>
                <TableHead>{t("admin.packages.isActive") || "Status"}</TableHead>
                <TableHead className="text-right">
                  {t("admin.common.actions") || "Actions"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg, index) => (
                <TableRow key={`${pkg.id || pkg._id || "pkg"}-${index}`}>
                  <TableCell className="font-medium">
                    <div>
                      {getTextValue(pkg.name)}
                      {pkg.isPopular && (
                        <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                          {t("admin.packages.isPopular") || "Popular"}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      {getTextValue(pkg.name)}
                      {pkg.isPopular && (
                        <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                          {t("admin.packages.isPopular") || "Popular"}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(pkg.price, pkg.currency)}</TableCell>
                  <TableCell>
                    {pkg.duration.value}{" "}
                    {t(`admin.packages.units.${pkg.duration.unit}`) ||
                      pkg.duration.unit}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {pkg.stats?.enrolledCount || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    {pkg.isActive ? (
                      <Badge className="bg-green-100 text-green-800">
                        {t("admin.packages.isActive") || "Active"}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {t("common.inactive") || "Inactive"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(pkg)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(pkg.id || (pkg as any)._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <DialogHeader>
            <DialogTitle>
              {editingPackage
                ? t("admin.packages.editPackage") || "Edit Package"
                : t("admin.packages.createPackage") || "Create Package"}
            </DialogTitle>
            <DialogDescription>
              {editingPackage
                ? "Update package details"
                : "Create a new subscription package"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Language Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={currentLang === "ar" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentLang("ar")}
              >
                {t("admin.packages.arabicContent") || "العربية"}
              </Button>
              <Button
                type="button"
                variant={currentLang === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentLang("en")}
              >
                {t("admin.packages.englishContent") || "English"}
              </Button>
            </div>

            {/* Package Name */}
            <div className="grid gap-2">
              <Label>
                {t("admin.packages.packageName") || "Package Name"} ({currentLang.toUpperCase()})
              </Label>
              <Input
                value={formData.name[currentLang]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: { ...formData.name, [currentLang]: e.target.value },
                  })
                }
                placeholder={
                  currentLang === "ar" ? "اسم الباقة" : "Package name"
                }
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label>
                {t("admin.packages.packageDescription") || "Description"} ({currentLang.toUpperCase()})
              </Label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.description?.[currentLang] || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: {
                      ar: formData.description?.ar || "",
                      en: formData.description?.en || "",
                      [currentLang]: e.target.value,
                    },
                  })
                }
                placeholder={currentLang === "ar" ? "الوصف" : "Description"}
              />
            </div>



            {/* Price & Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("admin.packages.price") || "Price"}</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.packages.currency") || "Currency"}</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="EGP" value="EGP">EGP</SelectItem>
                    <SelectItem key="SAR" value="SAR">SAR</SelectItem>
                    <SelectItem key="USD" value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("admin.packages.durationValue") || "Duration"}</Label>
                <Input
                  type="number"
                  value={formData.duration.value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: {
                        ...formData.duration,
                        value: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.packages.durationUnit") || "Unit"}</Label>
                <Select
                  value={formData.duration.unit}
                  onValueChange={(value: any) =>
                    setFormData({
                      ...formData,
                      duration: { ...formData.duration, unit: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="day" value="day">
                      {t("admin.packages.units.day") || "Day"}
                    </SelectItem>
                    <SelectItem key="week" value="week">
                      {t("admin.packages.units.week") || "Week"}
                    </SelectItem>
                    <SelectItem key="month" value="month">
                      {t("admin.packages.units.month") || "Month"}
                    </SelectItem>
                    <SelectItem key="year" value="year">
                      {t("admin.packages.units.year") || "Year"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>{t("admin.packages.maxStudents") || "Max Students"}</Label>
                <Input
                  type="number"
                  placeholder={t("admin.packages.unlimited") || "Unlimited"}
                  value={formData.limits?.maxStudents || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      limits: {
                        ...formData.limits,
                        maxStudents: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.packages.maxSessions") || "Max Sessions"}</Label>
                <Input
                  type="number"
                  placeholder={t("admin.packages.unlimited") || "Unlimited"}
                  value={formData.limits?.maxSessions || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      limits: {
                        ...formData.limits,
                        maxSessions: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.packages.sessionsPerWeek") || "Per Week"}</Label>
                <Input
                  type="number"
                  placeholder={t("admin.packages.unlimited") || "Unlimited"}
                  value={formData.limits?.sessionsPerWeek || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      limits: {
                        ...formData.limits,
                        sessionsPerWeek: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </div>
            </div>

            {/* Features */}
            <div className="grid gap-2">
              <Label>{t("admin.packages.features") || "Features"}</Label>
              <div className="space-y-2">
                {formData.features?.map((feature, index) => (
                  <div key={`feature-${index}`} className="flex items-center gap-2">
                    <Input
                      value={getTextValue(feature)}
                      disabled
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={
                      currentLang === "ar" ? "أضف ميزة" : "Add feature"
                    }
                    value={featureInput[currentLang]}
                    onChange={(e) =>
                      setFeatureInput({
                        ...featureInput,
                        [currentLang]: e.target.value,
                      })
                    }
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                  />
                  <Button type="button" onClick={addFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  {t("admin.packages.isActive") || "Active"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPopular"
                  checked={formData.isPopular}
                  onChange={(e) =>
                    setFormData({ ...formData, isPopular: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isPopular" className="cursor-pointer">
                  {t("admin.packages.isPopular") || "Popular"}
                </Label>
              </div>
            </div>

            {/* Display Order */}
            <div className="grid gap-2">
              <Label>{t("admin.packages.displayOrder") || "Display Order"}</Label>
              <Input
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    displayOrder: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-genoun-green hover:bg-genoun-green/90"
            >
              {editingPackage
                ? t("common.update") || "Update"
                : t("common.create") || "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
