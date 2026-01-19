import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { Submission } from "@/lib/submissions/types";
import { getLocalizedText } from "@/store/services/formService";

export function useSubmissions() {
  const { forms, isLoading, error } = useAppSelector((state) => state.forms);
  const [formSubmissions, setFormSubmissions] = useState<
    Record<string, Submission[]>
  >({});
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (!isLoading && !error && forms.length > 0) {
      const submissionsByForm: Record<string, Submission[]> = {};
      const allSubs: Submission[] = [];

      forms.forEach((form) => {
        if (form.submissions && form.submissions.length > 0) {
          const fieldMap: Record<string, string> = {};
          form.fields.forEach((field) => {
            // Use getLocalizedText to handle BilingualText labels
            fieldMap[field.id] = getLocalizedText(field.label, "ar");
          });

          const formattedSubmissions = form.submissions.map((sub) => {
            let processedData = sub.data;
            let mappedData: Record<string, any> = {};

            if (sub.data && sub.data.summary) {
              mappedData = sub.data.summary;
              processedData = sub.data.raw;
            } else if (sub.data) {
              Object.entries(sub.data).forEach(([key, value]) => {
                const label = fieldMap[key] || key;
                mappedData[label] = value;
              });
              processedData = sub.data;
            }

            return {
              _id: sub._id || `sub-${Math.random().toString(36).substr(2, 9)}`,
              data: processedData || {},
              mappedData,
              submittedAt: new Date(sub.submittedAt || Date.now()),
              formId: form._id,
              formTitle: getLocalizedText(form.title, "ar"),
              isRead: sub.isRead || false,
              adminNotes: sub.adminNotes || "",
            };
          });

          submissionsByForm[form._id] = formattedSubmissions;
          allSubs.push(...formattedSubmissions);
        }
      });

      allSubs.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

      setFormSubmissions(submissionsByForm);
      setAllSubmissions(allSubs);
    }
  }, [forms, isLoading, error]);

  const updateSubmissionInState = (updatedSubmission: Submission) => {
    // Update in allSubmissions
    setAllSubmissions((prev) =>
      prev.map((sub) =>
        sub._id === updatedSubmission._id ? updatedSubmission : sub
      )
    );

    // Update in formSubmissions
    if (updatedSubmission.formId) {
      setFormSubmissions((prev) => {
        const formSubs = prev[updatedSubmission.formId!] || [];
        const updatedFormSubs = formSubs.map((sub) =>
          sub._id === updatedSubmission._id ? updatedSubmission : sub
        );
        return { ...prev, [updatedSubmission.formId!]: updatedFormSubs };
      });
    }
  };

  const removeSubmissionFromState = (submissionId: string) => {
    setAllSubmissions((prev) => prev.filter((s) => s._id !== submissionId));

    const updatedFormSubmissions = { ...formSubmissions };
    Object.keys(updatedFormSubmissions).forEach((formId) => {
      updatedFormSubmissions[formId] = updatedFormSubmissions[formId].filter(
        (s) => s._id !== submissionId
      );
    });
    setFormSubmissions(updatedFormSubmissions);
  };

  return {
    forms,
    formSubmissions,
    allSubmissions,
    isLoading,
    error,
    updateSubmissionInState,
    removeSubmissionFromState,
  };
}
