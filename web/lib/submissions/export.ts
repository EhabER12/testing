import toast from "react-hot-toast";
import { Submission, ExportMode } from "@/lib/submissions/types";
import { convertToFullUrl } from "./utils";

type ExportSubmissionsProps = {
  mode: ExportMode;
  filteredSubmissions: Submission[];
  allSubmissions: Submission[];
  activeTab: string;
  dateFrom: string;
  dateTo: string;
  forms: any[];
};

export function exportSubmissions({
  mode,
  filteredSubmissions,
  allSubmissions,
  activeTab,
  dateFrom,
  dateTo,
  forms,
}: ExportSubmissionsProps) {
  let submissionsToExport = filteredSubmissions;
  let fileName = "form-submissions";

  switch (mode) {
    case "current":
      submissionsToExport = filteredSubmissions;
      fileName = `submissions-${activeTab === "all" ? "all" : activeTab}`;
      break;
    case "form":
      if (activeTab !== "all") {
        submissionsToExport = filteredSubmissions;
        const formName =
          forms.find((f) => f._id === activeTab)?.title || "form";
        fileName = `submissions-${formName.toLowerCase().replace(/\s+/g, "-")}`;
      }
      break;
    case "all":
      submissionsToExport = allSubmissions;
      fileName = "all-submissions";
      break;
    case "dateRange":
      if (dateFrom || dateTo) {
        fileName = `submissions-${dateFrom || "start"}-to-${dateTo || "end"}`;
      }
      break;
  }

  const uniqueFields = new Set<string>();
  submissionsToExport.forEach((sub) => {
    const dataKeys = sub.mappedData
      ? Object.keys(sub.mappedData)
      : Object.keys(sub.data);
    dataKeys.forEach((key) => uniqueFields.add(key));
  });
  const fieldsList = Array.from(uniqueFields);

  const headers = [
    "Form",
    "Submission Date",
    "Status",
    "Admin Notes",
    ...fieldsList,
  ];

  const csvContent = [
    headers.join(","),
    ...submissionsToExport.map((sub) => {
      const dataToExport = sub.mappedData || sub.data;
      const row = [
        `"${sub.formTitle || "Unknown"}"`,
        `"${new Date(sub.submittedAt).toLocaleString()}"`,
        `"${sub.isRead ? "Read" : "New"}"`,
        `"${(sub.adminNotes || "").replace(/"/g, '""')}"`,
        ...fieldsList.map((field) => {
          const value = dataToExport[field] || "";
          const fullUrlValue = convertToFullUrl(value);
          return `"${fullUrlValue.replace(/"/g, '""')}"`; // Escape quotes in CSV
        }),
      ];
      return row.join(",");
    }),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${fileName}-${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.success(`Exported ${submissionsToExport.length} submissions`);
}
