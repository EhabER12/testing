import { useState, useEffect } from "react";
import { Submission, ReadFilter } from "@/lib/submissions/types";

type UseSubmissionsFilterProps = {
  allSubmissions: Submission[];
  activeTab: string;
};

export function useSubmissionsFilter({
  allSubmissions,
  activeTab,
}: UseSubmissionsFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 15;

  const filteredSubmissions = allSubmissions.filter((submission) => {
    if (activeTab !== "all" && submission.formId !== activeTab) {
      return false;
    }

    if (readFilter === "read" && !submission.isRead) {
      return false;
    }
    if (readFilter === "unread" && submission.isRead) {
      return false;
    }

    // Date range filter
    if (dateFrom) {
      const submissionDate = new Date(submission.submittedAt);
      const fromDate = new Date(dateFrom);
      if (submissionDate < fromDate) {
        return false;
      }
    }
    if (dateTo) {
      const submissionDate = new Date(submission.submittedAt);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire end date
      if (submissionDate > toDate) {
        return false;
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();

      if (submission.formTitle?.toLowerCase().includes(query)) {
        return true;
      }

      const dataToSearch = submission.mappedData || submission.data;
      return Object.values(dataToSearch).some((value) =>
        String(value).toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Paginate filtered submissions
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, readFilter, dateFrom, dateTo]);

  return {
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
  };
}
