const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Wait for a specified amount of time.
 */
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Check whether an error is a temporary Gemini availability error.
 */
const isTemporaryGeminiError = (error) => {
    const message = error?.message || "";

    return (
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("high demand") ||
        message.includes("currently experiencing")
    );
};

/**
 * Generate Gemini response with retry + model fallback.
 */
const generateWithFallback = async (prompt) => {
    // Stable Gemini Flash models.
    const models = [
        "gemini-3.8-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash",
    ];

    let lastError = null;

    for (const model of models) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                console.log(
                    `Gemini request: ${model} (attempt ${attempt}/2)`
                );

                const response = await ai.models.generateContent({
                    model,
                    contents: prompt,
                });

                if (!response) {
                    throw new Error(
                        "Gemini returned an empty response."
                    );
                }

                return response;
            } catch (error) {
                lastError = error;

                console.error(
                    `Gemini ${model} attempt ${attempt} failed:`,
                    error?.message || error
                );

                // Only retry/fallback for temporary availability errors.
                if (!isTemporaryGeminiError(error)) {
                    throw error;
                }

                // Exponential backoff:
                // attempt 1 -> 3 seconds
                // attempt 2 -> 6 seconds
                if (attempt < 2) {
                    const delay = 3000 * attempt;

                    console.log(
                        `Gemini temporarily unavailable. Retrying in ${
                            delay / 1000
                        } seconds...`
                    );

                    await sleep(delay);
                }
            }
        }

        console.log(
            `Gemini model ${model} is temporarily unavailable. Trying fallback model...`
        );
    }

    throw lastError || new Error(
        "All Gemini models are currently unavailable."
    );
};

/**
 * Analyze a resume using Gemini AI.
 */
const analyzeResumeWithGemini = async (resumeData) => {
    if (!resumeData) {
        throw new Error(
            "Resume data is required for AI analysis."
        );
    }

    const prompt = `
You are an AI resume analysis assistant for CareerOS AI.

Analyze the following student's resume and return a structured assessment.

RESUME DATA:

Professional Summary:
${resumeData.resume?.summary || "Not provided"}

Phone:
${resumeData.resume?.phone || "Not provided"}

Location:
${resumeData.resume?.location || "Not provided"}

LinkedIn:
${resumeData.resume?.linkedin || "Not provided"}

GitHub:
${resumeData.resume?.github || "Not provided"}

Skills:
${JSON.stringify(resumeData.skills || [])}

Education:
${JSON.stringify(resumeData.education || [])}

Projects:
${JSON.stringify(resumeData.projects || [])}

Experience:
${JSON.stringify(resumeData.experience || [])}

Certifications:
${JSON.stringify(resumeData.certifications || [])}

Achievements:
${JSON.stringify(resumeData.achievements || [])}

Evaluate the resume based on:

1. Overall ATS readiness
2. Resume strengths
3. Skill gaps
4. Specific improvement suggestions
5. Important keywords that could improve the resume

Return ONLY valid JSON in this exact structure:

{
    "ats_score": 0,
    "strengths": [],
    "skill_gaps": [],
    "suggestions": [],
    "keyword_analysis": []
}

Rules:

- ats_score must be an integer from 0 to 100.
- strengths must be an array of concise strings.
- skill_gaps must be an array of concise strings.
- suggestions must be an array of actionable strings.
- keyword_analysis must be an array of relevant keywords or short explanations.
- Do not include markdown.
- Do not include code fences.
- Do not include any text outside the JSON.
`;

    const response = await generateWithFallback(prompt);

    const text = response.text?.trim();

    if (!text) {
        throw new Error(
            "Gemini returned an empty response."
        );
    }

    let analysis;

    try {
        analysis = JSON.parse(text);
    } catch (error) {
        console.error(
            "Gemini JSON parsing error:",
            error
        );

        console.error(
            "Gemini raw response:",
            text
        );

        throw new Error(
            "Gemini returned an invalid analysis response."
        );
    }

    return analysis;
};

module.exports = {
    analyzeResumeWithGemini,
};