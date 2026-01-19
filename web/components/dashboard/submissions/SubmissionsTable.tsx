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
import { Calendar, CheckCircle, Eye, Trash2, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Submission } from "@/lib/submissions/types";
import { getFullUploadUrl } from "@/lib/submissions/utils";

type SubmissionsTableProps = {
  submissions: Submission[];
  activeTab: string;
  isSubmitting: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalSubmissions: number;
  onSubmissionClick: (submission: Submission) => void;
  onMarkAsRead: (submission: Submission) => void;
  onDelete: (submissionId: string) => void;
  onPageChange: (page: number) => void;
};

export function SubmissionsTable({
  submissions,
  activeTab,
  isSubmitting,
  currentPage,
  totalPages,
  itemsPerPage,
  totalSubmissions,
  onSubmissionClick,
  onMarkAsRead,
  onDelete,
  onPageChange,
}: SubmissionsTableProps) {
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/30" />
        <p className="mt-2 text-lg font-medium">No submissions found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {activeTab === "all" && (
              <TableHead className="w-[200px]">Form</TableHead>
            )}
            <TableHead>Submission Data</TableHead>
            <TableHead className="w-[150px]">Date</TableHead>
            <TableHead className="w-[80px]">Status</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => {
            // Get the first few fields to display in the preview
            const dataToDisplay = submission.mappedData || submission.data;
            const previewFields = Object.entries(dataToDisplay).slice(0, 3);

            return (
              <TableRow
                key={submission._id}
                className={`cursor-pointer ${
                  !submission.isRead ? "font-semibold bg-muted/20" : ""
                }`}
                onClick={() => onSubmissionClick(submission)}
              >
                {activeTab === "all" && (
                  <TableCell>
                    <div className="font-medium">
                      {submission.formTitle || "Unknown Form"}
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <div className="space-y-1">
                    {previewFields.map(([key, value]) => {
                      const isFileUrl =
                        typeof value === "string" &&
                        value.includes("/uploads/");
                      const displayValue =
                        typeof value === "string" && value.length > 40
                          ? `${value.substring(0, 40)}...`
                          : String(value);

                      return (
                        <div key={key} className="text-sm">
                          <span className="font-medium">{key}:</span>{" "}
                          {isFileUrl ? (
                            <a
                              href={getFullUploadUrl(String(value))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View File
                            </a>
                          ) : (
                            displayValue
                          )}
                        </div>
                      );
                    })}
                    {Object.keys(dataToDisplay).length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{Object.keys(dataToDisplay).length - 3} more fields
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(submission.submittedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={submission.isRead ? "outline" : "default"}>
                    {submission.isRead ? "Read" : "New"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex justify-end space-x-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!submission.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkAsRead(submission)}
                        disabled={isSubmitting}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span className="sr-only">Mark as read</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSubmissionClick(submission)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this submission? This action cannot be undone."
                          )
                        ) {
                          onDelete(submission._id);
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalSubmissions > itemsPerPage && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalSubmissions)} of{" "}
            {totalSubmissions} submissions
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNumber)}
                    className="w-9"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
