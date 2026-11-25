
const Groq = require("groq-sdk");

if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from the server .env file.");
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const transcribeAudio = async (audioBuffer, mimeType, originalName) => {
    if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error("Audio file is empty.");
    }

    const normalizedMimeType = (mimeType || "")
        .split(";")[0]
        .trim()
        .toLowerCase();

    const formatByMimeType = {
        "audio/webm": { extension: "webm", type: "audio/webm" },
        "video/webm": { extension: "webm", type: "audio/webm" },
        "audio/ogg": { extension: "ogg", type: "audio/ogg" },
        "audio/wav": { extension: "wav", type: "audio/wav" },
        "audio/x-wav": { extension: "wav", type: "audio/wav" },
        "audio/mp4": { extension: "mp4", type: "audio/mp4" },
        "audio/mpeg": { extension: "mp3", type: "audio/mpeg" },
        "audio/mp3": { extension: "mp3", type: "audio/mpeg" },
    };

    const format = formatByMimeType[normalizedMimeType];

    if (!format) {
        throw new Error(
            `Unsupported audio MIME type: ${mimeType || "missing"}`
        );
    }

    console.log("Sending audio to Groq:", {
        filename: originalName || `interview-answer.${format.extension}`,
        size: audioBuffer.length,
        mimeType,
        normalizedMimeType,
        model: "whisper-large-v3-turbo",
    });

    try {
        const file = await Groq.toFile(
            audioBuffer,
            `interview-answer.${format.extension}`,
            { type: format.type }
        );

        const transcription = await groq.audio.transcriptions.create({
            file,
            model: "whisper-large-v3-turbo",
            response_format: "json",
            temperature: 0,
        });

        const transcript =
            typeof transcription.text === "string"
                ? transcription.text.trim()
                : "";

        console.log("Groq transcription result:", {
            hasTranscript: Boolean(transcript),
            transcriptLength: transcript.length,
        });

        if (!transcript) {
            throw new Error(
                "Groq returned an empty transcript. Please record your answer again."
            );
        }

        return transcript;
    } catch (error) {
        console.error("Groq transcription failed:", {
            message: error?.message,
            status: error?.status,
            code: error?.code,
        });

        throw new Error(
            error?.status === 401
                ? "Groq authentication failed. Check GROQ_API_KEY in server/.env."
                : error?.status === 429
                    ? "Groq rate limit reached. Please try again shortly."
                    : error?.message || "Speech-to-text failed."
        );
    }
};

module.exports = {
    transcribeAudio,
};
