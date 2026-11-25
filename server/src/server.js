require("dotenv").config();




const express = require("express");
const cors = require("cors");

const profileRoutes = require("./routes/profileRoutes");
const resumeAnalysisRoutes = require("./routes/resumeAnalysisRoutes");
const speechToTextRoutes = require("./routes/speechToTextRoutes");
const interviewEvaluationRoutes = require("./routes/interviewEvaluationRoutes");
console.log("EVALUATION ROUTE IMPORT CHECK");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test API
app.get("/", (req, res) => {
    res.json({
        message: "CareerOS AI API is running 🚀"
    });
});

// Profile routes
app.use("/api/profiles", profileRoutes);

// Resume Analysis routes
app.use("/api/resume-analysis", resumeAnalysisRoutes);
app.use("/api/speech-to-text", speechToTextRoutes);
app.use("/api/interview-evaluation", interviewEvaluationRoutes);
// Server port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`CareerOS AI server running on port ${PORT}`);
});