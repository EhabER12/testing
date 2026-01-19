import { FormService } from "../services/formService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import User from "../models/userModel.js";

const formService = new FormService();

export const getAllForms = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const forms = await formService.getAllForms({ page, limit, status });

    return ApiResponse.success(res, forms);
  } catch (error) {
    next(error);
  }
};

export const getFormById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const form = await formService.getFormById(id);

    return ApiResponse.success(res, form);
  } catch (error) {
    next(error);
  }
};

export const getPublicFormBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      res.status(400);
      throw new Error("Form slug is required");
    }

    let form = await formService.getPublicFormBySlug(slug);

    // Auto-create system forms if they don't exist
    if (!form && (slug === "consultation" || slug === "consultation-request")) {
      const consultationFormData = {
        title: "Consultation Request",
        slug: "consultation-request",
        description: "Consultation requests from customers",
        status: "published",
        fields: [
          {
            id: "name",
            type: "text",
            label: "Full Name",
            required: true,
            validation: {},
          },
          {
            id: "email",
            type: "email",
            label: "Email",
            required: true,
            validation: {},
          },
          {
            id: "phone",
            type: "tel",
            label: "Phone Number",
            required: true,
            validation: {},
          },
          {
            id: "service",
            type: "select",
            label: "Service of Interest",
            required: false,
            options: [
              "General Consultation",
              "Travel Planning",
              "Custom Package",
              "Other",
            ],
            validation: {},
          },
          {
            id: "preferredDate",
            type: "date",
            label: "Preferred Consultation Date",
            required: false,
            validation: {},
          },
          {
            id: "message",
            type: "textarea",
            label: "How can we help you?",
            required: false,
            validation: {},
          },
        ],
        successMessage:
          "Thank you for your consultation request! We'll get back to you soon.",
        redirectUrl: "",
      };

      // Find an admin user to be the creator
      const adminUser = await User.findOne({ role: "admin" }).sort({
        createdAt: 1,
      });

      if (adminUser) {
        form = await formService.createForm(
          consultationFormData,
          adminUser._id
        );
      }
    }

    if (!form || form.status !== "published") {
      res.status(404);
      throw new Error("Form not found or not available");
    }

    return ApiResponse.success(res, form);
  } catch (error) {
    next(error);
  }
};

export const createForm = async (req, res, next) => {
  try {
    const formData = req.body;
    const userId = req.user._id;

    const form = await formService.createForm(formData, userId);

    return ApiResponse.success(res, form, "Form created successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const updateForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    if (formData.status === "published" && !formData.slug) {
      formData.slug = formData.title
        ? formService.ensureValidSlug({
            title: formData.title,
            status: "published",
          }).slug
        : undefined;

      if (!formData.slug) {
        return res.status(400).json({
          success: false,
          message: "A title is required to publish a form",
        });
      }
    }

    const updatedForm = await formService.updateForm(id, formData);
    return ApiResponse.success(res, updatedForm);
  } catch (error) {
    next(error);
  }
};

export const deleteForm = async (req, res, next) => {
  try {
    const { id } = req.params;

    const form = await formService.getFormById(id);

    const protectedForms = [
      "plan-your-trip",
      "consultation",
      "consultation-request",
    ];

    if (protectedForms.includes(form.slug)) {
      res.status(403);
      throw new Error(
        `Cannot delete the '${form.title}' form as it is required for the website functionality`
      );
    }

    await formService.deleteForm(id);

    return ApiResponse.success(res, null, "Form deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const submitForm = async (req, res, next) => {
  try {
    const { id } = req.params;

    let data;

    if (req.body.data) {
      data =
        typeof req.body.data === "string"
          ? JSON.parse(req.body.data)
          : req.body.data;
    } else {
      data = req.body;
    }

    // Handle file attachments if present
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        // Store the URL path, not the absolute file system path
        data[file.fieldname] = `/uploads/${file.filename}`;
      });
    }

    const submission = await formService.submitForm(id, data);

    return ApiResponse.success(
      res,
      submission,
      "Form submitted successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

export const submitConsultation = async (req, res, next) => {
  try {
    let data;

    if (req.body.data) {
      data =
        typeof req.body.data === "string"
          ? JSON.parse(req.body.data)
          : req.body.data;
    } else {
      data = req.body;
    }

    // Handle file attachments if present
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        data[file.fieldname] = `/uploads/${file.filename}`;
      });
    }

    // Check for both legacy and new slugs
    let consultationForm = await formService.getFormBySlug(
      "consultation-request"
    );
    if (!consultationForm) {
      consultationForm = await formService.getFormBySlug("consultation");
    }

    if (!consultationForm) {
      const consultationFormData = {
        title: "Consultation Request",
        slug: "consultation-request",
        description: "Consultation requests from customers",
        status: "published",
        fields: [
          {
            id: "name",
            type: "text",
            label: "Full Name",
            required: true,
            validation: {},
          },
          {
            id: "email",
            type: "email",
            label: "Email",
            required: true,
            validation: {},
          },
          {
            id: "phone",
            type: "tel",
            label: "Phone Number",
            required: true,
            validation: {},
          },
          {
            id: "service",
            type: "select",
            label: "Service of Interest",
            required: false,
            options: [
              "General Consultation",
              "Travel Planning",
              "Custom Package",
              "Other",
            ],
            validation: {},
          },
          {
            id: "preferredDate",
            type: "date",
            label: "Preferred Consultation Date",
            required: false,
            validation: {},
          },
          {
            id: "message",
            type: "textarea",
            label: "How can we help you?",
            required: false,
            validation: {},
          },
        ],
        successMessage:
          "Thank you for your consultation request! We'll get back to you soon.",
        redirectUrl: "",
      };

      // Find an admin user to be the creator (required field)
      const adminUser = await User.findOne({ role: "admin" }).sort({
        createdAt: 1,
      });

      if (!adminUser) {
        return next(
          new ApiError(500, "No admin user found to create system form")
        );
      }

      consultationForm = await formService.createForm(
        consultationFormData,
        adminUser._id
      );
    }

    const submission = await formService.submitFormFlexible(
      consultationForm._id,
      data
    );

    return ApiResponse.success(
      res,
      submission,
      "Consultation request submitted successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

export const markSubmissionAsRead = async (req, res, next) => {
  try {
    const { formId, submissionId } = req.params;

    const result = await formService.markSubmissionAsRead(formId, submissionId);

    return ApiResponse.success(
      res,
      result,
      "Submission marked as read successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const deleteSubmission = async (req, res, next) => {
  try {
    const { formId, submissionId } = req.params;

    await formService.deleteSubmission(formId, submissionId);

    return ApiResponse.success(res, null, "Submission deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const updateSubmissionNotes = async (req, res, next) => {
  try {
    const { formId, submissionId } = req.params;
    const { notes } = req.body;

    const result = await formService.updateSubmissionNotes(
      formId,
      submissionId,
      notes
    );

    return ApiResponse.success(
      res,
      result,
      "Submission notes updated successfully"
    );
  } catch (error) {
    next(error);
  }
};
