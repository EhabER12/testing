import Certificate from "../models/certificateModel.js";
import CertificateTemplate from "../models/certificateTemplateModel.js";
import Course from "../models/courseModel.js";
import User from "../models/userModel.js";
import Progress from "../models/progressModel.js";
import Quiz from "../models/quizModel.js";
import quizService from "./quizService.js";
import notificationService from "./notificationService.js";
import pdfGenerationService from "./pdfGenerationService.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";

class CertificateService {
  // Generate certificate number
  generateCertificateNumber() {
    const prefix = "CERT";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = uuidv4().split("-")[0].toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  // Issue certificate to a single user
  async issueCertificate(userId, courseId, issuerUserId, overrideEligibility = false) {
    // Check if user already has certificate
    const existing = await Certificate.findOne({ userId, courseId });
    if (existing) {
      return existing;
    }

    // Validate eligibility (skip if override is true)
    if (!overrideEligibility) {
      const eligibility = await quizService.canUserGetCertificate(
        userId,
        courseId
      );
      if (!eligibility.canGet) {
        throw new Error(
          `User is not eligible for certificate: ${eligibility.reason}`
        );
      }
    }

    // Get user and course info
    const user = await User.findById(userId);
    const course = await Course.findById(courseId);

    if (!user || !course) {
      throw new Error("User or Course not found");
    }

    // Generate certificate
    const certificateNumber = this.generateCertificateNumber();

    // Get template from course settings
    let templateId = course.certificateSettings?.templateId || null;

    const certificate = await Certificate.create({
      userId,
      courseId,
      certificateNumber,
      studentName: {
        ar: user.fullName?.ar || user.fullName?.en || user.email || "الطالب",
        en: user.fullName?.en || user.fullName?.ar || user.email || "Student",
      },
      courseName: {
        ar: course.title.ar,
        en: course.title.en,
      },
      issuedAt: new Date(),
      issuedBy: issuerUserId,
      status: "issued",
      templateId,
    });

    // Update progress
    try {
      await Progress.findOneAndUpdate(
        { userId, courseId },
        { 
          certificateIssued: true, 
          certificateId: certificate._id 
        }
      );
    } catch (progressErr) {
      console.log("Failed to update progress certificate status:", progressErr.message);
    }

    // Notify user
    try {
      await notificationService.notifyCertificateIssued(userId, certificate);
    } catch (notifError) {
      console.log("Certificate notification failed:", notifError.message);
    }

    return certificate;
  }

  // Bulk issue certificates
  async bulkIssueCertificates(certificates, issuerUserId) {
    // certificates = [{ userId, courseId, studentName: { ar, en } }]
    const results = {
      success: [],
      failed: [],
    };

    for (const cert of certificates) {
      try {
        const { userId, courseId, studentName } = cert;

        if (!userId) {
          results.failed.push({
            ...cert,
            reason: "User ID is required",
          });
          continue;
        }

        // Check if already issued
        const existing = await Certificate.findOne({ userId, courseId });
        if (existing) {
          results.failed.push({
            ...cert,
            reason: "Certificate already issued",
          });
          continue;
        }

        const user = await User.findById(userId);
        if (!user) {
          results.failed.push({
            ...cert,
            reason: "User not found",
          });
          continue;
        }

        const course = await Course.findById(courseId);
        if (!course) {
          results.failed.push({
            ...cert,
            reason: "Course not found",
          });
          continue;
        }

        const certificateNumber = this.generateCertificateNumber();

        const newCert = await Certificate.create({
          userId,
          courseId,
          certificateNumber,
          studentName: studentName || {
            ar: user.fullName?.ar || user.fullName?.en || user.email || "الطالب",
            en: user.fullName?.en || user.fullName?.ar || user.email || "Student",
          },
          courseName: {
            ar: course.title.ar,
            en: course.title.en,
          },
          issuedAt: new Date(),
          issuedBy: issuerUserId,
          status: "issued",
        });

        results.success.push(newCert);
      } catch (error) {
        results.failed.push({
          ...cert,
          reason: error.message,
        });
      }
    }

    return results;
  }

  // Get certificate by ID
  async getCertificateById(certificateId) {
    const certificate = await Certificate.findById(certificateId)
      .populate("userId", "fullName email avatar")
      .populate("courseId", "title slug thumbnail")
      .populate("issuedBy", "fullName");

    if (!certificate) {
      throw new Error("Certificate not found");
    }

    return certificate;
  }

  // Get certificate by number (public verification)
  async verifyCertificate(certificateNumber) {
    const certificate = await Certificate.findOne({ certificateNumber })
      .populate("userId", "fullName")
      .populate("courseId", "title");

    if (!certificate) {
      throw new Error("Certificate not found");
    }

    if (certificate.status === "revoked") {
      throw new Error("Certificate has been revoked");
    }

    return certificate;
  }

  // Get user's certificates
  async getUserCertificates(userId) {
    const certificates = await Certificate.find({ userId })
      .populate("courseId", "title slug thumbnail")
      .sort({ issuedAt: -1 });

    return certificates;
  }

  // Get all certificates for a course (Admin)
  async getCourseCertificates(courseId, filters = {}) {
    const query = { courseId };

    if (filters.status) {
      query.status = filters.status;
    }

    const certificates = await Certificate.find(query)
      .populate("userId", "fullName email")
      .populate("issuedBy", "fullName")
      .sort({ issuedAt: -1 });

    return certificates;
  }

  // Get eligibility for all enrolled courses
  async getCertificateEligibility(userId) {
    const enrollments = await Progress.find({ userId })
      .populate("courseId", "title slug thumbnail certificateSettings");
    
    const results = [];
    
    for (const enrollment of enrollments) {
      const course = enrollment.courseId;
      if (!course) continue;

      // Check if certificate already exists
      const existing = await Certificate.findOne({ userId, courseId: course._id });
      
      if (existing) {
        results.push({
          courseId: course._id,
          courseTitle: course.title,
          courseSlug: course.slug,
          thumbnail: course.thumbnail,
          status: "claimed",
          certificateId: existing._id,
          certificateNumber: existing.certificateNumber,
          pdfUrl: existing.pdfUrl,
          issuedAt: existing.issuedAt
        });
        continue;
      }

      // Check eligibility
      try {
        const eligibility = await quizService.canUserGetCertificate(userId, course._id);
        results.push({
          courseId: course._id,
          courseTitle: course.title,
          courseSlug: course.slug,
          thumbnail: course.thumbnail,
          status: eligibility.canGet ? "eligible" : "not_eligible",
          reason: eligibility.reason,
          failedQuizzes: eligibility.failedQuizzes || [],
          progress: enrollment.percentage
        });
      } catch (err) {
        console.error(`Error checking eligibility for course ${course._id}:`, err);
      }
    }

    return results;
  }

  // Revoke certificate
  async revokeCertificate(certificateId, reason, revokedBy) {
    const certificate = await Certificate.findById(certificateId);
    if (!certificate) {
      throw new Error("Certificate not found");
    }

    if (certificate.status === "revoked") {
      throw new Error("Certificate already revoked");
    }

    certificate.status = "revoked";
    certificate.revokedAt = new Date();
    certificate.revokedBy = revokedBy;
    certificate.revocationReason = reason;

    await certificate.save();

    return certificate;
  }

  // Reissue certificate
  async reissueCertificate(certificateId, reissuedBy) {
    const oldCertificate = await Certificate.findById(certificateId);
    if (!oldCertificate) {
      throw new Error("Certificate not found");
    }

    // Revoke old one
    if (oldCertificate.status !== "revoked") {
      oldCertificate.status = "revoked";
      oldCertificate.revokedAt = new Date();
      oldCertificate.revokedBy = reissuedBy;
      oldCertificate.revocationReason = "Reissued";
      await oldCertificate.save();
    }

    // Create new one
    const certificateNumber = this.generateCertificateNumber();

    const newCertificate = await Certificate.create({
      userId: oldCertificate.userId,
      courseId: oldCertificate.courseId,
      certificateNumber,
      studentName: oldCertificate.studentName,
      courseName: oldCertificate.courseName,
      issuedAt: new Date(),
      issuedBy: reissuedBy,
      status: "issued",
      templateId: oldCertificate.templateId,
    });

    return newCertificate;
  }

  // ============ PDF GENERATION ============

  /**
   * Generate and save certificate PDF
   */
  async generateCertificatePDF(certificateId) {
    const certificate = await Certificate.findById(certificateId)
      .populate("userId", "fullName")
      .populate("courseId", "title");

    if (!certificate) {
      throw new Error("Certificate not found");
    }

    // Get template (use default if not specified)
    let template = null;
    if (certificate.templateId) {
      template = await CertificateTemplate.findById(certificate.templateId);
    }

    if (!template) {
      // Get default template
      template = await CertificateTemplate.findOne({ isDefault: true });
    }

    if (!template) {
      // Use system default template
      template = {
        width: 1200,
        height: 900,
        placeholders: {},
      };
    }

    // Prepare certificate data
    const certificateData = {
      certificateNumber: certificate.certificateNumber,
      studentName: certificate.studentName,
      courseName: certificate.courseName,
      issuedAt: certificate.issuedAt,
      metadata: certificate.metadata,
    };

    // Generate PDF
    const pdfBuffer = await pdfGenerationService.generateCertificatePDF(
      certificateData,
      template
    );

    // Save PDF
    const fileName = `${certificate.certificateNumber}.pdf`;
    const pdfUrl = await pdfGenerationService.savePDF(pdfBuffer, fileName);

    // Update certificate with PDF URL
    certificate.pdfUrl = pdfUrl;
    certificate.pdfGenerated = true;
    await certificate.save();

    return { pdfUrl, pdfBuffer };
  }

  /**
   * Get certificate PDF (generate if not exists)
   */
  async getCertificatePDF(certificateId) {
    const certificate = await Certificate.findById(certificateId);

    if (!certificate) {
      throw new Error("Certificate not found");
    }

    // Generate PDF if not generated yet
    if (!certificate.pdfGenerated || !certificate.pdfUrl) {
      const { pdfBuffer } = await this.generateCertificatePDF(certificateId);
      return pdfBuffer;
    }

    // Read existing PDF
    try {
      const pdfPath = path.join(
        process.cwd(),
        "uploads",
        "certificates",
        `${certificate.certificateNumber}.pdf`
      );
      const pdfBuffer = await fs.readFile(pdfPath);
      return pdfBuffer;
    } catch (error) {
      // Regenerate if file not found
      const { pdfBuffer } = await this.generateCertificatePDF(certificateId);
      return pdfBuffer;
    }
  }

  // ============ CERTIFICATE TEMPLATES ============

  // Create template
  async createTemplate(data) {
    const template = await CertificateTemplate.create(data);
    return template;
  }

  // Get template by ID
  async getTemplateById(templateId) {
    const template = await CertificateTemplate.findById(templateId);
    if (!template) {
      throw new Error("Template not found");
    }
    return template;
  }

  // Get all templates
  async getAllTemplates(filters = {}) {
    const query = {};

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const templates = await CertificateTemplate.find(query).sort({
      createdAt: -1,
    });

    return templates;
  }

  // Update template
  async updateTemplate(templateId, updates) {
    const template = await CertificateTemplate.findById(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    Object.keys(updates).forEach((key) => {
      template[key] = updates[key];
    });

    await template.save();
    return template;
  }

  // Delete template
  async deleteTemplate(templateId) {
    const template = await CertificateTemplate.findById(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check if used by courses
    const coursesUsing = await Course.countDocuments({
      "certificateSettings.templateId": templateId,
    });

    if (coursesUsing > 0) {
      throw new Error(
        `Cannot delete template. It is used by ${coursesUsing} course(s)`
      );
    }

    await template.deleteOne();
    return { message: "Template deleted successfully" };
  }
}

export default new CertificateService();
