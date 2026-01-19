import Notification from "../models/notificationModel.js";

class NotificationService {
  async createNotification(data) {
    return await Notification.create(data);
  }

  async getUserNotifications(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Notification.countDocuments({ recipient: userId });
    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

    return {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );
    return notification;
  }

  async markAllAsRead(userId) {
    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
    return { success: true };
  }

  async deleteNotification(notificationId, userId) {
    await Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
    return { success: true };
  }

  // Specialized helpers
  async notifyQuizAssigned(userId, quiz) {
    return this.createNotification({
      recipient: userId,
      title: {
        ar: "تم تعيين اختبار جديد",
        en: "New Quiz Assigned",
      },
      message: {
        ar: `تمت إضافة اختبار جديد بعنوان "${quiz.title.ar}" في الدورة`,
        en: `A new quiz titled "${quiz.title.en}" has been added to your course`,
      },
      type: "quiz_assigned",
      link: `/courses/quiz/${quiz._id}`,
      metadata: { quizId: quiz._id },
    });
  }

  async notifyCourseCompleted(userId, course) {
    return this.createNotification({
      recipient: userId,
      title: {
        ar: "تهانينا! أكملت الدورة",
        en: "Congratulations! Course Completed",
      },
      message: {
        ar: `لقد أكملت بنجاح دورة "${course.title.ar}"`,
        en: `You have successfully completed the course "${course.title.en}"`,
      },
      type: "course_completed",
      link: `/courses/${course.slug}`,
      metadata: { courseId: course._id },
    });
  }

  async notifyCertificateIssued(userId, certificate) {
    return this.createNotification({
      recipient: userId,
      title: {
        ar: "تم إصدار شهادتك",
        en: "Certificate Issued",
      },
      message: {
        ar: `شهادة إتمام دورة "${certificate.courseName.ar}" متاحة الآن للتحميل`,
        en: `Your certificate for "${certificate.courseName.en}" is now available for download`,
      },
      type: "certificate_issued",
      link: "/account/certificates",
      metadata: { certificateId: certificate._id },
    });
  }
}

export default new NotificationService();
