import { useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "@/lib/axios";
import { Submission } from "@/lib/submissions/types";
import { getAuthHeaders } from "@/lib/submissions/utils";

type UseSubmissionActionsProps = {
  onUpdateSubmission: (submission: Submission) => void;
  onRemoveSubmission: (submissionId: string) => void;
  allSubmissions: Submission[];
};

export function useSubmissionActions({
  onUpdateSubmission,
  onRemoveSubmission,
  allSubmissions,
}: UseSubmissionActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const markSubmissionAsRead = async (submission: Submission) => {
    if (!submission.formId || !submission._id || submission.isRead) return;

    try {
      setIsSubmitting(true);
      await axiosInstance.patch(
        `/forms/${submission.formId}/submissions/${submission._id}/read`,
        {},
        { headers: getAuthHeaders() }
      );

      const updatedSubmission = { ...submission, isRead: true };
      onUpdateSubmission(updatedSubmission);

      toast.success("Submission marked as read");
    } catch (error) {
      console.error("Error marking submission as read:", error);
      toast.error("Failed to mark submission as read");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    const submission = allSubmissions.find((s) => s._id === submissionId);
    if (!submission || !submission.formId) {
      toast.error("Cannot delete submission: missing form ID");
      return;
    }

    try {
      setIsSubmitting(true);
      await axiosInstance.delete(
        `/forms/${submission.formId}/submissions/${submissionId}`,
        { headers: getAuthHeaders() }
      );

      onRemoveSubmission(submissionId);

      toast.success("Submission deleted successfully");
    } catch (error) {
      console.error("Error deleting submission:", error);
      toast.error("Failed to delete submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSubmissionNotes = async (
    submission: Submission,
    notes: string
  ) => {
    if (!submission.formId || !submission._id) return;

    try {
      setIsSubmitting(true);
      await axiosInstance.patch(
        `/forms/${submission.formId}/submissions/${submission._id}/notes`,
        { notes },
        { headers: getAuthHeaders() }
      );

      const updatedSubmission = { ...submission, adminNotes: notes };
      onUpdateSubmission(updatedSubmission);

      toast.success("Admin notes updated successfully");
    } catch (error) {
      console.error("Error updating submission notes:", error);
      toast.error("Failed to update notes");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    markSubmissionAsRead,
    deleteSubmission,
    updateSubmissionNotes,
  };
}
