"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Eye,
  FileText,
  MoreHorizontal,
  Plus,
  Trash,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getForms, getLocalizedText } from "@/store/services/formService";
import { resetFormState } from "@/store/slices/formSlice";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

export default function FormsPage() {
  const dispatch = useAppDispatch();
  const { forms, isLoading, error } = useAppSelector((state) => state.forms);
  const { t, isRtl, locale } = useAdminLocale();

  useEffect(() => {
    dispatch(getForms());
    return () => {
      dispatch(resetFormState());
    };
  }, [dispatch]);

  const renderFormTable = (
    filteredForms: typeof forms,
    emptyMessage: string,
    showingMessage: string
  ) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={`text-${isRtl ? "right" : "left"}`}>
            {t("admin.forms.formName")}
          </TableHead>
          <TableHead className={`text-${isRtl ? "right" : "left"}`}>
            {t("admin.forms.fields")}
          </TableHead>
          <TableHead className={`text-${isRtl ? "right" : "left"}`}>
            {t("admin.forms.submissions")}
          </TableHead>
          <TableHead className={`text-${isRtl ? "right" : "left"}`}>
            {t("admin.forms.status")}
          </TableHead>
          <TableHead className={`text-${isRtl ? "right" : "left"}`}>
            {t("admin.forms.actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredForms.length === 0 && !isLoading && (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
        {filteredForms.map((form) => (
          <TableRow key={form._id}>
            <TableCell className="font-medium">
              {getLocalizedText(form.title, locale)}
              {form.slug && (
                <div className="mt-1 text-xs text-muted-foreground truncate max-w-[200px]">
                  URL: /forms/{form.slug}
                </div>
              )}
            </TableCell>
            <TableCell>
              {form.fields?.length ?? 0} {isRtl ? "حقل" : "fields"}
            </TableCell>
            <TableCell>{form.submissions?.length ?? 0}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  form.status === "published"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {form.status || "draft"}
              </span>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {t("admin.forms.actions")}
                  </DropdownMenuLabel>
                  {form.status === "published" && form.slug ? (
                    <Link href={`/forms/${form.slug}`} passHref target="_blank">
                      <DropdownMenuItem>
                        <Eye className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`} />
                        {t("admin.dashboard.actions.view")}
                      </DropdownMenuItem>
                    </Link>
                  ) : (
                    <DropdownMenuItem disabled>
                      <Eye className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`} />
                      {t("admin.dashboard.actions.view")}
                    </DropdownMenuItem>
                  )}
                  <Link href={`/dashboard/forms/${form._id}/edit`} passHref>
                    <DropdownMenuItem>
                      <FileText
                        className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`}
                      />
                      {t("admin.dashboard.actions.edit")}
                    </DropdownMenuItem>
                  </Link>
                  {form.slug !== "consultation-request" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash
                          className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`}
                        />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </>
                  )}
                  {form.slug === "consultation-request" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled className="text-gray-400">
                        <Trash
                          className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`}
                        />
                        {t("common.delete")} ({t("admin.forms.protected")})
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-4 p-8">
      <div
        className="flex items-center justify-between"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <h2 className="text-3xl font-bold tracking-tight">
          {t("admin.forms.formBuilder")}
        </h2>
        <Link href="/dashboard/forms/create">
          <Button>
            <Plus className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`} />
            {t("admin.forms.createForm")}
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("admin.forms.errorLoading")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && (
        <Tabs
          defaultValue="all"
          className="space-y-4"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <TabsList dir={isRtl ? "rtl" : "ltr"}>
            <TabsTrigger value="all">{t("admin.forms.allForms")}</TabsTrigger>
            <TabsTrigger value="published">
              {t("admin.forms.publishedForms")}
            </TabsTrigger>
            <TabsTrigger value="draft">
              {t("admin.forms.draftForms")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.forms.allForms")}</CardTitle>
                <CardDescription>
                  {t("admin.forms.manageDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderFormTable(
                  forms,
                  t("admin.forms.noFormsFound"),
                  `${forms.length}`
                )}
              </CardContent>
              <CardFooter>
                <div className="text-xs text-muted-foreground">
                  {isRtl
                    ? `عرض ${forms.length} من ${forms.length} نموذج`
                    : `Showing ${forms.length} of ${forms.length} forms`}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="published" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.forms.publishedForms")}</CardTitle>
                <CardDescription>
                  {t("admin.forms.publishedDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderFormTable(
                  forms.filter((f) => f.status === "published"),
                  t("admin.forms.noPublishedForms"),
                  `${forms.filter((f) => f.status === "published").length}`
                )}
              </CardContent>
              <CardFooter>
                <div className="text-xs text-muted-foreground">
                  {isRtl
                    ? `عرض ${
                        forms.filter((f) => f.status === "published").length
                      } نموذج منشور`
                    : `Showing ${
                        forms.filter((f) => f.status === "published").length
                      } published forms`}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="draft" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.forms.draftForms")}</CardTitle>
                <CardDescription>
                  {t("admin.forms.draftDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderFormTable(
                  forms.filter((f) => f.status === "draft" || !f.status),
                  t("admin.forms.noDraftForms"),
                  `${
                    forms.filter((f) => f.status === "draft" || !f.status)
                      .length
                  }`
                )}
              </CardContent>
              <CardFooter>
                <div className="text-xs text-muted-foreground">
                  {isRtl
                    ? `عرض ${
                        forms.filter((f) => f.status === "draft" || !f.status)
                          .length
                      } مسودة`
                    : `Showing ${
                        forms.filter((f) => f.status === "draft" || !f.status)
                          .length
                      } draft forms`}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
