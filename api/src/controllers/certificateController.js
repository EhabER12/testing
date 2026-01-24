import certificateService from "../services/certificateService.js";

// ============ CERTIFICATE CONTROLLERS ============

// Issue certificate to a user
export const issueCertificate = async (req, res, next) => {
  try {
    const { userId, courseId } = req.body;
    const issuerUserId = req.user._id;

    const certificate = await certificateService.issueCertificate(
      userId,
      courseId,
      issuerUserId,
      true // Manual override allowed for Admin/Teacher
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
