import cron from "node-cron";
import { StudentMemberService } from "./studentMemberService.js";
import { SettingsRepository } from "../repositories/settingsRepository.js";
import logger from "../utils/logger.js";

export class StudentMemberSchedulerService {
  constructor() {
    this.studentMemberService = new StudentMemberService();
    this.settingsRepository = new SettingsRepository();
    this.scheduledTask = null;
  }

  /**
   * Initialize scheduler - runs daily at 9:00 AM
   */
  async initialize() {
    try {
      // Update statuses daily at 9:00 AM
      this.scheduledTask = cron.schedule("0 9 * * *", async () => {
        await this.runDailyTasks();
      });

      logger.info("Student Member Scheduler initialized - Daily at 9:00 AM");
    } catch (error) {
      logger.error("Failed to initialize Student Member Scheduler", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Run daily tasks
   */
  async runDailyTasks() {
    try {
      logger.info("Running daily student member tasks...");

      const settings = await this.settingsRepository.getSettings();
      const remindBeforeDays = 2; // Default

      // 1. Update all member statuses
      const statusResult = await this.studentMemberService.updateAllStatuses(
        remindBeforeDays
      );
      logger.info("Status update complete", {
        updatedCount: statusResult.updatedCount,
      });

      // 2. Get members due for reminder
      const members = await this.studentMemberService.getMembersDueForReminder(
        remindBeforeDays
      );

      if (members.length === 0) {
        logger.info("No members due for reminder today");
        return;
      }

      logger.info(`Found ${members.length} members due for reminder`);

      // 3. Send WhatsApp reminders
      const messageTemplate = this.getDefaultMessageTemplate();
      const results = await this.studentMemberService.sendBulkReminders(
        remindBeforeDays,
        messageTemplate
      );

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;

      logger.info("Bulk reminders sent", {
        total: results.length,
        successful: successCount,
        failed: failedCount,
      });

      // Log failures
      const failures = results.filter((r) => !r.success);
      if (failures.length > 0) {
        logger.warn("Failed reminders", {
          failures: failures.map((f) => ({
            memberId: f.memberId,
            name: f.name,
            phone: f.phone,
            error: f.error,
          })),
        });
      }
    } catch (error) {
      logger.error("Error running daily student member tasks", {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Get default WhatsApp message template
   */
  getDefaultMessageTemplate() {
    return `السلام عليكم ورحمة الله وبركاته 🌟

عزيزي/عزيزتي *{{name}}*،

نذكركم بأن موعد تجديد اشتراككم في البرنامج سيكون في:
📅 *{{dueDate}}*

⏰ الأيام المتبقية: *{{daysLeft}} يوم*

المعلمة المسؤولة: {{teacherName}}

للتجديد أو الاستفسار، يرجى التواصل معنا على:
📱 {{phone}}

بارك الله فيكم وجزاكم الله خيراً 🤲`;
  }

  /**
   * Stop scheduler
   */
  stop() {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      logger.info("Student Member Scheduler stopped");
    }
  }

  /**
   * Manually trigger daily tasks (for testing)
   */
  async triggerManual() {
    logger.info("Manually triggering student member tasks");
    await this.runDailyTasks();
  }
}
