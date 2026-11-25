import { useEffect, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Circle,
    Target,
    XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../config/supabase";
import "./Practice.css";

function Practice() {
    const navigate = useNavigate();
    const { topicId } = useParams();

    const [topic, setTopic] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    // ==================================================
    // PRACTICE SESSION STORAGE KEY
    // ==================================================

    const getPracticeSessionKey = () => {
        return `careeros_practice_session_${topicId}`;
    };

    // ==================================================
    // SHUFFLE ARRAY
    // ==================================================

    const shuffleArray = (array) => {
        const shuffled = [...array];

        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [shuffled[i], shuffled[j]] = [
                shuffled[j],
                shuffled[i],
            ];
        }

        return shuffled;
    };

    // ==================================================
    // NORMALIZE DIFFICULTY
    // ==================================================

    const normalizeDifficulty = (difficulty) => {
        if (!difficulty) {
            return "";
        }

        return String(difficulty)
            .trim()
            .toLowerCase();
    };

    // ==================================================
    // CREATE PRACTICE SET
    //
    // Preferred mix:
    // Beginner     = 4
    // Intermediate = 4
    // Advanced     = 2
    //
    // IMPORTANT:
    // If one difficulty level does not exist, the
    // missing questions are redistributed automatically.
    //
    // Example:
    //
    // 40 Beginner
    // 0 Intermediate
    // 0 Advanced
    //
    // becomes:
    //
    // 10 Beginner
    //
    // Example:
    //
    // 29 Beginner
    // 11 Intermediate
    // 0 Advanced
    //
    // becomes:
    //
    // 5 Beginner
    // 5 Intermediate
    //
    // Total is always 10 when at least 10 questions
    // exist.
    // ==================================================

    const createPracticeSet = (allQuestions) => {
        const availableQuestions = shuffleArray(
            allQuestions
        );

        if (availableQuestions.length < 10) {
            throw new Error(
                "At least 10 practice questions are required for this topic."
            );
        }

        const beginnerQuestions =
            availableQuestions.filter(
                (question) =>
                    normalizeDifficulty(
                        question.difficulty
                    ) === "beginner"
            );

        const intermediateQuestions =
            availableQuestions.filter(
                (question) =>
                    normalizeDifficulty(
                        question.difficulty
                    ) === "intermediate"
            );

        const advancedQuestions =
            availableQuestions.filter(
                (question) =>
                    normalizeDifficulty(
                        question.difficulty
                    ) === "advanced"
            );

        // ------------------------------------------
        // GROUP AVAILABLE DIFFICULTIES
        // ------------------------------------------

        const groups = [
            {
                name: "Beginner",
                questions: beginnerQuestions,
                target: 4,
            },
            {
                name: "Intermediate",
                questions: intermediateQuestions,
                target: 4,
            },
            {
                name: "Advanced",
                questions: advancedQuestions,
                target: 2,
            },
        ];

        // ------------------------------------------
        // FIRST PASS
        //
        // Take the preferred number from each
        // available difficulty.
        // ------------------------------------------

        const selected = [];

        groups.forEach((group) => {
            const amount = Math.min(
                group.target,
                group.questions.length
            );

            selected.push(
                ...shuffleArray(
                    group.questions
                ).slice(0, amount)
            );
        });

        // ------------------------------------------
        // FILL REMAINING SLOTS
        //
        // If a difficulty level was missing or did
        // not have enough questions, fill the remaining
        // slots from all unused questions.
        // ------------------------------------------

        const selectedIds = new Set(
            selected.map(
                (question) => question.id
            )
        );

        let remainingQuestions =
            shuffleArray(
                availableQuestions.filter(
                    (question) =>
                        !selectedIds.has(
                            question.id
                        )
                )
            );

        while (
            selected.length < 10 &&
            remainingQuestions.length > 0
        ) {
            selected.push(
                remainingQuestions.shift()
            );
        }

        // ------------------------------------------
        // FINAL SAFETY CHECK
        // ------------------------------------------

        if (selected.length < 10) {
            throw new Error(
                "Unable to prepare 10 practice questions for this topic."
            );
        }

        // ------------------------------------------
        // FINAL MIX
        // ------------------------------------------

        return shuffleArray(
            selected.slice(0, 10)
        );
    };

    // ==================================================
    // SAVE CURRENT PRACTICE QUESTION IDS
    // ==================================================

    const savePracticeSession = (
        practiceQuestions
    ) => {
        const questionIds =
            practiceQuestions.map(
                (question) => question.id
            );

        sessionStorage.setItem(
            getPracticeSessionKey(),
            JSON.stringify(questionIds)
        );

        console.log(
            "Practice session saved:",
            questionIds
        );
    };

    // ==================================================
    // LOAD PRACTICE
    // ==================================================

    useEffect(() => {
        fetchPractice();
    }, [topicId]);

    const fetchPractice = async () => {
        try {
            setLoading(true);
            setError("");

            // ------------------------------------------
            // CURRENT USER
            // ------------------------------------------

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw userError;
            }

            if (!user) {
                throw new Error(
                    "Please login to access practice."
                );
            }

            // ------------------------------------------
            // GET TOPIC
            // ------------------------------------------

            const {
                data: topicData,
                error: topicError,
            } = await supabase
                .from("learning_topics")
                .select("*")
                .eq("id", Number(topicId))
                .single();

            if (topicError) {
                throw topicError;
            }

            // ------------------------------------------
            // GET ALL QUESTIONS FOR TOPIC
            // ------------------------------------------

            const {
                data: questionData,
                error: questionError,
            } = await supabase
                .from("questions")
                .select("*")
                .eq(
                    "learning_topic_id",
                    Number(topicId)
                );

            if (questionError) {
                throw questionError;
            }

            if (
                !questionData ||
                questionData.length === 0
            ) {
                throw new Error(
                    "No practice questions are available for this topic yet."
                );
            }

            // ------------------------------------------
            // CREATE RANDOM 10 QUESTION SET
            // ------------------------------------------

            const practiceQuestions =
                createPracticeSet(
                    questionData
                );

            if (
                practiceQuestions.length !== 10
            ) {
                throw new Error(
                    "Practice could not prepare exactly 10 questions."
                );
            }

            // ------------------------------------------
            // SAVE PRACTICE SESSION
            //
            // Assessment reads these IDs and avoids
            // selecting the same questions.
            // ------------------------------------------

            savePracticeSession(
                practiceQuestions
            );

            // ------------------------------------------
            // SAVE STATE
            // ------------------------------------------

            setTopic(topicData);
            setQuestions(
                practiceQuestions
            );

            setAnswers({});
            setCurrentQuestion(0);
            setSubmitted(false);
            setScore(0);
        } catch (err) {
            console.error(
                "Practice error:",
                err
            );

            setError(
                err.message ||
                    "Unable to load practice questions."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==================================================
    // SELECT ANSWER
    // ==================================================

    const handleAnswer = (answer) => {
        if (submitted || saving) {
            return;
        }

        const question =
            questions[currentQuestion];

        if (!question) {
            return;
        }

        setAnswers((previous) => ({
            ...previous,
            [question.id]: answer,
        }));
    };

    // ==================================================
    // NEXT QUESTION
    // ==================================================

    const handleNext = () => {
        if (
            currentQuestion <
            questions.length - 1
        ) {
            setCurrentQuestion(
                currentQuestion + 1
            );
        }
    };

    // ==================================================
    // PREVIOUS QUESTION
    // ==================================================

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(
                currentQuestion - 1
            );
        }
    };

    // ==================================================
    // SUBMIT PRACTICE
    // ==================================================

    const handleSubmit = async () => {
        if (saving) {
            return;
        }

        // ------------------------------------------
        // CHECK ALL QUESTIONS ANSWERED
        // ------------------------------------------

        const answeredCount =
            questions.filter((question) => {
                const answer =
                    answers[question.id];

                return (
                    answer !== undefined &&
                    answer !== null &&
                    answer !== ""
                );
            }).length;

        if (
            answeredCount !==
            questions.length
        ) {
            setError(
                `Please answer all ${questions.length} questions before submitting practice.`
            );

            return;
        }

        try {
            setSaving(true);
            setError("");

            // ------------------------------------------
            // CURRENT USER
            // ------------------------------------------

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw userError;
            }

            if (!user) {
                throw new Error(
                    "You must be logged in to submit practice."
                );
            }

            // ------------------------------------------
            // CALCULATE SCORE
            // ------------------------------------------

            let calculatedScore = 0;

            questions.forEach((question) => {
                if (
                    answers[question.id] ===
                    question.correct_answer
                ) {
                    calculatedScore +=
                        question.points || 1;
                }
            });

            const totalPoints =
                questions.reduce(
                    (total, question) =>
                        total +
                        (question.points || 1),
                    0
                );

            const percentage = Math.round(
                (calculatedScore /
                    totalPoints) *
                    100
            );

            // ------------------------------------------
            // GET EXISTING PROGRESS
            // ------------------------------------------

            const {
                data: existingProgress,
                error: progressFetchError,
            } = await supabase
                .from("user_progress")
                .select("*")
                .eq(
                    "user_id",
                    user.id
                )
                .eq(
                    "learning_topic_id",
                    Number(topicId)
                )
                .maybeSingle();

            if (progressFetchError) {
                throw progressFetchError;
            }

            const now =
                new Date().toISOString();

            // ------------------------------------------
            // UPDATE EXISTING PROGRESS
            // ------------------------------------------

            if (existingProgress) {
                const newProgressPercentage =
                    existingProgress.status ===
                    "completed"
                        ? 100
                        : Math.max(
                              existingProgress.progress_percentage ||
                                  0,
                              60
                          );

                const {
                    data: updatedProgress,
                    error: updateError,
                } = await supabase
                    .from("user_progress")
                    .update({
                        practice_score:
                            percentage,

                        progress_percentage:
                            newProgressPercentage,

                        last_activity_at:
                            now,
                    })
                    .eq(
                        "id",
                        existingProgress.id
                    )
                    .select("*")
                    .single();

                if (updateError) {
                    throw updateError;
                }

                console.log(
                    "Practice progress updated:",
                    updatedProgress
                );
            }

            // ------------------------------------------
            // CREATE NEW PROGRESS
            // ------------------------------------------

            else {
                const {
                    data: insertedProgress,
                    error: insertError,
                } = await supabase
                    .from("user_progress")
                    .insert({
                        user_id: user.id,

                        learning_topic_id:
                            Number(topicId),

                        status:
                            "in_progress",

                        progress_percentage:
                            60,

                        practice_score:
                            percentage,

                        assessment_score:
                            null,

                        attempts: 0,

                        started_at: now,

                        completed_at: null,

                        last_activity_at:
                            now,
                    })
                    .select("*")
                    .single();

                if (insertError) {
                    throw insertError;
                }

                console.log(
                    "Practice progress created:",
                    insertedProgress
                );
            }

            // ------------------------------------------
            // SHOW RESULT
            // ------------------------------------------

            setScore(
                calculatedScore
            );

            setSubmitted(true);
        } catch (err) {
            console.error(
                "Practice submission error:",
                err
            );

            setError(
                err.message ||
                    "Unable to save your practice result."
            );
        } finally {
            setSaving(false);
        }
    };

    // ==================================================
    // OPTION STYLE
    // ==================================================

    const getOptionClass = (option) => {
        const question =
            questions[currentQuestion];

        if (!question) {
            return "practice-option";
        }

        if (!submitted) {
            return answers[question.id] ===
                option
                ? "practice-option selected"
                : "practice-option";
        }

        if (
            option ===
            question.correct_answer
        ) {
            return "practice-option correct";
        }

        if (
            answers[question.id] ===
                option &&
            option !==
                question.correct_answer
        ) {
            return "practice-option incorrect";
        }

        return "practice-option";
    };

    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <div className="practice-page">
                <div className="practice-loading">
                    <div className="practice-spinner"></div>

                    <p>
                        Preparing your practice session...
                    </p>
                </div>
            </div>
        );
    }

    // ==================================================
    // ERROR
    // ==================================================

    if (error && !submitted) {
        return (
            <div className="practice-page">
                <div className="practice-error">
                    <XCircle size={30} />

                    <h2>
                        Unable to load practice
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        onClick={() =>
                            navigate(
                                `/learning/topic/${topicId}`
                            )
                        }
                    >
                        <ArrowLeft size={17} />
                        Back to Topic
                    </button>
                </div>
            </div>
        );
    }

    // ==================================================
    // RESULT
    // ==================================================

    if (submitted) {
        const totalPoints =
            questions.reduce(
                (total, question) =>
                    total +
                    (question.points || 1),
                0
            );

        const percentage = Math.round(
            (score / totalPoints) * 100
        );

        const answeredCount =
            Object.keys(answers).length;

        return (
            <div className="practice-page">
                <div className="practice-result">

                    <div className="practice-result-icon">
                        {percentage >= 60 ? (
                            <CheckCircle2
                                size={42}
                            />
                        ) : (
                            <Target
                                size={42}
                            />
                        )}
                    </div>

                    <p className="practice-eyebrow">
                        PRACTICE COMPLETE
                    </p>

                    <h1>
                        {percentage >= 60
                            ? "Great work!"
                            : "Let's strengthen this topic"}
                    </h1>

                    <p className="practice-result-description">
                        You completed the practice
                        session for{" "}
                        <strong>
                            {topic?.title}
                        </strong>
                        .
                    </p>

                    <div className="practice-score-card">

                        <div>
                            <span>
                                Score
                            </span>

                            <strong>
                                {score}/
                                {totalPoints}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Accuracy
                            </span>

                            <strong>
                                {percentage}%
                            </strong>
                        </div>

                        <div>
                            <span>
                                Answered
                            </span>

                            <strong>
                                {answeredCount}/
                                {questions.length}
                            </strong>
                        </div>

                    </div>

                    <div className="practice-result-message">

                        {percentage >= 80 ? (
                            <>
                                <CheckCircle2
                                    size={19}
                                />

                                <p>
                                    Excellent
                                    understanding.
                                    You're ready
                                    to move toward
                                    the assessment.
                                </p>
                            </>
                        ) : percentage >= 60 ? (
                            <>
                                <CheckCircle2
                                    size={19}
                                />

                                <p>
                                    Good progress.
                                    Review the
                                    questions you
                                    missed before
                                    taking the
                                    assessment.
                                </p>
                            </>
                        ) : (
                            <>
                                <Target
                                    size={19}
                                />

                                <p>
                                    Review the
                                    learning
                                    resources and
                                    practice again
                                    before
                                    attempting the
                                    assessment.
                                </p>
                            </>
                        )}

                    </div>

                    <div className="practice-result-actions">

                        <button
                            className="practice-secondary-button"
                            onClick={() =>
                                navigate(
                                    `/learning/topic/${topicId}`
                                )
                            }
                        >
                            <ArrowLeft size={17} />
                            Back to Topic
                        </button>

                        <button
                            className="practice-primary-button"
                            onClick={() => {
                                setLoading(true);
                                fetchPractice();
                            }}
                        >
                            Practice Again
                        </button>

                    </div>

                </div>
            </div>
        );
    }

    // ==================================================
    // CURRENT QUESTION
    // ==================================================

    const question =
        questions[currentQuestion];

    if (!question) {
        return (
            <div className="practice-page">
                <div className="practice-error">
                    <XCircle size={30} />

                    <h2>
                        Practice question unavailable
                    </h2>

                    <p>
                        We could not find the
                        current practice question.
                    </p>

                    <button
                        onClick={() =>
                            navigate(
                                `/learning/topic/${topicId}`
                            )
                        }
                    >
                        <ArrowLeft size={17} />
                        Back to Topic
                    </button>
                </div>
            </div>
        );
    }

    const selectedAnswer =
        answers[question.id];

    const progress =
        ((currentQuestion + 1) /
            questions.length) *
        100;

    const answeredCount =
        questions.filter(
            (item) =>
                answers[item.id] !==
                    undefined &&
                answers[item.id] !== null &&
                answers[item.id] !== ""
        ).length;

    // ==================================================
    // PRACTICE UI
    // ==================================================

    return (
        <div className="practice-page">

            {/* HEADER */}

            <header className="practice-header">

                <button
                    className="practice-back-button"
                    onClick={() =>
                        navigate(
                            `/learning/topic/${topicId}`
                        )
                    }
                >
                    <ArrowLeft size={18} />
                    Back to Topic
                </button>

                <div className="practice-header-main">

                    <div>

                        <p className="practice-eyebrow">
                            PRACTICE SESSION
                        </p>

                        <h1>
                            {topic?.title}
                        </h1>

                        <p>
                            Test what you've
                            learned before moving
                            to the assessment.
                        </p>

                    </div>

                    <div className="practice-question-count">

                        <span>
                            QUESTION
                        </span>

                        <strong>
                            {currentQuestion + 1}
                        </strong>

                        <span>
                            / {questions.length}
                        </span>

                    </div>

                </div>

                <div className="practice-progress-track">

                    <div
                        className="practice-progress-fill"
                        style={{
                            width: `${progress}%`,
                        }}
                    ></div>

                </div>

            </header>

            {/* MAIN */}

            <main className="practice-main">

                {error && (
                    <div
                        className="practice-error"
                        style={{
                            marginBottom:
                                "20px",
                        }}
                    >
                        <XCircle size={22} />

                        <p>
                            {error}
                        </p>
                    </div>
                )}

                <div className="practice-question-card">

                    <div className="practice-question-top">

                        <span className="practice-question-label">
                            QUESTION{" "}
                            {currentQuestion + 1}
                        </span>

                        <span className="practice-difficulty">
                            {question.difficulty}
                        </span>

                    </div>

                    <h2>
                        {question.question_text}
                    </h2>

                    <div className="practice-options">

                        {[
                            [
                                "A",
                                question.option_a,
                            ],
                            [
                                "B",
                                question.option_b,
                            ],
                            [
                                "C",
                                question.option_c,
                            ],
                            [
                                "D",
                                question.option_d,
                            ],
                        ].map(
                            ([letter, text]) => (
                                <button
                                    key={letter}
                                    className={getOptionClass(
                                        letter
                                    )}
                                    onClick={() =>
                                        handleAnswer(
                                            letter
                                        )
                                    }
                                    disabled={
                                        saving
                                    }
                                >

                                    <span className="practice-option-letter">

                                        {selectedAnswer ===
                                        letter ? (
                                            <CheckCircle2
                                                size={
                                                    18
                                                }
                                            />
                                        ) : (
                                            <Circle
                                                size={
                                                    18
                                                }
                                            />
                                        )}

                                    </span>

                                    <span className="practice-option-text">

                                        <strong>
                                            {letter}
                                        </strong>

                                        {text}

                                    </span>

                                </button>
                            )
                        )}

                    </div>

                </div>

                {/* NAVIGATION */}

                <div className="practice-navigation">

                    <button
                        className="practice-secondary-button"
                        onClick={
                            handlePrevious
                        }
                        disabled={
                            currentQuestion ===
                                0 ||
                            saving
                        }
                    >
                        <ChevronLeft size={17} />
                        Previous
                    </button>

                    <div className="practice-dots">

                        {questions.map(
                            (item, index) => (
                                <button
                                    key={item.id}
                                    className={
                                        index ===
                                        currentQuestion
                                            ? "active"
                                            : answers[
                                                item.id
                                            ]
                                                ? "answered"
                                                : ""
                                    }
                                    onClick={() =>
                                        setCurrentQuestion(
                                            index
                                        )
                                    }
                                    disabled={
                                        saving
                                    }
                                />
                            )
                        )}

                    </div>

                    {currentQuestion ===
                    questions.length - 1 ? (
                        <button
                            className="practice-primary-button"
                            onClick={
                                handleSubmit
                            }
                            disabled={
                                answeredCount !==
                                    questions.length ||
                                saving
                            }
                        >
                            {saving
                                ? "Saving Result..."
                                : "Submit Practice"}

                            {!saving && (
                                <CheckCircle2
                                    size={17}
                                />
                            )}
                        </button>
                    ) : (
                        <button
                            className="practice-primary-button"
                            onClick={
                                handleNext
                            }
                            disabled={saving}
                        >
                            Next

                            <ChevronRight
                                size={17}
                            />
                        </button>
                    )}

                </div>

            </main>

        </div>
    );
}

export default Practice;