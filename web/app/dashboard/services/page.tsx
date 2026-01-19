"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Star,
  StarOff,
  ToggleLeft,
  ToggleRight,
  Package,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getServices,
  deleteService,
  toggleServiceStatus,
  syncServiceAnalytics,
} from "@/store/slices/serviceSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { toast } from "sonner";

// Category labels
const categoryLabels: Record<string, { ar: string; en: string }> = {
  salla: { ar: "تطوير سلة", en: "Salla" },
  shopify: { ar: "شوبيفاي", en: "Shopify" },
  websites: { ar: "مواقع", en: "Websites" },
  seo: { ar: "SEO", en: "SEO" },
  branding: { ar: "هوية", en: "Branding" },
  other: { ar: "أخرى", en: "Other" },
};

export default function DashboardServicesPage() {
  const dispatch = useAppDispatch();
  const { isRtl, t } = useAdminLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [syncing, setSyncing] = useState(false);

  const { services, loading, error } = useAppSelector(
    (state) => state.services
  );

  useEffect(() => {
    dispatch(getServices({}));
  }, [dispatch]);

  const filteredServices = services.filter((service) => {
    const title = isRtl ? service.title?.ar : service.title?.en;
    return title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        isRtl
          ? "هل أنت متأكد من حذف هذه الخدمة؟"
          : "Are you sure you want to delete this service?"
      )
    ) {
      try {
        await dispatch(deleteService(id)).unwrap();
        toast.success(
          isRtl ? "تم حذف الخدمة بنجاح" : "Service deleted successfully"
        );
      } catch (error: any) {
        toast.error(
          error || (isRtl ? "فشل حذف الخدمة" : "Failed to delete service")
        );
      }
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await dispatch(toggleServiceStatus({ id, isActive: !isActive })).unwrap();
      toast.success(
        isRtl
          ? isActive
            ? "تم تعطيل الخدمة"
            : "تم تفعيل الخدمة"
          : isActive
          ? "Service deactivated"
          : "Service activated"
      );
    } catch (error: any) {
      toast.error(
        error || (isRtl ? "فشل تحديث الحالة" : "Failed to update status")
      );
    }
  };

  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      await dispatch(
        toggleServiceStatus({ id, isFeatured: !isFeatured })
      ).unwrap();
      toast.success(
        isRtl
          ? isFeatured
            ? "تم إزالة التمييز"
            : "تم تمييز الخدمة"
          : isFeatured
          ? "Removed from featured"
          : "Added to featured"
      );
    } catch (error: any) {
      toast.error(error || (isRtl ? "فشل التحديث" : "Failed to update"));
    }
  };

  return (
    <div className="p-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isRtl ? "إدارة الخدمات" : "Services Management"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isRtl
              ? "إدارة خدمات Genoun التقنية"
              : "Manage Genoun tech services"}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={async () => {
            setSyncing(true);
            try {
              const result = await dispatch(syncServiceAnalytics()).unwrap();
              toast.success(
                isRtl
                  ? `تم التحديث: ${result.synced}`
                  : `Synced: ${result.synced}`
              );
              dispatch(getServices({}));
            } catch (e) {
              toast.error(isRtl ? "فشل التحديث" : "Failed to sync");
            } finally {
              setSyncing(false);
            }
          }}
          disabled={syncing}
        >
          {syncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
          )}
          {isRtl ? "تحديث المشاهدات" : "Sync Analytics"}
        </Button>
        <Link href="/dashboard/services/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {isRtl ? "إضافة خدمة" : "Add Service"}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={isRtl ? "بحث في الخدمات..." : "Search services..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {isRtl ? "لا توجد خدمات" : "No services found"}
            </p>
            <Link href="/dashboard/services/create">
              <Button variant="outline" className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                {isRtl ? "إضافة خدمة جديدة" : "Add New Service"}
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={isRtl ? "text-right" : ""}>
                  {isRtl ? "الخدمة" : "Service"}
                </TableHead>
                <TableHead className={isRtl ? "text-right" : ""}>
                  {isRtl ? "التصنيف" : "Category"}
                </TableHead>
                <TableHead className={isRtl ? "text-right" : ""}>
                  {isRtl ? "الحالة" : "Status"}
                </TableHead>
                <TableHead className={isRtl ? "text-right" : ""}>
                  {isRtl ? "مميزة" : "Featured"}
                </TableHead>
                <TableHead className={isRtl ? "text-right" : ""}>
                  {isRtl ? "الترتيب" : "Order"}
                </TableHead>
                <TableHead className={isRtl ? "text-right" : ""}>
                  {t("admin.dashboard.stats.viewsTitle")}
                </TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => {
                const title = isRtl ? service.title?.ar : service.title?.en;
                const categoryLabel = isRtl
                  ? categoryLabels[service.category]?.ar
                  : categoryLabels[service.category]?.en;

                return (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {service.coverImage ? (
                          <img
                            src={service.coverImage}
                            alt={title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{title}</p>
                          <p className="text-sm text-gray-500">
                            {service.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{categoryLabel}</Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          handleToggleActive(service.id, service.isActive)
                        }
                        className="flex items-center gap-2"
                      >
                        {service.isActive ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-green-500" />
                            <span className="text-sm text-green-600">
                              {isRtl ? "نشط" : "Active"}
                            </span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {isRtl ? "معطل" : "Inactive"}
                            </span>
                          </>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          handleToggleFeatured(service.id, service.isFeatured)
                        }
                      >
                        {service.isFeatured ? (
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="w-5 h-5 text-gray-300" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-500">{service.order}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-900 font-medium">
                        {service.seoData?.views30d || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-900 font-medium">
                        {service.seoData?.views30d || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRtl ? "start" : "end"}>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/services/${service.slug}`}
                              target="_blank"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              {isRtl ? "معاينة" : "Preview"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/services/edit/${service.id}`}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              {isRtl ? "تعديل" : "Edit"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(service.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {isRtl ? "حذف" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
