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
import Package from "../models/packageModel.js";
import StudentMember from "../models/studentMemberModel.js";


class CertificateService {
  // Generate certificate number
  generateCertificateNumber() {
    const prefix = "CERT";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = uuidv4().split("-")[0].toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  // Issue certificate to a single user (Course or Package)
  async issueCertificate(userId, courseId, issuerUserId, overrideEligibility = false, manualTemplateId = null, packageId = null, studentMemberId = null) {
    // Check if certificate already exists
    const query = {};
    if (courseId) query.courseId = courseId;
    if (packageId) query.packageId = packageId;

    // Uniqueness check: prefer studentMemberId if available (more specific for this flow)
    if (studentMemberId) {
      query.studentMemberId = studentMemberId;
    } else if (userId) {
      query.userId = userId;
    } else {
      throw new Error("Either User ID or Student Member ID is required");
    }

    const existing = await Certificate.findOne(query);
    if (existing) {
      return existing;
    }

    // Validate eligibility (skip if override is true)
    if (!overrideEligibility && userId && courseId) {
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

    // Get recipient info
    let user = null;
    let studentMember = null;

    if (userId) user = await User.findById(userId);
    if (studentMemberId) studentMember = await StudentMember.findById(studentMemberId);

    const course = courseId ? await Course.findById(courseId) : null;
    const pkg = packageId ? await Package.findById(packageId) : null;

    // Debug: Log fetched course/package data
    console.log('=== ISSUE CERTIFICATE DEBUG ===');
    console.log('courseId:', courseId);
    console.log('packageId:', packageId);
    console.log('course found:', !!course);
    console.log('course title:', course?.title);
    console.log('package found:', !!pkg);
    console.log('package name:', pkg?.name);
    console.log('================================');

    if ((!user && !studentMember) || (!course && !pkg)) {
      throw new Error("Recipient (User/Student) or Source (Course/Package) not found");
    }

    // Determine Names
    let studentNameAr = "الطالب";
    let studentNameEn = "Student";

    if (studentMember) {
      studentNameAr = studentMember.name.ar;
      studentNameEn = studentMember.name.en;
    } else if (user) {
      studentNameAr = user.fullName?.ar || user.fullName?.en || "الطالب";
      studentNameEn = user.fullName?.en || user.fullName?.ar || "Student";
    }

    // Generate certificate
    const certificateNumber = this.generateCertificateNumber();

    // Get template
    let templateId = manualTemplateId;
    if (!templateId && course?.certificateSettings?.templateId) {
      templateId = course.certificateSettings.templateId;
    }
    if (!templateId && pkg) {
      const pkgTemplate = await CertificateTemplate.findOne({ packageId: pkg._id });
      if (pkgTemplate) templateId = pkgTemplate._id;
    }

    // Prepare certificate data
    const courseNameAr = course ? course.title?.ar : (pkg ? pkg.name?.ar : "Certificate");
    const courseNameEn = course ? course.title?.en : (pkg ? pkg.name?.en : "Certificate");

    console.log('=== CREATING CERTIFICATE WITH DATA ===');
    console.log('studentNameAr:', studentNameAr);
    console.log('studentNameEn:', studentNameEn);
    console.log('courseNameAr:', courseNameAr);
    console.log('courseNameEn:', courseNameEn);
    console.log('=======================================');

    const certificate = await Certificate.create({
      userId: userId || undefined, // Optional now
      studentMemberId: studentMemberId || undefined,
      courseId,
      packageId,
      certificateNumber,
      studentName: {
        ar: studentNameAr,
        en: studentNameEn,
      },
      courseName: {
        ar: courseNameAr || 'الدورة',
        en: courseNameEn || 'Course',
      },
      issuedAt: new Date(),
      issuedBy: issuerUserId,
      status: "issued",
      templateId,
    });

    // Update progress (only if user exists and it's a course)
    if (user && courseId) {
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
    }

    // Notify user (only if user exists)
    if (user) {
      try {
        await notificationService.notifyCertificateIssued(userId, certificate);
      } catch (notifError) {
        console.log("Certificate notification failed:", notifError.message);
      }
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
          templateId: course.certificateSettings?.templateId || null,
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

  // Bulk issue certificates for Package Students
  async bulkIssuePackageCertificates(packageId, issuerUserId) {
    const pkg = await Package.findById(packageId);
    if (!pkg) throw new Error("Package not found");

    const students = await StudentMember.find({
      packageId: pkg._id,
      status: "active"
    }).populate("userId");

    const template = await CertificateTemplate.findOne({ packageId: pkg._id });
    if (!template) throw new Error("No certificate template found for this package");

    const results = {
      success: [],
      failed: []
    };

    for (const student of students) {
      try {
        // Resolve User ID if available, otherwise null
        const userId = student.userId ? (student.userId._id || student.userId) : null;

        const cert = await this.issueCertificate(
          userId,
          null, // No courseId
          issuerUserId,
          true, // Override eligibility
          template._id,
          pkg._id,
          student._id // Pass StudentMember ID
        );

        results.success.push({
          studentId: student._id,
          name: student.name,
          certificateNumber: cert.certificateNumber
        });

      } catch (error) {
        results.failed.push({
          studentId: student._id,
          name: student.name,
          reason: error.message
        });
      }
    }

    return results;
  }

  // Get certificate by ID
  async getCertificateById(certificateId) {
    const certificate = await Certificate.findById(certificateId)
      .populate("userId", "fullName email avatar")
      .populate("courseId", "title slug thumbnail certificateSettings")
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
      .populate("courseId", "title certificateSettings");

    if (!certificate) {
      throw new Error("Certificate not found");
    }

    if (certificate.status === "revoked") {
      throw new Error("Certificate has been revoked");
    }

    return certificate;
  }

  // Get certificates by user email (public)
  async getCertificatesByEmail(email) {
    // Find user by email
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { email: email }
      ]
    });

    if (!user) {
      throw new Error("No user found with this email");
    }

    // Get all issued certificates for this user
    const certificates = await Certificate.find({
      userId: user._id,
      status: "issued"
    })
      .populate("courseId", "title slug thumbnail certificateSettings")
      .sort({ issuedAt: -1 });

    if (certificates.length === 0) {
      throw new Error("No certificates found for this email");
    }

    // Return certificates with user info
    return {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      },
      certificates: certificates.map(cert => ({
        id: cert._id,
        certificateNumber: cert.certificateNumber,
        course: cert.courseId,
        issuedAt: cert.issuedAt,
        studentName: cert.studentName,
        pdfUrl: cert.pdfUrl,
        pdfGenerated: cert.pdfGenerated
      }))
    };
  }

  // Get user's certificates
  async getUserCertificates(userId) {
    const certificates = await Certificate.find({ userId })
      .populate("courseId", "title slug thumbnail certificateSettings")
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
      .populate("courseId", "title slug thumbnail certificateSettings")
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
      .populate("courseId", "title certificateSettings")
      .populate("packageId", "name");  // Add package populate

    if (!certificate) {
      throw new Error("Certificate not found");
    }

    // DEBUG: Log raw certificate data
    console.log('=== RAW CERTIFICATE DATA ===');
    console.log('certificate._id:', certificate._id);
    console.log('certificate.certificateNumber:', certificate.certificateNumber);
    console.log('certificate.studentName:', JSON.stringify(certificate.studentName));
    console.log('certificate.courseName:', JSON.stringify(certificate.courseName));
    console.log('certificate.userId:', certificate.userId ? { _id: certificate.userId._id, fullName: certificate.userId.fullName } : null);
    console.log('certificate.courseId:', certificate.courseId ? { _id: certificate.courseId._id, title: certificate.courseId.title } : null);
    console.log('certificate.packageId:', certificate.packageId ? { _id: certificate.packageId._id, name: certificate.packageId.name } : null);
    console.log('==============================');

    // Get template (use default if not specified)
    let template = null;

    // 1. Try to use the template explicitly assigned to the certificate
    if (certificate.templateId) {
      template = await CertificateTemplate.findById(certificate.templateId).lean();
    }

    // 2. If no template assigned (or not found), look at the course settings
    if (!template && certificate.courseId && certificate.courseId.certificateSettings?.templateId) {
      console.log(`Certificate ${certificate.certificateNumber} has no template. Falling back to course template.`);
      template = await CertificateTemplate.findById(certificate.courseId.certificateSettings.templateId).lean();

      // If found, update the certificate to link to this template for future use
      if (template) {
        certificate.templateId = template._id;
        console.log(`Linked certificate ${certificate.certificateNumber} to course template ${template.name} (${template._id})`);
      }
    }

    // 2b. Try to find template linked directly to the course by courseId field
    if (!template && certificate.courseId) {
      const courseIdStr = certificate.courseId._id || certificate.courseId;
      template = await CertificateTemplate.findOne({ courseId: courseIdStr }).lean();
      if (template) {
        certificate.templateId = template._id;
        console.log(`Found template linked to course ${courseIdStr}: ${template.name}`);
      }
    }

    // 3. If still no template, try to find a system default
    if (!template) {
      // Get default template
      template = await CertificateTemplate.findOne({ isDefault: true }).lean();
      if (template) {
        console.log(`Using system default template for certificate ${certificate.certificateNumber}`);
      }
    }

    // 4. Last resort: internal default structure
    if (!template) {
      console.warn(`No template found for certificate ${certificate.certificateNumber}. Using hardcoded fallback.`);
      // Use system default template
      template = {
        width: 1200,
        height: 900,
        placeholders: {},
        isFallback: true
      };
    }

    // Convert template to plain object to ensure all nested properties are accessible
    // With .lean() queries, template is already a plain object, but we deep clone to be safe
    let templateData;
    if (template.toObject) {
      // Mongoose document (shouldn't happen with .lean() but just in case)
      templateData = template.toObject({ getters: false, virtuals: false });
    } else {
      // Already a plain object from .lean() - deep clone to avoid mutations
      templateData = JSON.parse(JSON.stringify(template));
    }

    // Log template data for debugging
    console.log('Template data being used:', {
      id: templateData._id || templateData.id,
      name: templateData.name,
      width: templateData.width,
      height: templateData.height,
      hasPlaceholders: !!templateData.placeholders,
      placeholderKeys: templateData.placeholders ? Object.keys(templateData.placeholders) : [],
      studentNamePlaceholder: templateData.placeholders?.studentName,
      courseNamePlaceholder: templateData.placeholders?.courseName,
    });

    // Prepare certificate data with locale hint
    // ALWAYS use fresh data from populated relations for accuracy
    // Stored values in certificate might be stale or empty
    
    // Get student name - prefer populated user data over stored values
    let studentNameData = { ar: '', en: '' };
    if (certificate.userId && certificate.userId.fullName) {
      // Use fresh data from populated user
      studentNameData = {
        ar: certificate.userId.fullName.ar || certificate.userId.fullName.en || '',
        en: certificate.userId.fullName.en || certificate.userId.fullName.ar || ''
      };
      console.log('Using fresh student name from populated user:', JSON.stringify(studentNameData));
    } else if (certificate.studentName && (certificate.studentName.ar || certificate.studentName.en)) {
      // Fallback to stored values if no populated user
      studentNameData = certificate.studentName;
      console.log('Using stored student name:', JSON.stringify(studentNameData));
    }

    // Get course/package name - ALWAYS prefer populated relation data
    let courseNameData = { ar: '', en: '' };
    if (certificate.courseId && certificate.courseId.title) {
      // Use fresh data from populated course
      courseNameData = {
        ar: certificate.courseId.title.ar || certificate.courseId.title.en || '',
        en: certificate.courseId.title.en || certificate.courseId.title.ar || ''
      };
      console.log('Using fresh course name from populated course:', JSON.stringify(courseNameData));
    } else if (certificate.packageId && certificate.packageId.name) {
      // Use fresh data from populated package
      courseNameData = {
        ar: certificate.packageId.name.ar || certificate.packageId.name.en || '',
        en: certificate.packageId.name.en || certificate.packageId.name.ar || ''
      };
      console.log('Using fresh package name from populated package:', JSON.stringify(courseNameData));
    } else if (certificate.courseName && (certificate.courseName.ar || certificate.courseName.en)) {
      // Last resort: use stored values
      courseNameData = certificate.courseName;
      console.log('Using stored course name:', JSON.stringify(courseNameData));
    }

    // DEBUG: Log resolved values
    console.log('=== RESOLVED DATA FROM POPULATED RELATIONS ===');
    console.log('studentNameData:', JSON.stringify(studentNameData));
    console.log('courseNameData:', JSON.stringify(courseNameData));

    // Check if data is valid (has actual content)
    const hasValidStudentName = (studentNameData.ar && studentNameData.ar.trim()) || 
                                (studentNameData.en && studentNameData.en.trim());
    const hasValidCourseName = (courseNameData.ar && courseNameData.ar.trim()) || 
                               (courseNameData.en && courseNameData.en.trim());

    console.log('hasValidStudentName:', hasValidStudentName);
    console.log('hasValidCourseName:', hasValidCourseName);

    // Apply defaults if data is still missing
    if (!hasValidStudentName) {
      console.log('No valid student name found, using defaults');
      studentNameData = { ar: 'الطالب', en: 'Student' };
    }

    if (!hasValidCourseName) {
      console.log('No valid course name found, using defaults');
      courseNameData = { ar: 'الدورة', en: 'Course' };
    }

    // Ensure we have valid objects with trimmed values
    const finalStudentName = {
      ar: (studentNameData?.ar || '').trim() || 'الطالب',
      en: (studentNameData?.en || '').trim() || 'Student'
    };
    const finalCourseName = {
      ar: (courseNameData?.ar || '').trim() || 'الدورة',
      en: (courseNameData?.en || '').trim() || 'Course'
    };

    const certificateData = {
      certificateNumber: certificate.certificateNumber,
      studentName: finalStudentName,
      courseName: finalCourseName,
      issuedAt: certificate.issuedAt,
      metadata: certificate.metadata,
    };

    // DEBUG: Log the certificate data being sent to PDF generation
    console.log('=== CERTIFICATE DATA FOR PDF ===');
    console.log('certificateNumber:', certificateData.certificateNumber);
    console.log('studentName:', JSON.stringify(certificateData.studentName));
    console.log('courseName:', JSON.stringify(certificateData.courseName));
    console.log('issuedAt:', certificateData.issuedAt);
    console.log('=================================');

    // Determine preferred locale - DEFAULT TO ARABIC
    // Only use English if Arabic data is completely missing
    let preferredLocale = 'ar';  // Default to Arabic for this platform
    const studentNameAr = certificate.studentName?.ar || '';
    const studentNameEn = certificate.studentName?.en || '';
    
    // Only switch to English if there's absolutely no Arabic content
    if (!studentNameAr && studentNameEn) {
      preferredLocale = 'en';
    }

    // Generate PDF with locale preference
    const pdfBuffer = await pdfGenerationService.generateCertificatePDF(
      certificateData,
      templateData,
      preferredLocale
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
   * Get certificate PDF (always regenerate for data freshness)
   */
  async getCertificatePDF(certificateId) {
    try {
      // Always regenerate PDF to ensure data freshness and correct course/student info
      // Old cached PDFs might have stale or incorrect data
      console.log(`Generating fresh PDF for certificate ${certificateId}`);
      const { pdfBuffer } = await this.generateCertificatePDF(certificateId);
      return pdfBuffer;
    } catch (error) {
      console.error('Error in getCertificatePDF:', error);
      throw error;
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
