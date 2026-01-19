"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, FileText } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { getForms, getLocalizedText } from "@/store/services/formService";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Submission } from "@/lib/submissions/types";
import { SubmissionsFilters } from "@/components/dashboard/submissions/SubmissionsFilters";
import { SubmissionsTable } from "@/components/dashboard/submissions/SubmissionsTable";
import { SubmissionDialog } from "@/components/dashboard/submissions/SubmissionDialog";
import { useSubmissions } from "@/hooks/dashboard/useSubmissions";
import { useSubmissionsFilter } from "@/hooks/dashboard/useSubmissionsFilter";
import { useSubmissionActions } from "@/hooks/dashboard/useSubmissionActions";
import { exportSubmissions } from "@/lib/submissions/export";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

export default function SubmissionsPage() {
  const dispatch = useAppDispatch();
  const { t, isRtl } = useAdminLocale();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [selectedSubmissionOpen, setSelectedSubmissionOpen] = useState(false);

  const {
    forms,
    formSubmissions,
    allSubmissions,
    isLoading,
    error,
    updateSubmissionInState,
    removeSubmissionFromState,
  } = useSubmissions();

  const {
    searchQuery,
    setSearchQuery,
    readFilter,
    setReadFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    currentPage,
    setCurrentPage,
    filteredSubmissions,
    paginatedSubmissions,
    totalPages,
    itemsPerPage,
  } = useSubmissionsFilter({ allSubmissions, activeTab });

  const {
    isSubmitting,
    markSubmissionAsRead,
    deleteSubmission,
    updateSubmissionNotes,
  } = useSubmissionActions({
    onUpdateSubmission: updateSubmissionInState,
    onRemoveSubmission: removeSubmissionFromState,
    allSubmissions,
  });

  useEffect(() => {
    dispatch(getForms());
  }, [dispatch]);

  const handleSubmissionClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setSelectedSubmissionOpen(true);

    if (!submission.isRead) {
      markSubmissionAsRead(submission);
    }
  };

  const handleDelete = (submissionId: string) => {
    deleteSubmission(submissionId);
    // Close the dialog if this submission was selected
    if (selectedSubmission?._id === submissionId) {
      setSelectedSubmissionOpen(false);
    }
  };

  const handleExport = (mode: "current" | "form" | "all" | "dateRange") => {
    exportSubmissions({
      mode,
      filteredSubmissions,
      allSubmissions,
      activeTab,
      dateFrom,
      dateTo,
      forms,
    });
  };

  // Get form names for tabs
  const formTabs = forms.filter(
    (form) => formSubmissions[form._id] && formSubmissions[form._id].length > 0
  );

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6" dir={isRtl ? "rtl" : "ltr"}>
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-10 w-[300px]" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6" dir={isRtl ? "rtl" : "ltr"}>
        <h2 className="text-3xl font-bold tracking-tight">
          {t("admin.submissions.title")}
        </h2>
        <Alert variant="destructive">
          <AlertTitle>{t("admin.submissions.errorLoading")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("admin.submissions.title")}
          </h2>
          <p className="text-gray-500 mt-1">
            {t("admin.submissions.description")}
          </p>
        </div>
      </div>

      <SubmissionsFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        readFilter={readFilter}
        setReadFilter={setReadFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        onExport={handleExport}
        activeTab={activeTab}
        filteredCount={filteredSubmissions.length}
        allCount={allSubmissions.length}
        exportDisabled={filteredSubmissions.length === 0}
      />

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="all" className="relative">
            {t("admin.submissions.allForms")}
            <Badge variant="outline" className={isRtl ? "mr-2" : "ml-2"}>
              {allSubmissions.length}
            </Badge>
          </TabsTrigger>

          {formTabs.map((form) => (
            <TabsTrigger key={form._id} value={form._id} className="relative">
              {getLocalizedText(form.title, isRtl ? "ar" : "en")}
              <Badge variant="outline" className={isRtl ? "mr-2" : "ml-2"}>
                {formSubmissions[form._id]?.length || 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList
                  className={`h-5 w-5 ${isRtl ? "ml-2" : "mr-2"}`}
                />
                {activeTab === "all"
                  ? t("admin.submissions.allSubmissions")
                  : `${t("admin.submissions.submissionsFor")} ${
                      getLocalizedText(
                        forms.find((f) => f._id === activeTab)?.title,
                        isRtl ? "ar" : "en"
                      ) || t("admin.submissions.unknownForm")
                    }`}
              </CardTitle>
              <CardDescription>
                {activeTab === "all"
                  ? t("admin.submissions.allSubmissionsDesc")
                  : `${t("admin.submissions.formSubmissionsDesc")} ${
                      getLocalizedText(
                        forms.find((f) => f._id === activeTab)?.title,
                        isRtl ? "ar" : "en"
                      ) || t("admin.submissions.selected")
                    }`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubmissionsTable
                submissions={paginatedSubmissions}
                activeTab={activeTab}
                isSubmitting={isSubmitting}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalSubmissions={filteredSubmissions.length}
                onSubmissionClick={handleSubmissionClick}
                onMarkAsRead={markSubmissionAsRead}
                onDelete={handleDelete}
                onPageChange={setCurrentPage}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SubmissionDialog
        submission={selectedSubmission}
        open={selectedSubmissionOpen}
        onOpenChange={setSelectedSubmissionOpen}
        onMarkAsRead={markSubmissionAsRead}
        onDelete={handleDelete}
        onUpdateNotes={updateSubmissionNotes}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
