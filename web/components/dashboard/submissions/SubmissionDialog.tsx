import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Trash2, Pencil, Save } from "lucide-react";
import { Submission } from "@/lib/submissions/types";
import { getFullUploadUrl } from "@/lib/submissions/utils";

type SubmissionDialogProps = {
  submission: Submission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAsRead: (submission: Submission) => void;
  onDelete: (submissionId: string) => void;
  onUpdateNotes: (submission: Submission, notes: string) => void;
  isSubmitting: boolean;
};

export function SubmissionDialog({
  submission,
  open,
  onOpenChange,
  onMarkAsRead,
  onDelete,
  onUpdateNotes,
  isSubmitting,
}: SubmissionDialogProps) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");

  // Update notes when submission changes
  useState(() => {
    if (submission) {
      setNotes(submission.adminNotes || "");
      setEditingNotes(false);
    }
  });

  if (!submission) return null;

  const handleSaveNotes = () => {
    onUpdateNotes(submission, notes);
    setEditingNotes(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{submission.formTitle || "Form"} Submission</span>
            <Badge
              variant={submission.isRead ? "outline" : "default"}
              className="ml-2"
            >
              {submission.isRead ? "Read" : "New"}
            </Badge>
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <div>
              Submitted {new Date(submission.submittedAt).toLocaleString()}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
          <div className="mt-4 space-y-4">
            {Object.entries(submission.mappedData || submission.data).map(
              ([key, value]) => {
                const isFileUrl =
                  typeof value === "string" && value.includes("/uploads/");
                const fileName = isFileUrl
                  ? String(value).split("/").pop()
                  : null;

                return (
                  <div key={key} className="border-b pb-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      {key}
                    </div>
                    <div className="mt-1 break-words">
                      {isFileUrl ? (
                        <a
                          href={getFullUploadUrl(String(value))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          {fileName}
                        </a>
                      ) : (
                        String(value)
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Admin Notes</h3>
              {!editingNotes ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingNotes(true)}
                  className="h-8"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit Notes
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isSubmitting}
                  className="h-8"
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Save Notes
                </Button>
              )}
            </div>

            {editingNotes ? (
              <Textarea
                placeholder="Add notes about this submission..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            ) : (
              <div className="p-3 bg-muted/30 rounded-md min-h-[60px]">
                {submission.adminNotes ? (
                  <p className="text-sm whitespace-pre-wrap">
                    {submission.adminNotes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No admin notes
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2 border-t pt-4 flex-shrink-0">
          {!submission.isRead && (
            <Button
              variant="outline"
              onClick={() => onMarkAsRead(submission)}
              disabled={isSubmitting}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Read
            </Button>
          )}
          <Button
            variant="destructive"
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
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
