"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getStaticPages,
  seedStaticPages,
  StaticPage,
} from "@/store/slices/staticPageSlice";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Edit, FileText, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

// Page title mappings
const pageTitles: Record<string, { ar: string; en: string }> = {
  "privacy-policy": { ar: "سياسة الخصوصية", en: "Privacy Policy" },
  "terms-and-conditions": { ar: "الشروط والأحكام", en: "Terms and Conditions" },
  "about-us": { ar: "من نحن", en: "About Us" },
  faqs: { ar: "الأسئلة الشائعة", en: "FAQs" },
  "pricing-policy": { ar: "سياسة التسعير", en: "Pricing Policy" },
  "refund-policy": { ar: "سياسة الاسترداد", en: "Refund Policy" },
};

export default function StaticPagesListPage() {
  const dispatch = useAppDispatch();
  const { pages, loading } = useAppSelector((state) => state.staticPages);
  const { t, isRtl, locale } = useAdminLocale();

  useEffect(() => {
    dispatch(getStaticPages());
  }, [dispatch]);

  const handleSeedPages = async () => {
    try {
      await dispatch(seedStaticPages()).unwrap();
      toast.success(
        isRtl ? "تم إنشاء الصفحات بنجاح" : "Pages created successfully"
      );
    } catch (error: any) {
      toast.error(
        error || (isRtl ? "فشل إنشاء الصفحات" : "Failed to create pages")
      );
    }
  };

  const getPageTitle = (page: StaticPage) => {
    const title = page.title?.[locale as "ar" | "en"];
    if (title) return title;
    return pageTitles[page.slug]?.[locale as "ar" | "en"] || page.slug;
  };

  return (
    <div className="p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isRtl ? "الصفحات الثابتة" : "Static Pages"}
            </h1>
            <p className="text-gray-500">
              {isRtl
                ? "إدارة محتوى الصفحات الثابتة مثل سياسة الخصوصية والشروط"
                : "Manage static page content like Privacy Policy and Terms"}
            </p>
          </div>
        </div>
        {pages.length === 0 && !loading && (
          <Button onClick={handleSeedPages} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {isRtl ? "إنشاء الصفحات الافتراضية" : "Create Default Pages"}
          </Button>
        )}
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>{isRtl ? "قائمة الصفحات" : "Pages List"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{isRtl ? "لا توجد صفحات" : "No pages found"}</p>
              <p className="text-sm mt-2">
                {isRtl
                  ? "اضغط على 'إنشاء الصفحات الافتراضية' للبدء"
                  : "Click 'Create Default Pages' to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{isRtl ? "العنوان" : "Title"}</TableHead>
                  <TableHead className="text-start">{isRtl ? "المعرف" : "Slug"}</TableHead>
                  <TableHead className="text-start">{isRtl ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-start">
                    {isRtl ? "عرض في التذييل" : "In Footer"}
                  </TableHead>
                  <TableHead className="text-start">{isRtl ? "عرض في الرأس" : "In Header"}</TableHead>
                  <TableHead className="text-center">
                    {isRtl ? "الإجراءات" : "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.slug}>
                    <TableCell className="font-medium">
                      {getPageTitle(page)}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {page.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={page.isPublished ? "default" : "secondary"}
                        className={
                          page.isPublished
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {page.isPublished
                          ? isRtl
                            ? "منشور"
                            : "Published"
                          : isRtl
                          ? "مسودة"
                          : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {page.showInFooter ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          {isRtl ? "نعم" : "Yes"}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {page.showInHeader ? (
                        <Badge className="bg-purple-100 text-purple-800">
                          {isRtl ? "نعم" : "Yes"}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={`/dashboard/static-pages/${page.slug}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit
                            className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`}
                          />
                          {isRtl ? "تعديل" : "Edit"}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
