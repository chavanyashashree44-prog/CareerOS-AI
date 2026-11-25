const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    getResumeAnalysisData,
} = require("../controllers/resumeAnalysisController");

const router = express.Router();

// =====================================================
// GET CURRENT USER'S RESUME DATA FOR AI ANALYSIS
// =====================================================

router.get(
    "/",
    authMiddleware,
    getResumeAnalysisData
);

module.exports = router;