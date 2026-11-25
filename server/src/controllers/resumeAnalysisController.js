const {
    getResumeForAnalysis,
} = require("../services/resumeAnalysisService");

const {
    analyzeResumeWithGemini,
} = require("../services/geminiService");

/**
 * Analyze the current user's resume using Gemini AI.
 */
const getResumeAnalysisData = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User is not authenticated.",
            });
        }

        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access token is missing.",
            });
        }

        const accessToken = authHeader
            .replace("Bearer ", "")
            .trim();

        // Get the complete saved resume.
        const resumeData = await getResumeForAnalysis(
            userId,
            accessToken
        );

        // Send the resume to Gemini for analysis.
        const analysis = await analyzeResumeWithGemini(
            resumeData
        );

        return res.status(200).json({
            success: true,
            message: "Resume analyzed successfully.",
            data: {
                resume: resumeData,
                analysis,
            },
        });
    } catch (error) {
        console.error(
            "Resume analysis controller error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Unable to analyze resume.",
        });
    }
};

module.exports = {
    getResumeAnalysisData,
};