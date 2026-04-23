const express = require("express");
const { getDoctorReportPdf } = require("../controllers/reportController");

const router = express.Router();

router.get("/doctor-pdf", getDoctorReportPdf);

module.exports = router;
