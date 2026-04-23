const PDFDocument = require("pdfkit");
const PeriodLog = require("../../../models/PeriodLog");
const MoodLog = require("../../../models/MoodLog");
const WaterLog = require("../../../models/WaterLog");

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toISOString().slice(0, 10);
};

const toStartOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const buildDateRange = ({ startDate, endDate }) => {
  const end = endDate ? toStartOfDay(endDate) : toStartOfDay(new Date());
  const start = startDate
    ? toStartOfDay(startDate)
    : new Date(end.getTime() - 89 * DAY_MS);
  return { start, end };
};

const withPageGuard = (doc, lines = 1) => {
  const estimatedHeight = lines * 18;
  if (doc.y + estimatedHeight > doc.page.height - 50) {
    doc.addPage();
    doc.fontSize(10).fillColor("#666").text("Health Report (continued)", 50, 40);
    doc.moveDown();
  }
};

const drawSectionTitle = (doc, title) => {
  withPageGuard(doc, 2);
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#111").text(title);
  doc.moveDown(0.3);
  doc
    .strokeColor("#d1d5db")
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .stroke();
  doc.moveDown(0.5);
};

const drawKeyValue = (doc, key, value) => {
  withPageGuard(doc, 1);
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#111")
    .text(`${key}: `, { continued: true })
    .font("Helvetica")
    .fillColor("#333")
    .text(value || "-");
};

const collectReportData = async (userId, filters) => {
  const { start, end } = buildDateRange(filters);
  const query = { userId, date: { $gte: start, $lte: end } };

  const [periodHistory, moodLogs, waterLogs] = await Promise.all([
    PeriodLog.find({
      userId,
      startDate: { $gte: start, $lte: end },
    }).sort({ startDate: -1 }),
    MoodLog.find(query).sort({ date: -1 }),
    WaterLog.find(query).sort({ date: -1 }),
  ]);

  return {
    range: { start, end },
    periodHistory,
    moodLogs,
    waterLogs,
  };
};

const generateDoctorReportPdf = async (user, filters = {}) => {
  const reportData = await collectReportData(user.id, filters);

  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
    info: {
      Title: "Health Tracking Report",
      Author: "Health Tracker App",
      Subject: "Doctor Summary",
    },
  });

  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  const done = new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.font("Helvetica-Bold").fontSize(20).fillColor("#111").text("Health Tracking Report");
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(11).fillColor("#333");
  doc.text(`Patient: ${user.name || "User"}`);
  doc.text(`Email: ${user.email || "-"}`);
  doc.text(`Generated on: ${new Date().toISOString().slice(0, 10)}`);
  doc.text(
    `Coverage: ${formatDate(reportData.range.start)} to ${formatDate(reportData.range.end)}`
  );

  drawSectionTitle(doc, "Clinical Summary");
  drawKeyValue(doc, "Period records", String(reportData.periodHistory.length));
  drawKeyValue(doc, "Mood records", String(reportData.moodLogs.length));
  drawKeyValue(doc, "Hydration records", String(reportData.waterLogs.length));

  drawSectionTitle(doc, "Period History");
  if (!reportData.periodHistory.length) {
    doc.font("Helvetica").fontSize(10).text("No period logs available for this range.");
  } else {
    reportData.periodHistory.forEach((log, index) => {
      withPageGuard(doc, 4);
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#111")
        .text(
          `${index + 1}. ${formatDate(log.startDate)} to ${formatDate(log.endDate)}`,
          50,
          doc.y
        );
      doc.font("Helvetica").fillColor("#333").text(`Symptoms: ${(log.symptoms || []).join(", ") || "-"}`);
      doc.text(`Notes: ${log.notes || "-"}`);
      doc.moveDown(0.4);
    });
  }

  drawSectionTitle(doc, "Mood Logs");
  if (!reportData.moodLogs.length) {
    doc.font("Helvetica").fontSize(10).text("No mood logs available for this range.");
  } else {
    reportData.moodLogs.forEach((log, index) => {
      withPageGuard(doc, 3);
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#111")
        .text(`${index + 1}. ${formatDate(log.date)} - ${log.mood}`);
      doc.font("Helvetica").fillColor("#333").text(`Note: ${log.note || "-"}`);
      doc.moveDown(0.3);
    });
  }

  drawSectionTitle(doc, "Hydration Logs");
  if (!reportData.waterLogs.length) {
    doc.font("Helvetica").fontSize(10).text("No hydration logs available for this range.");
  } else {
    reportData.waterLogs.forEach((log, index) => {
      withPageGuard(doc, 2);
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#111")
        .text(`${index + 1}. ${formatDate(log.date)} - ${log.intake} glasses/bottles`);
    });
  }

  doc.moveDown(1);
  withPageGuard(doc, 2);
  doc
    .font("Helvetica-Oblique")
    .fontSize(9)
    .fillColor("#555")
    .text(
      "Note: This report is informational and should be interpreted by a qualified medical professional."
    );

  doc.end();
  return done;
};

module.exports = {
  generateDoctorReportPdf,
};
