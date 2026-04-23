const asyncHandler = require("../../../utils/asyncHandler");
const reportService = require("../services/reportService");

const getDoctorReportPdf = asyncHandler(async (req, res) => {
  const pdfBuffer = await reportService.generateDoctorReportPdf(req.user, req.query);
  const reportDate = new Date().toISOString().slice(0, 10);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="health-report-${reportDate}.pdf"`
  );
  res.setHeader("Content-Length", pdfBuffer.length);

  res.status(200).send(pdfBuffer);
});

module.exports = {
  getDoctorReportPdf,
};
