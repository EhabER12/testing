import { BaseRepository } from "./baseRepository.js";
import Form from "../models/formModel.js";

export class FormRepository extends BaseRepository {
  constructor() {
    super(Form);
  }

  async findByStatus(status, options = {}) {
    return this.findAll({
      ...options,
      filter: { status },
    });
  }

  async addSubmission(formId, submissionData) {
    try {
      const result = await this.model.findByIdAndUpdate(
        formId,
        { $push: { submissions: { data: submissionData } } },
        { new: true, runValidators: true }
      );

      if (!result) {
        throw new Error(`Failed to add submission to form with ID ${formId}`);
      }

      const newSubmission = result.submissions[result.submissions.length - 1];

      return {
        _id: newSubmission._id,
        submittedAt: newSubmission.submittedAt,
        formId: formId,
        success: true,
        data: submissionData.summary || submissionData,
      };
    } catch (error) {
      console.error("Error in addSubmission:", error);
      throw error;
    }
  }

  async markSubmissionAsRead(formId, submissionId) {
    return this.model.findOneAndUpdate(
      {
        _id: formId,
        "submissions._id": submissionId,
      },
      {
        $set: { "submissions.$.isRead": true },
      },
      { new: true }
    );
  }

  async deleteSubmission(formId, submissionId) {
    return this.model.findByIdAndUpdate(
      formId,
      {
        $pull: { submissions: { _id: submissionId } },
      },
      { new: true }
    );
  }

  async updateSubmissionNotes(formId, submissionId, notes) {
    return this.model.findOneAndUpdate(
      {
        _id: formId,
        "submissions._id": submissionId,
      },
      {
        $set: { "submissions.$.adminNotes": notes },
      },
      { new: true }
    );
  }
}
