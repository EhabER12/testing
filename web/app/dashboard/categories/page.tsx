"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash,
  FolderTree,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getCategories,
  deleteCategory,
  toggleCategoryStatus,
  Category,
} from "@/store/slices/categorySlice";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";
import toast from "react-hot-toast";

// Get localized text helper
const getLocalizedText = (
  text: { ar: string; en: string } | string | undefined,
  locale: string
): string => {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[locale as "ar" | "en"] || text.en || text.ar || "";
};

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const { categories, loading, error } = useAppSelector(
    (state) => state.categories
  );
  const { t, isRtl, locale } = useAdminLocale();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(getCategories({}));
  }, [dispatch]);

  const handleToggleStatus = async (category: Category) => {
    try {
      await dispatch(
        toggleCategoryStatus({ id: category.id, isActive: !category.isActive })
      ).unwrap();
      toast.success(t("admin.categories.categoryUpdated"));
    } catch (err) {
      toast.error(String(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await dispatch(deleteCategory(deleteId)).unwrap();
      toast.success(t("admin.categories.categoryDeleted"));
    } catch (err) {
      toast.error(String(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4 p-8" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t("admin.categories.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("admin.categories.createFirst")}
          </p>
        </div>
        <Link href="/dashboard/categories/create">
          <Button>
            <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {t("admin.categories.createCategory")}
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Categories Table */}
      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.categories.title")}</CardTitle>
            <CardDescription>
              {categories.length} {t("admin.categories.title").toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderTree className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">
                  {t("admin.categories.noCategories")}
                </h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  {t("admin.categories.createFirst")}
                </p>
                <Link href="/dashboard/categories/create">
                  <Button>
                    <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                    {t("admin.categories.createCategory")}
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.categories.categoryName")}</TableHead>
                    <TableHead>{t("admin.categories.description")}</TableHead>
                    <TableHead>{t("admin.categories.products")}</TableHead>
                    <TableHead>{isRtl ? "الدورات" : "Courses"}</TableHead>
                    <TableHead>{t("admin.categories.isActive")}</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {category.image && (
                            <img
                              src={category.image}
                              alt=""
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-semibold">
                              {getLocalizedText(category.name, locale)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              /{category.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {getLocalizedText(category.description, locale)}
                      </TableCell>
                      <TableCell>{category.productCount || 0}</TableCell>
                      <TableCell>{category.courseCount || 0}</TableCell>
                      <TableCell>
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={() => handleToggleStatus(category)}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/dashboard/categories/${category.id}`}>
                              <DropdownMenuItem>
                                <Pencil
                                  className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"
                                    }`}
                                />
                                {t("common.edit")}
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeleteId(category.id)}
                            >
                              <Trash
                                className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`}
                              />
                              {t("common.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.categories.deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("common.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
