import certificateService from "../services/certificateService.js";
import Certificate from "../models/certificateModel.js";
import CertificateTemplate from "../models/certificateTemplateModel.js";

// ============ CERTIFICATE CONTROLLERS ============

// Get all certificates (Admin)
export const getAllCertificates = async (req, res, next) => {
  try {
    const { status, courseId, userId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (courseId) query.courseId = courseId;
    if (userId) query.userId = userId;

    const certificates = await Certificate.find(query)
      .populate("userId", "fullName email avatar")
      .populate("courseId", "title slug thumbnail certificateSettings")
      .populate("issuedBy", "fullName")
      .sort({ issuedAt: -1 });

    res.status(200).json({
      success: true,
      data: certificates,
    });
  } catch (error) {
    next(error);
  }
};

// Issue certificate to a user
export const issueCertificate = async (req, res, next) => {
  try {
    const { userId, courseId, templateId } = req.body;
    const issuerUserId = req.user._id;

    const certificate = await certificateService.issueCertificate(
      userId,
      courseId,
      issuerUserId,
      true, // Manual override allowed for Admin/Teacher
      templateId // Pass manual template ID
    );

    res.status(201).json({
      success: true,
      message: "Certificate issued successfully",
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

// Bulk issue certificates
export const bulkIssueCertificates = async (req, res, next) => {
  try {
    const { certificates } = req.body;
    const issuerUserId = req.user._id;

    if (!Array.isArray(certificates) || certificates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Certificates array is required",
      });
    }

    const results = await certificateService.bulkIssueCertificates(
      certificates,
      issuerUserId
    );

    res.status(200).json({
      success: true,
      message: `Issued ${results.success.length} certificates. ${results.failed.length} failed.`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// Get certificate by ID
export const getCertificateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const certificate = await certificateService.getCertificateById(id);

    res.status(200).json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

// Verify certificate by number (public)
export const verifyCertificate = async (req, res, next) => {
  try {
    const { certificateNumber } = req.params;
    const certificate = await certificateService.verifyCertificate(
      certificateNumber
    );

    res.status(200).json({
      success: true,
      message: "Certificate is valid",
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

// Get certificates by email (public)
export const getCertificatesByEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const result = await certificateService.getCertificatesByEmail(email);

    res.status(200).json({
      success: true,
      message: "Certificates retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Download certificate PDF (public - by certificate number)
export const downloadCertificatePublic = async (req, res, next) => {
  try {
    const { certificateNumber } = req.params;

    if (!certificateNumber) {
      return res.status(400).json({
        success: false,
        message: "Certificate number is required"
      });
    }

    // Find certificate by number
    let certificate;
    try {
      certificate = await certificateService.verifyCertificate(certificateNumber);
    } catch (error) {
      console.error('Certificate not found:', error.message);
      return res.status(404).json({
        success: false,
        message: "Certificate not found"
      });
    }

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found"
      });
    }

    // Get or generate PDF
    const certId = certificate._id || certificate.id;
    const pdfBuffer = await certificateService.getCertificatePDF(certId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=certificate-${certificate.certificateNumber}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error downloading certificate:', error);
    // Send a more informative error response
    res.status(500).json({
      success: false,
      message: "Failed to generate certificate PDF",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's certificates
export const getUserCertificates = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    const certificates = await certificateService.getUserCertificates(userId);

    res.status(200).json({
      success: true,
      data: certificates,
    });
  } catch (error) {
    next(error);
  }
};

// Get eligibility for all my courses
export const getMyCertificatesEligibility = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const eligibility = await certificateService.getCertificateEligibility(userId);

    res.status(200).json({
      success: true,
      data: eligibility,
    });
  } catch (error) {
    next(error);
  }
};

// Claim certificate (Student)
export const claimCertificate = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id;

    const certificate = await certificateService.issueCertificate(
      userId,
      courseId,
      userId,
      false // Verify eligibility
    );

    res.status(201).json({
      success: true,
      message: "Certificate claimed successfully",
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

// Get all certificates for a course (Admin)
export const getCourseCertificates = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { status } = req.query;

    const filters = {};
    if (status) filters.status = status;

    const certificates = await certificateService.getCourseCertificates(
      courseId,
      filters
    );

    res.status(200).json({
      success: true,
      data: certificates,
    });
  } catch (error) {
    next(error);
  }
};

// Revoke certificate
export const revokeCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const revokedBy = req.user._id;

    const certificate = await certificateService.revokeCertificate(
      id,
      reason,
      revokedBy
    );

    res.status(200).json({
      success: true,
      message: "Certificate revoked successfully",
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

// Reissue certificate
export const reissueCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reissuedBy = req.user._id;

    const certificate = await certificateService.reissueCertificate(
      id,
      reissuedBy
    );

    res.status(200).json({
      success: true,
      message: "Certificate reissued successfully",
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

// Download certificate PDF
export const downloadCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const certificate = await certificateService.getCertificateById(id);
    const pdfBuffer = await certificateService.getCertificatePDF(id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=certificate-${certificate.certificateNumber}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// Generate certificate PDF (force regenerate)
export const generateCertificatePDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { pdfUrl } = await certificateService.generateCertificatePDF(id);

    res.status(200).json({
      success: true,
      message: "Certificate PDF generated successfully",
      data: { pdfUrl },
    });
  } catch (error) {
    next(error);
  }
};

// Regenerate all certificates PDFs (Admin only)
export const regenerateAllCertificatesPDFs = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({
      $or: [
        { pdfGenerated: false },
        { pdfGenerated: { $exists: false } },
        { pdfUrl: null },
        { pdfUrl: { $exists: false } }
      ]
    });

    const results = {
      total: certificates.length,
      success: 0,
      failed: 0,
      errors: []
    };

    for (const cert of certificates) {
      try {
        await certificateService.generateCertificatePDF(cert._id);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          certificateId: cert._id,
          certificateNumber: cert.certificateNumber,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Regenerated ${results.success} certificates. ${results.failed} failed.`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// Diagnostic endpoint to check template data
export const getCertificateTemplateInfo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const certificate = await certificateService.getCertificateById(id);

    // Get template info
    let templateInfo = null;
    if (certificate.templateId) {
      const template = await CertificateTemplate.findById(certificate.templateId);
      if (template) {
        templateInfo = {
          id: template._id,
          name: template.name,
          hasPlaceholders: !!template.placeholders,
          placeholderKeys: template.placeholders ? Object.keys(template.placeholders) : [],
          placeholders: template.placeholders,
          width: template.width,
          height: template.height,
          backgroundImage: template.backgroundImage
        };
      }
    }

    // Get default template if no specific template
    let defaultTemplate = null;
    if (!templateInfo) {
      const defaultTemp = await CertificateTemplate.findOne({ isDefault: true });
      if (defaultTemp) {
        defaultTemplate = {
          id: defaultTemp._id,
          name: defaultTemp.name,
          hasPlaceholders: !!defaultTemp.placeholders,
          placeholderKeys: defaultTemp.placeholders ? Object.keys(defaultTemp.placeholders) : [],
          width: defaultTemp.width,
          height: defaultTemp.height
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        certificate: {
          id: certificate._id,
          certificateNumber: certificate.certificateNumber,
          studentName: certificate.studentName,
          courseName: certificate.courseName,
          templateId: certificate.templateId,
          issuedAt: certificate.issuedAt
        },
        template: templateInfo,
        defaultTemplate: defaultTemplate,
        willUseTemplate: templateInfo || defaultTemplate
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============ CERTIFICATE TEMPLATE CONTROLLERS ============

// Create template
export const createTemplate = async (req, res, next) => {
  try {
    const templateData = {
      ...req.body,
      createdBy: req.user._id,
    };
    const template = await certificateService.createTemplate(templateData);

    res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

// Get template by ID
export const getTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await certificateService.getTemplateById(id);

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

// Get all templates
export const getAllTemplates = async (req, res, next) => {
  try {
    const { isActive } = req.query;

    const filters = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === "true";
    }

    const templates = await certificateService.getAllTemplates(filters);

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

// Update template
export const updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user._id,
    };
    const template = await certificateService.updateTemplate(id, updateData);

    res.status(200).json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

// Delete template
export const deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await certificateService.deleteTemplate(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
