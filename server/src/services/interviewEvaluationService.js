const { GoogleGenAI, Type } = require("@google/genai");

console.log("Gemini environment check:", {
    geminiKeyLoaded: Boolean(process.env.GEMINI_API_KEY),
    googleKeyLoaded: Boolean(process.env.GOOGLE_API_KEY),
});

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});
const evaluateInterviewAnswer = async ({
    question,
    answer,
}) => {
    if (!question || !question.trim()) {
        throw new Error("Interview question is required.");
    }

    if (!answer || !answer.trim()) {
        throw new Error("Interview answer is required.");
    }

    const prompt = `
You are an expert technical interviewer for a Computer Science interview.

Evaluate the candidate's answer based ONLY on the question and answer provided.

Interview Question:
${question}

Candidate Answer:
${answer}

Evaluate the answer using these criteria:

1. Relevance:
   Does the answer directly address the interview question?

2. Technical Knowledge:
   Does the answer demonstrate appropriate Computer Science knowledge?

3. Clarity:
   Is the answer understandable, organized, and easy to follow?

4. Completeness:
   Does the answer provide enough useful information and context?

5. Overall Quality:
   Consider the complete answer as an interview response.

Scoring:
- Give each score from 0 to 100.
- Be fair and constructive.
- Do not judge the candidate based on grammar alone.
- Do not invent information that is not present in the answer.
- The improved answer should be a realistic example of how the candidate could answer the same question better.
- Keep strengths and improvements concise and practical.
`;

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "application/json",

            responseSchema: {
                type: Type.OBJECT,

                properties: {
                    overall_score: {
                        type: Type.INTEGER,
                        description:
                            "Overall answer quality score from 0 to 100.",
                    },

                    relevance_score: {
                        type: Type.INTEGER,
                        description:
                            "How directly the answer addresses the question, from 0 to 100.",
                    },

                    technical_score: {
                        type: Type.INTEGER,
                        description:
                            "Technical knowledge demonstrated in the answer, from 0 to 100.",
                    },

                    clarity_score: {
                        type: Type.INTEGER,
                        description:
                            "Clarity and organization of the answer, from 0 to 100.",
                    },

                    completeness_score: {
                        type: Type.INTEGER,
                        description:
                            "Completeness and usefulness of the answer, from 0 to 100.",
                    },

                    strengths: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING,
                        },
                        description:
                            "Specific strengths of the candidate's answer.",
                    },

                    improvements: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING,
                        },
                        description:
                            "Specific areas where the candidate can improve.",
                    },

                    improved_answer: {
                        type: Type.STRING,
                        description:
                            "A stronger example answer to the same interview question.",
                    },
                },

                required: [
                    "overall_score",
                    "relevance_score",
                    "technical_score",
                    "clarity_score",
                    "completeness_score",
                    "strengths",
                    "improvements",
                    "improved_answer",
                ],
            },
        },
    });

    const evaluationText = response?.text?.trim();

    if (!evaluationText) {
        throw new Error(
            "Gemini returned an empty evaluation."
        );
    }

    let evaluation;

    try {
        evaluation = JSON.parse(evaluationText);
    } catch (error) {
        console.error(
            "Failed to parse Gemini evaluation:",
            evaluationText
        );

        throw new Error(
            "Gemini returned an invalid evaluation format."
        );
    }

    return evaluation;
};

module.exports = {
    evaluateInterviewAnswer,
};