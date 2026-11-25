import { useEffect, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Circle,
    Clock3,
    Target,
    XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../config/supabase";
import "./Assessment.css";

function Assessment() {
    const navigate = useNavigate();
    const { topicId } = useParams();

    const [topic, setTopic] = useState(null);
    const [assessment, setAssessment] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);

    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [loadError, setLoadError] = useState("");
    const [submitError, setSubmitError] = useState("");

    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    // ==================================================
    // PRACTICE SESSION KEY
    // ==================================================

    const getPracticeSessionKey = () => {
        return `careeros_practice_session_${topicId}`;
    };

    // ==================================================
    // SHUFFLE
    // ==================================================

    const shuffleArray = (array) => {
        const shuffled = [...array];

        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(
                Math.random() * (i + 1)
            );

            [shuffled[i], shuffled[j]] = [
                shuffled[j],
                shuffled[i],
            ];
        }

        return shuffled;
    };

    // ==================================================
    // GET LATEST PRACTICE QUESTION IDS
    // ==================================================

    const getPracticeQuestionIds = () => {
        try {
            const storedQuestions =
                sessionStorage.getItem(
                    getPracticeSessionKey()
                );

            if (!storedQuestions) {
                return [];
            }

            const parsedQuestions =
                JSON.parse(storedQuestions);

            if (!Array.isArray(parsedQuestions)) {
                return [];
            }

            return parsedQuestions;
        } catch (error) {
            console.error(
                "Unable to read practice session:",
                error
            );

            return [];
        }
    };

    // ==================================================
    // GET QUESTIONS BY DIFFICULTY
    // ==================================================

    const getDifficultyPool = (
        questionPool,
        difficulty
    ) => {
        return questionPool.filter(
            (question) =>
                String(
                    question.difficulty || ""
                ).toLowerCase() ===
                difficulty.toLowerCase()
        );
    };

    // ==================================================
    // SELECT QUESTIONS FROM A POOL
    // ==================================================

    const selectFromPools = (
        unusedPool,
        fallbackPool,
        count
    ) => {
        const selected = shuffleArray(
            unusedPool
        ).slice(0, count);

        if (selected.length >= count) {
            return selected;
        }

        const selectedIds = new Set(
            selected.map((question) =>
                String(question.id)
            )
        );

        const remainingFallback =
            shuffleArray(
                fallbackPool.filter(
                    (question) =>
                        !selectedIds.has(
                            String(question.id)
                        )
                )
            );

        return [
            ...selected,
            ...remainingFallback.slice(
                0,
                count - selected.length
            ),
        ];
    };

    // ==================================================
    // CREATE ADAPTIVE ASSESSMENT
    //
    // Preferred Java-style mix:
    //
    // 4 Beginner
    // 4 Intermediate
    // 2 Advanced
    //
    // BUT:
    // This is a target, not a requirement.
    //
    // If a topic does not contain a difficulty level,
    // the missing questions are redistributed.
    //
    // Examples:
    //
    // 40 Beginner
    // 0 Intermediate
    // 0 Advanced
    //
    // => 10 Beginner
    //
    // 29 Beginner
    // 11 Intermediate
    // 0 Advanced
    //
    // => 6 Beginner
    //    4 Intermediate
    //
    // 27 Beginner
    // 11 Intermediate
    // 2 Advanced
    //
    // => 4 Beginner
    //    4 Intermediate
    //    2 Advanced
    // ==================================================

    const createMixedAssessment = (
        allQuestions,
        previouslyUsedIds
    ) => {
        const practiceQuestionIds =
            getPracticeQuestionIds();

        const practiceIdSet = new Set(
            practiceQuestionIds.map((id) =>
                String(id)
            )
        );

        const usedAssessmentIdSet = new Set(
            previouslyUsedIds.map((id) =>
                String(id)
            )
        );

        // ==================================================
        // COMPLETELY UNUSED QUESTIONS
        // ==================================================

        const unusedQuestions =
            allQuestions.filter((question) => {
                const id = String(question.id);

                return (
                    !practiceIdSet.has(id) &&
                    !usedAssessmentIdSet.has(id)
                );
            });

        // ==================================================
        // FALLBACK QUESTIONS
        //
        // Previous assessment questions can be reused
        // if the completely unused pool is insufficient.
        // ==================================================

        const fallbackQuestions =
            allQuestions.filter((question) => {
                return !practiceIdSet.has(
                    String(question.id)
                );
            });

        // ==================================================
        // UNUSED DIFFICULTY POOLS
        // ==================================================

        const unusedBeginner =
            getDifficultyPool(
                unusedQuestions,
                "Beginner"
            );

        const unusedIntermediate =
            getDifficultyPool(
                unusedQuestions,
                "Intermediate"
            );

        const unusedAdvanced =
            getDifficultyPool(
                unusedQuestions,
                "Advanced"
            );

        // ==================================================
        // FALLBACK DIFFICULTY POOLS
        // ==================================================

        const fallbackBeginner =
            getDifficultyPool(
                fallbackQuestions,
                "Beginner"
            );

        const fallbackIntermediate =
            getDifficultyPool(
                fallbackQuestions,
                "Intermediate"
            );

        const fallbackAdvanced =
            getDifficultyPool(
                fallbackQuestions,
                "Advanced"
            );

        // ==================================================
        // INITIAL TARGET SELECTION
        // ==================================================

        const selectedBeginner =
            selectFromPools(
                unusedBeginner,
                fallbackBeginner,
                4
            );

        const selectedIntermediate =
            selectFromPools(
                unusedIntermediate,
                fallbackIntermediate,
                4
            );

        const selectedAdvanced =
            selectFromPools(
                unusedAdvanced,
                fallbackAdvanced,
                2
            );

        let selectedQuestions = [
            ...selectedBeginner,
            ...selectedIntermediate,
            ...selectedAdvanced,
        ];

        // ==================================================
        // REMOVE DUPLICATES
        // ==================================================

        const uniqueQuestions = [];
        const selectedIdSet = new Set();

        selectedQuestions.forEach((question) => {
            const id = String(question.id);

            if (!selectedIdSet.has(id)) {
                selectedIdSet.add(id);
                uniqueQuestions.push(question);
            }
        });

        selectedQuestions = uniqueQuestions;

        // ==================================================
        // FILL MISSING QUESTIONS
        //
        // If one difficulty does not exist, use remaining
        // questions from the topic.
        // ==================================================

        if (selectedQuestions.length < 10) {
            const remainingQuestions =
                shuffleArray(
                    allQuestions.filter(
                        (question) => {
                            const id =
                                String(
                                    question.id
                                );

                            return (
                                !selectedIdSet.has(
                                    id
                                ) &&
                                !practiceIdSet.has(
                                    id
                                )
                            );
                        }
                    )
                );

            remainingQuestions.forEach(
                (question) => {
                    if (
                        selectedQuestions.length <
                        10
                    ) {
                        const id =
                            String(
                                question.id
                            );

                        if (
                            !selectedIdSet.has(
                                id
                            )
                        ) {
                            selectedIdSet.add(
                                id
                            );

                            selectedQuestions.push(
                                question
                            );
                        }
                    }
                }
            );
        }

        // ==================================================
        // FINAL FALLBACK
        //
        // If previous exclusions leave fewer than 10
        // completely available questions, allow reuse
        // of previous assessment questions.
        // ==================================================

        if (selectedQuestions.length < 10) {
            const finalFallback =
                shuffleArray(
                    allQuestions.filter(
                        (question) => {
                            const id =
                                String(
                                    question.id
                                );

                            return (
                                !selectedIdSet.has(
                                    id
                                ) &&
                                !practiceIdSet.has(
                                    id
                                )
                            );
                        }
                    )
                );

            finalFallback.forEach(
                (question) => {
                    if (
                        selectedQuestions.length <
                        10
                    ) {
                        const id =
                            String(
                                question.id
                            );

                        if (
                            !selectedIdSet.has(
                                id
                            )
                        ) {
                            selectedIdSet.add(
                                id
                            );

                            selectedQuestions.push(
                                question
                            );
                        }
                    }
                }
            );
        }

        // ==================================================
        // LAST RESORT
        //
        // If the topic itself has at least 10 questions,
        // we can complete the assessment by using any
        // remaining topic questions.
        // ==================================================

        if (selectedQuestions.length < 10) {
            const lastResortQuestions =
                shuffleArray(
                    allQuestions.filter(
                        (question) => {
                            const id =
                                String(
                                    question.id
                                );

                            return !selectedIdSet.has(
                                id
                            );
                        }
                    )
                );

            lastResortQuestions.forEach(
                (question) => {
                    if (
                        selectedQuestions.length <
                        10
                    ) {
                        const id =
                            String(
                                question.id
                            );

                        if (
                            !selectedIdSet.has(
                                id
                            )
                        ) {
                            selectedIdSet.add(
                                id
                            );

                            selectedQuestions.push(
                                question
                            );
                        }
                    }
                }
            );
        }

        // ==================================================
        // FINAL VALIDATION
        // ==================================================

        if (selectedQuestions.length < 10) {
            throw new Error(
                "This topic does not have enough questions to create a 10-question assessment."
            );
        }

        // ==================================================
        // FINAL RANDOM MIX
        // ==================================================

        const finalQuestions =
            shuffleArray(
                selectedQuestions.slice(
                    0,
                    10
                )
            );

        console.log(
            "Assessment difficulty mix:",
            finalQuestions.reduce(
                (counts, question) => {
                    const difficulty =
                        question.difficulty ||
                        "Unknown";

                    counts[difficulty] =
                        (counts[difficulty] ||
                            0) + 1;

                    return counts;
                },
                {}
            )
        );

        console.log(
            "Assessment question IDs:",
            finalQuestions.map(
                (question) => question.id
            )
        );

        return finalQuestions;
    };

    // ==================================================
    // LOAD SAVED ANSWERS
    // ==================================================

    const loadSavedAnswers = async (
        user,
        existingAttempt
    ) => {
        const {
            data: savedAnswers,
            error: savedAnswersError,
        } = await supabase
            .from("user_answers")
            .select(
                "question_id, selected_answer"
            )
            .eq(
                "user_id",
                user.id
            )
            .eq(
                "assessment_attempt_id",
                existingAttempt.id
            );

        if (savedAnswersError) {
            throw savedAnswersError;
        }

        const restoredAnswers = {};

        (savedAnswers || []).forEach(
            (answer) => {
                restoredAnswers[
                    answer.question_id
                ] =
                    answer.selected_answer;
            }
        );

        setAnswers(restoredAnswers);
    };

    // ==================================================
    // LOAD EXISTING UNFINISHED ATTEMPT
    // ==================================================

    const loadExistingAttempt = async (
        user
    ) => {
        const {
            data: existingAttempts,
            error: attemptsError,
        } = await supabase
            .from("assessment_attempts")
            .select("*")
            .eq(
                "user_id",
                user.id
            )
            .eq(
                "learning_topic_id",
                Number(topicId)
            )
            .is(
                "completed_at",
                null
            )
            .order(
                "id",
                {
                    ascending: false,
                }
            )
            .limit(1);

        if (attemptsError) {
            throw attemptsError;
        }

        if (
            !existingAttempts ||
            existingAttempts.length === 0
        ) {
            return null;
        }

        const existingAttempt =
            existingAttempts[0];

        const {
            data: attemptQuestions,
            error: attemptQuestionsError,
        } = await supabase
            .from(
                "assessment_attempt_questions"
            )
            .select(
                "question_id, question_order"
            )
            .eq(
                "attempt_id",
                existingAttempt.id
            )
            .order(
                "question_order",
                {
                    ascending: true,
                }
            );

        if (attemptQuestionsError) {
            throw attemptQuestionsError;
        }

        if (
            !attemptQuestions ||
            attemptQuestions.length !== 10
        ) {
            return null;
        }

        const questionIds =
            attemptQuestions.map(
                (item) =>
                    item.question_id
            );

        const {
            data: savedQuestions,
            error: savedQuestionsError,
        } = await supabase
            .from("questions")
            .select("*")
            .in(
                "id",
                questionIds
            );

        if (savedQuestionsError) {
            throw savedQuestionsError;
        }

        const questionMap = new Map();

        (savedQuestions || []).forEach(
            (question) => {
                questionMap.set(
                    String(question.id),
                    question
                );
            }
        );

        const orderedQuestions =
            questionIds
                .map((id) =>
                    questionMap.get(
                        String(id)
                    )
                )
                .filter(Boolean);

        if (
            orderedQuestions.length !== 10
        ) {
            return null;
        }

        setAttempt(
            existingAttempt
        );

        await loadSavedAnswers(
            user,
            existingAttempt
        );

        return orderedQuestions;
    };

    // ==================================================
    // GET PREVIOUSLY USED ASSESSMENT QUESTIONS
    // ==================================================

    const getPreviouslyUsedQuestionIds =
        async (
            user,
            allQuestionData
        ) => {
            const questionIds =
                allQuestionData.map(
                    (question) =>
                        question.id
                );

            if (
                questionIds.length === 0
            ) {
                return [];
            }

            const usedIds = new Set();

            // ==================================================
            // NEW ASSESSMENT ATTEMPT SYSTEM
            // ==================================================

            const {
                data: previousAttempts,
                error:
                    previousAttemptsError,
            } = await supabase
                .from(
                    "assessment_attempt_questions"
                )
                .select(
                    "question_id, attempt_id"
                )
                .in(
                    "question_id",
                    questionIds
                );

            if (
                previousAttemptsError
            ) {
                throw previousAttemptsError;
            }

            if (
                previousAttempts &&
                previousAttempts.length > 0
            ) {
                const attemptIds = [
                    ...new Set(
                        previousAttempts.map(
                            (item) =>
                                item.attempt_id
                        )
                    ),
                ];

                if (
                    attemptIds.length > 0
                ) {
                    const {
                        data: userAttempts,
                        error:
                            userAttemptsError,
                    } = await supabase
                        .from(
                            "assessment_attempts"
                        )
                        .select("id")
                        .eq(
                            "user_id",
                            user.id
                        )
                        .in(
                            "id",
                            attemptIds
                        );

                    if (
                        userAttemptsError
                    ) {
                        throw userAttemptsError;
                    }

                    const userAttemptIds =
                        new Set(
                            (
                                userAttempts ||
                                []
                            ).map(
                                (
                                    attempt
                                ) =>
                                    attempt.id
                            )
                        );

                    previousAttempts.forEach(
                        (item) => {
                            if (
                                userAttemptIds.has(
                                    item.attempt_id
                                )
                            ) {
                                usedIds.add(
                                    item.question_id
                                );
                            }
                        }
                    );
                }
            }

            // ==================================================
            // OLD ASSESSMENT SYSTEM
            // ==================================================

            const {
                data: oldAssessmentAnswers,
                error:
                    oldAnswersError,
            } = await supabase
                .from("user_answers")
                .select(
                    "question_id"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .in(
                    "question_id",
                    questionIds
                )
                .not(
                    "assessment_id",
                    "is",
                    null
                );

            if (oldAnswersError) {
                throw oldAnswersError;
            }

            (
                oldAssessmentAnswers ||
                []
            ).forEach((answer) => {
                usedIds.add(
                    answer.question_id
                );
            });

            return [
                ...usedIds,
            ];
        };

    // ==================================================
    // CREATE NEW ASSESSMENT ATTEMPT
    // ==================================================

    const createNewAttempt = async (
        user,
        assessmentData,
        selectedQuestions
    ) => {
        const {
            data: previousAttempts,
            error: attemptsError,
        } = await supabase
            .from("assessment_attempts")
            .select(
                "attempt_number"
            )
            .eq(
                "user_id",
                user.id
            )
            .eq(
                "learning_topic_id",
                Number(topicId)
            )
            .order(
                "attempt_number",
                {
                    ascending: false,
                }
            )
            .limit(1);

        if (attemptsError) {
            throw attemptsError;
        }

        const nextAttemptNumber =
            previousAttempts &&
            previousAttempts.length > 0
                ? (
                      previousAttempts[0]
                          .attempt_number ||
                      0
                  ) + 1
                : 1;

        // ==================================================
        // CREATE ATTEMPT
        // ==================================================

        const {
            data: newAttempt,
            error: attemptError,
        } = await supabase
            .from(
                "assessment_attempts"
            )
            .insert({
                user_id:
                    user.id,

                assessment_id:
                    assessmentData.id,

                learning_topic_id:
                    Number(topicId),

                attempt_number:
                    nextAttemptNumber,

                score: 0,

                percentage: 0,

                passed: false,

                started_at:
                    new Date().toISOString(),
            })
            .select("*")
            .single();

        if (attemptError) {
            throw attemptError;
        }

        // ==================================================
        // SAVE ASSIGNED QUESTIONS
        // ==================================================

        const attemptQuestionRecords =
            selectedQuestions.map(
                (
                    question,
                    index
                ) => ({
                    attempt_id:
                        newAttempt.id,

                    question_id:
                        question.id,

                    question_order:
                        index + 1,
                })
            );

        const {
            error:
                attemptQuestionsError,
        } = await supabase
            .from(
                "assessment_attempt_questions"
            )
            .insert(
                attemptQuestionRecords
            );

        if (
            attemptQuestionsError
        ) {
            await supabase
                .from(
                    "assessment_attempts"
                )
                .delete()
                .eq(
                    "id",
                    newAttempt.id
                );

            throw attemptQuestionsError;
        }

        setAttempt(
            newAttempt
        );

        return newAttempt;
    };

    // ==================================================
    // LOAD ASSESSMENT
    // ==================================================

    useEffect(() => {
        fetchAssessment();
    }, [topicId]);

    const fetchAssessment =
        async () => {
            try {
                setLoading(true);
                setLoadError("");
                setSubmitError("");

                // ==================================================
                // CURRENT USER
                // ==================================================

                const {
                    data: {
                        user,
                    },
                    error: userError,
                } =
                    await supabase.auth.getUser();

                if (userError) {
                    throw userError;
                }

                if (!user) {
                    throw new Error(
                        "Please login to access the assessment."
                    );
                }

                // ==================================================
                // TOPIC
                // ==================================================

                const {
                    data: topicData,
                    error: topicError,
                } =
                    await supabase
                        .from(
                            "learning_topics"
                        )
                        .select("*")
                        .eq(
                            "id",
                            Number(topicId)
                        )
                        .single();

                if (topicError) {
                    throw topicError;
                }

                // ==================================================
                // ASSESSMENT
                // ==================================================

                const {
                    data: assessmentData,
                    error: assessmentError,
                } =
                    await supabase
                        .from(
                            "assessments"
                        )
                        .select("*")
                        .eq(
                            "learning_topic_id",
                            Number(topicId)
                        )
                        .order(
                            "id",
                            {
                                ascending: true,
                            }
                        )
                        .limit(1)
                        .maybeSingle();

                if (assessmentError) {
                    throw assessmentError;
                }

                if (!assessmentData) {
                    throw new Error(
                        "This topic does not have an assessment yet."
                    );
                }

                // ==================================================
                // ALL QUESTIONS
                // ==================================================

                const {
                    data: allQuestionData,
                    error: questionError,
                } =
                    await supabase
                        .from(
                            "questions"
                        )
                        .select("*")
                        .eq(
                            "learning_topic_id",
                            Number(topicId)
                        );

                if (questionError) {
                    throw questionError;
                }

                if (
                    !allQuestionData ||
                    allQuestionData.length < 10
                ) {
                    throw new Error(
                        "This topic does not have enough questions to create a 10-question assessment."
                    );
                }

                // ==================================================
                // TRY TO RESUME EXISTING ATTEMPT
                // ==================================================

                const existingAttemptQuestions =
                    await loadExistingAttempt(
                        user
                    );

                if (
                    existingAttemptQuestions
                ) {
                    setTopic(
                        topicData
                    );

                    setAssessment(
                        assessmentData
                    );

                    setQuestions(
                        existingAttemptQuestions
                    );

                    setCurrentQuestion(
                        0
                    );

                    setSubmitted(
                        false
                    );

                    setScore(0);

                    return;
                }

                // ==================================================
                // PREVIOUSLY USED QUESTIONS
                // ==================================================

                const previouslyUsedIds =
                    await getPreviouslyUsedQuestionIds(
                        user,
                        allQuestionData
                    );

                // ==================================================
                // CREATE NEW QUESTION SET
                // ==================================================

                const selectedQuestions =
                    createMixedAssessment(
                        allQuestionData,
                        previouslyUsedIds
                    );

                // ==================================================
                // CREATE DATABASE ATTEMPT
                // ==================================================

                const newAttempt =
                    await createNewAttempt(
                        user,
                        assessmentData,
                        selectedQuestions
                    );

                // ==================================================
                // SAVE STATE
                // ==================================================

                setTopic(
                    topicData
                );

                setAssessment(
                    assessmentData
                );

                setAttempt(
                    newAttempt
                );

                setQuestions(
                    selectedQuestions
                );

                setAnswers({});
                setCurrentQuestion(0);
                setSubmitted(false);
                setScore(0);
            } catch (error) {
                console.error(
                    "Assessment loading error:",
                    error
                );

                setLoadError(
                    error.message ||
                        "Unable to load assessment."
                );
            } finally {
                setLoading(false);
            }
        };

    // ==================================================
    // SELECT ANSWER
    // ==================================================

    const handleAnswer = (
        answer
    ) => {
        if (
            saving ||
            submitted
        ) {
            return;
        }

        const question =
            questions[
                currentQuestion
            ];

        if (!question) {
            return;
        }

        setAnswers(
            (previous) => ({
                ...previous,
                [question.id]:
                    answer,
            })
        );

        setSubmitError("");
    };

    // ==================================================
    // NEXT
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
    // PREVIOUS
    // ==================================================

    const handlePrevious = () => {
        if (
            currentQuestion > 0
        ) {
            setCurrentQuestion(
                currentQuestion - 1
            );
        }
    };

    // ==================================================
    // FIND FIRST UNANSWERED
    // ==================================================

    const findFirstUnansweredQuestion =
        () => {
            return questions.findIndex(
                (question) => {
                    const answer =
                        answers[
                            question.id
                        ];

                    return (
                        answer ===
                            undefined ||
                        answer === null ||
                        answer === ""
                    );
                }
            );
        };

    // ==================================================
    // SUBMIT ASSESSMENT
    // ==================================================

    const handleSubmit =
        async () => {
            if (saving) {
                return;
            }

            setSubmitError("");

            // ==================================================
            // CHECK ALL ANSWERS
            // ==================================================

            const answeredCount =
                questions.filter(
                    (question) => {
                        const answer =
                            answers[
                                question.id
                            ];

                        return (
                            answer !==
                                undefined &&
                            answer !==
                                null &&
                            answer !== ""
                        );
                    }
                ).length;

            if (
                answeredCount !==
                questions.length
            ) {
                const firstUnanswered =
                    findFirstUnansweredQuestion();

                setSubmitError(
                    `Please answer all ${questions.length} questions. ${
                        questions.length -
                        answeredCount
                    } question(s) still unanswered.`
                );

                if (
                    firstUnanswered !==
                    -1
                ) {
                    setCurrentQuestion(
                        firstUnanswered
                    );
                }

                return;
            }

            try {
                setSaving(true);

                // ==================================================
                // CURRENT USER
                // ==================================================

                const {
                    data: {
                        user,
                    },
                    error: userError,
                } =
                    await supabase.auth.getUser();

                if (userError) {
                    throw userError;
                }

                if (!user) {
                    throw new Error(
                        "You must be logged in to submit the assessment."
                    );
                }

                if (!attempt) {
                    throw new Error(
                        "Assessment attempt could not be found. Please reload the assessment."
                    );
                }

                // ==================================================
                // CALCULATE SCORE
                // ==================================================

                let calculatedScore = 0;

                questions.forEach(
                    (question) => {
                        if (
                            answers[
                                question.id
                            ] ===
                            question.correct_answer
                        ) {
                            calculatedScore +=
                                question.points ||
                                1;
                        }
                    }
                );

                const totalPoints =
                    questions.reduce(
                        (
                            total,
                            question
                        ) =>
                            total +
                            (
                                question.points ||
                                1
                            ),
                        0
                    );

                const percentage =
                    Math.round(
                        (
                            calculatedScore /
                            totalPoints
                        ) *
                            100
                    );

                const passingScore =
                    assessment?.passing_score ||
                    60;

                const passed =
                    percentage >=
                    passingScore;

                const now =
                    new Date().toISOString();

                // ==================================================
                // ANSWER RECORDS
                // ==================================================

                const answerRecords =
                    questions.map(
                        (question) => {
                            const selectedAnswer =
                                answers[
                                    question.id
                                ];

                            const isCorrect =
                                selectedAnswer ===
                                question.correct_answer;

                            return {
                                user_id:
                                    user.id,

                                question_id:
                                    question.id,

                                assessment_id:
                                    assessment.id,

                                assessment_attempt_id:
                                    attempt.id,

                                selected_answer:
                                    selectedAnswer,

                                is_correct:
                                    isCorrect,

                                points_earned:
                                    isCorrect
                                        ? question.points ||
                                          1
                                        : 0,
                            };
                        }
                    );

                // ==================================================
                // SAVE ANSWERS
                // ==================================================

                const {
                    error:
                        answersError,
                } =
                    await supabase
                        .from(
                            "user_answers"
                        )
                        .insert(
                            answerRecords
                        );

                if (answersError) {
                    throw answersError;
                }

                // ==================================================
                // UPDATE ATTEMPT
                // ==================================================

                const {
                    data:
                        updatedAttempt,
                    error:
                        attemptUpdateError,
                } =
                    await supabase
                        .from(
                            "assessment_attempts"
                        )
                        .update({
                            score:
                                calculatedScore,

                            percentage:
                                percentage,

                            passed:
                                passed,

                            completed_at:
                                now,
                        })
                        .eq(
                            "id",
                            attempt.id
                        )
                        .eq(
                            "user_id",
                            user.id
                        )
                        .select("*")
                        .single();

                if (
                    attemptUpdateError
                ) {
                    throw attemptUpdateError;
                }

                setAttempt(
                    updatedAttempt
                );

                // ==================================================
                // GET EXISTING PROGRESS
                // ==================================================

                const {
                    data:
                        existingProgress,
                    error:
                        progressFetchError,
                } =
                    await supabase
                        .from(
                            "user_progress"
                        )
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

                if (
                    progressFetchError
                ) {
                    throw progressFetchError;
                }

                const newAttempts =
                    (
                        existingProgress?.attempts ||
                        0
                    ) + 1;

                // ==================================================
                // UPDATE PROGRESS
                // ==================================================

                const progressData = {
                    status:
                        passed
                            ? "completed"
                            : "in_progress",

                    progress_percentage:
                        passed
                            ? 100
                            : 60,

                    assessment_score:
                        percentage,

                    attempts:
                        newAttempts,

                    completed_at:
                        passed
                            ? now
                            : null,

                    last_activity_at:
                        now,
                };

                if (
                    existingProgress
                ) {
                    const {
                        error:
                            updateError,
                    } =
                        await supabase
                            .from(
                                "user_progress"
                            )
                            .update(
                                progressData
                            )
                            .eq(
                                "id",
                                existingProgress.id
                            );

                    if (
                        updateError
                    ) {
                        throw updateError;
                    }
                } else {
                    // ==================================================
                    // CREATE PROGRESS
                    // ==================================================

                    const {
                        error:
                            insertError,
                    } =
                        await supabase
                            .from(
                                "user_progress"
                            )
                            .insert({
                                user_id:
                                    user.id,

                                learning_topic_id:
                                    Number(
                                        topicId
                                    ),

                                status:
                                    passed
                                        ? "completed"
                                        : "in_progress",

                                progress_percentage:
                                    passed
                                        ? 100
                                        : 60,

                                practice_score:
                                    null,

                                assessment_score:
                                    percentage,

                                attempts:
                                    1,

                                started_at:
                                    now,

                                completed_at:
                                    passed
                                        ? now
                                        : null,

                                last_activity_at:
                                    now,
                            });

                    if (
                        insertError
                    ) {
                        throw insertError;
                    }
                }

                // ==================================================
                // SHOW RESULT
                // ==================================================

                setScore(
                    calculatedScore
                );

                setSubmitted(
                    true
                );
            } catch (error) {
                console.error(
                    "Assessment submission error:",
                    error
                );

                setSubmitError(
                    error.message ||
                        "Unable to save your assessment result."
                );
            } finally {
                setSaving(false);
            }
        };

    // ==================================================
    // OPTION STYLE
    // ==================================================

    const getOptionClass = (
        option
    ) => {
        const question =
            questions[
                currentQuestion
            ];

        if (!question) {
            return "assessment-option";
        }

        if (!submitted) {
            return answers[
                question.id
            ] === option
                ? "assessment-option selected"
                : "assessment-option";
        }

        if (
            option ===
            question.correct_answer
        ) {
            return "assessment-option correct";
        }

        if (
            answers[
                question.id
            ] === option &&
            option !==
                question.correct_answer
        ) {
            return "assessment-option incorrect";
        }

        return "assessment-option";
    };

    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <div className="assessment-page">
                <div className="assessment-loading">
                    <div className="assessment-spinner"></div>

                    <p>
                        Preparing your assessment...
                    </p>
                </div>
            </div>
        );
    }

    // ==================================================
    // LOAD ERROR
    // ==================================================

    if (loadError) {
        return (
            <div className="assessment-page">
                <div className="assessment-error">
                    <XCircle size={30} />

                    <h2>
                        Unable to load assessment
                    </h2>

                    <p>
                        {loadError}
                    </p>

                    <button
                        onClick={() =>
                            navigate(
                                `/learning/topic/${topicId}`
                            )
                        }
                    >
                        <ArrowLeft
                            size={17}
                        />

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
                (
                    total,
                    question
                ) =>
                    total +
                    (
                        question.points ||
                        1
                    ),
                0
            );

        const percentage =
            Math.round(
                (
                    score /
                    totalPoints
                ) *
                    100
            );

        const passed =
            percentage >=
            (
                assessment?.passing_score ||
                60
            );

        return (
            <div className="assessment-page">
                <div className="assessment-result">

                    <div className="assessment-result-icon">
                        {passed ? (
                            <CheckCircle2
                                size={44}
                            />
                        ) : (
                            <Target
                                size={44}
                            />
                        )}
                    </div>

                    <p className="assessment-eyebrow">
                        ASSESSMENT COMPLETE
                    </p>

                    <h1>
                        {passed
                            ? "Topic completed!"
                            : "Keep practicing"}
                    </h1>

                    <p className="assessment-result-description">
                        {passed
                            ? `Excellent! You passed the ${topic?.title} assessment.`
                            : `You didn't reach the passing score for ${topic?.title} yet.`}
                    </p>

                    <div className="assessment-score-card">

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
                                Required
                            </span>

                            <strong>
                                {
                                    assessment?.passing_score ||
                                    60
                                }%
                            </strong>
                        </div>

                    </div>

                    <div
                        className={`assessment-result-message ${
                            passed
                                ? "assessment-success"
                                : "assessment-failed"
                        }`}
                    >
                        {passed ? (
                            <>
                                <CheckCircle2
                                    size={20}
                                />

                                <p>
                                    This topic is now
                                    marked as
                                    completed.
                                    Your next
                                    learning step
                                    is ready.
                                </p>
                            </>
                        ) : (
                            <>
                                <Target
                                    size={20}
                                />

                                <p>
                                    Review the
                                    learning
                                    resources and
                                    practice again
                                    before taking
                                    the assessment
                                    again.
                                </p>
                            </>
                        )}
                    </div>

                    <div className="assessment-result-actions">

                        <button
                            className="assessment-secondary-button"
                            onClick={() =>
                                navigate(
                                    `/learning/topic/${topicId}`
                                )
                            }
                        >
                            <ArrowLeft
                                size={17}
                            />

                            Back to Topic
                        </button>

                        {passed ? (
                            <button
                                className="assessment-primary-button"
                                onClick={() =>
                                    navigate(
                                        "/learning"
                                    )
                                }
                            >
                                Continue Learning

                                <ChevronRight
                                    size={17}
                                />
                            </button>
                        ) : (
                            <button
                                className="assessment-primary-button"
                                onClick={() => {
                                    fetchAssessment();
                                }}
                            >
                                Try Again
                            </button>
                        )}

                    </div>
                </div>
            </div>
        );
    }

    // ==================================================
    // CURRENT QUESTION
    // ==================================================

    const question =
        questions[
            currentQuestion
        ];

    const questionProgress =
        (
            (
                currentQuestion +
                1
            ) /
            questions.length
        ) *
        100;

    const answeredCount =
        questions.filter(
            (item) => {
                const answer =
                    answers[
                        item.id
                    ];

                return (
                    answer !==
                        undefined &&
                    answer !== null &&
                    answer !== ""
                );
            }
        ).length;

    // ==================================================
    // ASSESSMENT UI
    // ==================================================

    return (
        <div className="assessment-page">

            {/* HEADER */}

            <header className="assessment-header">

                <button
                    className="assessment-back-button"
                    onClick={() =>
                        navigate(
                            `/learning/topic/${topicId}`
                        )
                    }
                >
                    <ArrowLeft
                        size={18}
                    />

                    Back to Topic
                </button>

                <div className="assessment-header-main">

                    <div>

                        <p className="assessment-eyebrow">
                            FINAL ASSESSMENT
                        </p>

                        <h1>
                            {assessment?.title}
                        </h1>

                        <p>
                            Demonstrate what you've
                            learned before moving
                            to the next topic.
                        </p>

                    </div>

                    <div className="assessment-info">

                        <div>
                            <Clock3
                                size={16}
                            />

                            <span>
                                {
                                    assessment?.time_limit_minutes ||
                                    15
                                }{" "}
                                min
                            </span>
                        </div>

                        <div>
                            <Target
                                size={16}
                            />

                            <span>
                                Pass:{" "}
                                {
                                    assessment?.passing_score ||
                                    60
                                }%
                            </span>
                        </div>

                    </div>

                </div>

                <div className="assessment-progress-track">

                    <div
                        className="assessment-progress-fill"
                        style={{
                            width: `${questionProgress}%`,
                        }}
                    ></div>

                </div>

            </header>

            {/* MAIN */}

            <main className="assessment-main">

                {/* SUBMIT ERROR */}

                {submitError && (
                    <div
                        className="assessment-error"
                        style={{
                            marginBottom:
                                "20px",
                        }}
                    >
                        <XCircle
                            size={22}
                        />

                        <p>
                            {submitError}
                        </p>
                    </div>
                )}

                {/* ANSWER COUNTER */}

                <div
                    style={{
                        marginBottom:
                            "16px",
                        textAlign:
                            "right",
                        fontSize:
                            "14px",
                        fontWeight:
                            "600",
                        color:
                            "#77779a",
                    }}
                >
                    {answeredCount}/
                    {questions.length}{" "}
                    answered
                </div>

                {/* QUESTION CARD */}

                <div className="assessment-question-card">

                    <div className="assessment-question-top">

                        <span className="assessment-question-label">
                            QUESTION{" "}
                            {currentQuestion + 1}
                            {" / "}
                            {questions.length}
                        </span>

                        <span className="assessment-difficulty">
                            {
                                question.difficulty ||
                                "Medium"
                            }
                        </span>

                    </div>

                    <h2>
                        {
                            question.question_text
                        }
                    </h2>

                    <div className="assessment-options">

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
                            ([
                                letter,
                                text,
                            ]) => (
                                <button
                                    key={
                                        letter
                                    }
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
                                    <span className="assessment-option-letter">

                                        {
                                            answers[
                                                question.id
                                            ] ===
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
                                            )
                                        }

                                    </span>

                                    <span className="assessment-option-text">

                                        <strong>
                                            {
                                                letter
                                            }
                                        </strong>

                                        {text}

                                    </span>
                                </button>
                            )
                        )}

                    </div>

                </div>

                {/* NAVIGATION */}

                <div className="assessment-navigation">

                    <button
                        className="assessment-secondary-button"
                        onClick={
                            handlePrevious
                        }
                        disabled={
                            currentQuestion ===
                                0 ||
                            saving
                        }
                    >
                        <ChevronLeft
                            size={17}
                        />

                        Previous
                    </button>

                    <div className="assessment-dots">

                        {questions.map(
                            (
                                item,
                                index
                            ) => (
                                <button
                                    key={
                                        item.id
                                    }
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
                            className="assessment-primary-button"
                            onClick={
                                handleSubmit
                            }
                            disabled={
                                saving
                            }
                        >
                            {saving
                                ? "Saving Result..."
                                : "Submit Assessment"}

                            {!saving && (
                                <CheckCircle2
                                    size={17}
                                />
                            )}
                        </button>
                    ) : (
                        <button
                            className="assessment-primary-button"
                            onClick={
                                handleNext
                            }
                            disabled={
                                saving
                            }
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

export default Assessment;