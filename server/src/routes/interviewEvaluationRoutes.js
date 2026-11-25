const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const {
    evaluateInterviewAnswer,
} = require("../services/interviewEvaluationService");

const router = express.Router();
console.log("Interview evaluation routes loaded");
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Interview evaluation route is working!"
    });
});


router.post(
    "/evaluate",
    authMiddleware,
    async (req, res) => {
        try {
            const {
                question,
                answer,
            } = req.body;

            if (!question || !answer) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Question and answer are required.",
                });
            }

            console.log(
                "Evaluating interview answer..."
            );

            const evaluation =
                await evaluateInterviewAnswer({
                    question,
                    answer,
                });

            console.log(
                "Interview answer evaluation completed."
            );

            return res.status(200).json({
                success: true,
                message:
                    "Interview answer evaluated successfully.",
                evaluation,
            });
        } catch (error) {
            console.error(
                "Interview evaluation error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error?.message ||
                    "Unable to evaluate the interview answer.",
            });
        }
    }
);

module.exports = router;