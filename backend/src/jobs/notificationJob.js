const cron = require("node-cron");
const notificationService = require("../modules/notifications/services/notificationService");

let isJobRunning = false;

const executeJob = async () => {
  if (isJobRunning) return;
  isJobRunning = true;

  try {
    const result = await notificationService.runNotificationJob();
    console.log("[notification-job] completed", result);
  } catch (error) {
    console.error("[notification-job] failed", error.message);
  } finally {
    isJobRunning = false;
  }
};

const startNotificationJob = () => {
  // Every day at 09:00 server time.
  cron.schedule("0 9 * * *", executeJob);
  console.log("[notification-job] scheduled at 09:00 daily");
};

module.exports = {
  startNotificationJob,
  executeNotificationJobNow: executeJob,
};
