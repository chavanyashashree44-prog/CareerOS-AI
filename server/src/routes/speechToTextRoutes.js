
const express = require("express");
const multer = require("multer");

const authMiddleware = require("../middleware/authMiddleware");
const { transcribeAudio } = require("../services/speechToTextService");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

router.post(
    "/transcribe",
    authMiddleware,
    upload.single("audio"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Audio file is required.",
                });
            }

            console.log("Received audio:", {
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
            });

            const transcript = await transcribeAudio(
                req.file.buffer,
                req.file.mimetype,
                req.file.originalname
            );

            return res.status(200).json({
                success: true,
                message: "Audio transcribed successfully.",
                transcript,
            });
        } catch (error) {
            console.error("Speech-to-text error:", error);

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Unable to transcribe the audio.",
            });
        }
    }
);

module.exports = router;
