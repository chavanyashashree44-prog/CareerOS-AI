import { useEffect, useState } from "react";
import {
    BookOpen,
    Clock3,
    ChevronRight,
    CheckCircle2,
    Circle,
    Sparkles,
    ArrowLeft,
    Lock,
    Code2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";
import "./Learning.css";

function Learning() {
    const navigate = useNavigate();

    const [learningPaths, setLearningPaths] = useState([]);
    const [selectedPath, setSelectedPath] = useState(null);
    const [topics, setTopics] = useState([]);
    const [progressMap, setProgressMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchLearningData();
    }, []);

    const fetchLearningData = async () => {
        try {
            setLoading(true);
            setError("");

            // Get logged-in user
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw userError;
            }

            if (!user) {
                throw new Error(
                    "Please login to access your learning path."
                );
            }

            // Get available learning paths
            const {
                data: pathData,
                error: pathError,
            } = await supabase
                .from("learning_paths")
                .select("*")
                .in("name", [
                    "Java Development",
                    "Python Development",
                    "JavaScript Development",
                ])
                .order("id", {
                    ascending: true,
                });

            if (pathError) {
                throw pathError;
            }

            if (!pathData || pathData.length === 0) {
                throw new Error(
                    "No learning paths are available."
                );
            }

            setLearningPaths(pathData);

            // Get this student's progress
            const {
                data: progressData,
                error: progressError,
            } = await supabase
                .from("user_progress")
                .select(
                    "learning_topic_id, status, progress_percentage, practice_score, assessment_score, attempts"
                )
                .eq("user_id", user.id);

            if (progressError) {
                throw progressError;
            }

            // Convert progress into lookup object
            const progressLookup = {};

            (progressData || []).forEach((progress) => {
                progressLookup[progress.learning_topic_id] =
                    progress;
            });

            setProgressMap(progressLookup);

            // Keep Java selected by default
            const javaPath =
                pathData.find(
                    (path) =>
                        path.name === "Java Development"
                ) || pathData[0];

            await loadTopics(
                javaPath,
                progressLookup
            );
        } catch (err) {
            console.error(
                "Learning page error:",
                err
            );

            setError(
                err.message ||
                    "Unable to load the learning paths."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadTopics = async (
        path,
        currentProgressMap = progressMap
    ) => {
        try {
            setSelectedPath(path);

            const {
                data: topicData,
                error: topicError,
            } = await supabase
                .from("learning_topics")
                .select("*")
                .eq("learning_path_id", path.id)
                .order("order_number", {
                    ascending: true,
                });

            if (topicError) {
                throw topicError;
            }

            setTopics(topicData || []);
            setProgressMap(currentProgressMap);
        } catch (err) {
            console.error(
                "Learning topics error:",
                err
            );

            setError(
                err.message ||
                    "Unable to load topics."
            );
        }
    };

    const handlePathChange = async (path) => {
        if (
            selectedPath?.id === path.id
        ) {
            return;
        }

        setError("");
        await loadTopics(path);
    };

    /*
     * Topic 1 is always unlocked.
     *
     * Every topic after that is unlocked only
     * when the immediately previous topic is
     * completed.
     */
    const isTopicUnlocked = (index) => {
        if (index === 0) {
            return true;
        }

        const previousTopic =
            topics[index - 1];

        const previousProgress =
            progressMap[previousTopic.id];

        return (
            previousProgress?.status ===
            "completed"
        );
    };

    const getTopicStatus = (
        topic,
        index
    ) => {
        const progress =
            progressMap[topic.id];

        if (
            progress?.status ===
            "completed"
        ) {
            return "completed";
        }

        if (
            progress?.status ===
            "in_progress"
        ) {
            return "in_progress";
        }

        if (
            !isTopicUnlocked(index)
        ) {
            return "locked";
        }

        return "not_started";
    };

    const getTopicProgress = (
        topic
    ) => {
        return (
            progressMap[topic.id]
                ?.progress_percentage || 0
        );
    };

    const handleTopicClick = (
        topic,
        index
    ) => {
        if (
            !isTopicUnlocked(index)
        ) {
            return;
        }

        navigate(
            `/learning/topic/${topic.id}`
        );
    };

    const getPathIcon = (pathName) => {
        if (
            pathName ===
            "Python Development"
        ) {
            return <Code2 size={22} />;
        }

        return <BookOpen size={22} />;
    };

    if (loading) {
        return (
            <div className="learning-page">
                <div className="learning-loading">
                    <div className="learning-spinner"></div>

                    <p>
                        Loading your learning paths...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="learning-page">
                <div className="learning-error">
                    <h2>
                        Unable to load learning path
                    </h2>

                    <p>{error}</p>

                    <button
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="learning-page">

            {/* Header */}

            <header className="learning-header">

                <button
                    className="learning-back-button"
                    onClick={() =>
                        navigate("/")
                    }
                >
                    <ArrowLeft size={18} />
                    Dashboard
                </button>

                <div className="learning-header-content">

                    <div className="learning-icon">
                        {getPathIcon(
                            selectedPath?.name
                        )}
                    </div>

                    <div>

                        <p className="learning-eyebrow">
                            PERSONALIZED LEARNING
                        </p>

                        <h1>
                            Learning Hub
                        </h1>

                        <p className="learning-description">
                            Choose your learning path and
                            build your technical skills step
                            by step.
                        </p>

                    </div>

                </div>

            </header>


            {/* Learning Path Selector */}

            <section className="learning-path-selector">

                <div className="learning-section-heading">

                    <div>

                        <p className="learning-eyebrow">
                            YOUR LEARNING PATHS
                        </p>

                        <h2>
                            Choose what you want to learn
                        </h2>

                        <p>
                            Select a programming path to
                            continue your personalized
                            learning journey.
                        </p>

                    </div>

                </div>


                <div
                    className="learning-path-grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: "16px",
                        marginTop: "20px",
                    }}
                >

                    {learningPaths.map(
                        (path) => {

                            const isSelected =
                                selectedPath?.id ===
                                path.id;

                            return (
                                <button
                                    key={path.id}
                                    type="button"
                                    onClick={() =>
                                        handlePathChange(
                                            path
                                        )
                                    }
                                    style={{
                                        textAlign:
                                            "left",
                                        padding:
                                            "20px",
                                        borderRadius:
                                            "16px",
                                        border: isSelected
                                            ? "2px solid currentColor"
                                            : "1px solid rgba(99, 102, 241, 0.16)",
                                        background:
                                            isSelected
                                                ? "rgba(99, 102, 241, 0.08)"
                                                : "transparent",
                                        cursor:
                                            "pointer",
                                        transition:
                                            "all 0.2s ease",
                                    }}
                                >

                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap: "12px",
                                            marginBottom:
                                                "10px",
                                        }}
                                    >

                                        <div
                                            style={{
                                                width:
                                                    "42px",
                                                height:
                                                    "42px",
                                                borderRadius:
                                                    "12px",
                                                display:
                                                    "flex",
                                                alignItems:
                                                    "center",
                                                justifyContent:
                                                    "center",
                                                background:
                                                    "rgba(99, 102, 241, 0.10)",
                                            }}
                                        >
                                            {getPathIcon(
                                                path.name
                                            )}
                                        </div>

                                        <div>

                                            <strong>
                                                {
                                                    path.name
                                                }
                                            </strong>

                                            <div
                                                style={{
                                                    fontSize:
                                                        "12px",
                                                    opacity:
                                                        0.65,
                                                    marginTop:
                                                        "3px",
                                                }}
                                            >
                                                {path.difficulty ||
                                                    "Beginner"}{" "}
                                                •{" "}
                                                {
                                                    path.description
                                                        ? "Learning Path"
                                                        : "CareerOS AI"
                                                }
                                            </div>

                                        </div>

                                    </div>

                                    <p
                                        style={{
                                            margin:
                                                0,
                                            fontSize:
                                                "13px",
                                            lineHeight:
                                                "1.6",
                                            opacity:
                                                0.75,
                                        }}
                                    >
                                        {path.description ||
                                            `Build your ${path.name.replace(
                                                " Development",
                                                ""
                                            )} skills step by step.`}
                                    </p>

                                </button>
                            );
                        }
                    )}

                </div>

            </section>


            {/* AI Banner */}

            <section className="learning-ai-banner">

                <div className="learning-ai-icon">
                    <Sparkles size={22} />
                </div>

                <div>

                    <h3>
                        Your CareerOS learning journey
                    </h3>

                    <p>
                        Learn each topic, practice what
                        you learned, complete the
                        assessment, and unlock the next
                        step.
                    </p>

                </div>

            </section>


            {/* Progress Summary */}

            <section className="learning-summary">

                <div className="learning-summary-card">

                    <BookOpen size={20} />

                    <div>

                        <span>
                            Total Topics
                        </span>

                        <strong>
                            {topics.length}
                        </strong>

                    </div>

                </div>


                <div className="learning-summary-card">

                    <Clock3 size={20} />

                    <div>

                        <span>
                            Estimated Learning
                        </span>

                        <strong>
                            {Math.round(
                                topics.reduce(
                                    (
                                        total,
                                        topic
                                    ) =>
                                        total +
                                        (
                                            topic.estimated_minutes ||
                                            0
                                        ),
                                    0
                                ) / 60
                            )}{" "}
                            hrs
                        </strong>

                    </div>

                </div>


                <div className="learning-summary-card">

                    <Sparkles size={20} />

                    <div>

                        <span>
                            Current Level
                        </span>

                        <strong>
                            {selectedPath?.difficulty ||
                                "Beginner"}
                        </strong>

                    </div>

                </div>

            </section>


            {/* Topics */}

            <section className="learning-topics-section">

                <div className="learning-section-heading">

                    <div>

                        <p className="learning-eyebrow">
                            {selectedPath?.name?.toUpperCase()}
                        </p>

                        <h2>
                            Follow the path step by step
                        </h2>

                        <p>
                            Complete topics in sequence to
                            build your skills progressively.
                        </p>

                    </div>

                </div>


                <div className="learning-topic-list">

                    {topics.map(
                        (topic, index) => {

                            const status =
                                getTopicStatus(
                                    topic,
                                    index
                                );

                            const topicProgress =
                                getTopicProgress(
                                    topic
                                );

                            const isCompleted =
                                status ===
                                "completed";

                            const isInProgress =
                                status ===
                                "in_progress";

                            const isLocked =
                                status ===
                                "locked";

                            return (
                                <div
                                    key={topic.id}
                                    className={`learning-topic-card ${
                                        isInProgress
                                            ? "learning-topic-active"
                                            : ""
                                    } ${
                                        isCompleted
                                            ? "learning-topic-completed"
                                            : ""
                                    } ${
                                        isLocked
                                            ? "learning-topic-locked"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        handleTopicClick(
                                            topic,
                                            index
                                        )
                                    }
                                >

                                    {/* Status */}

                                    <div className="learning-topic-number">

                                        {isLocked ? (
                                            <Lock
                                                size={21}
                                            />
                                        ) : isCompleted ? (
                                            <CheckCircle2
                                                size={24}
                                            />
                                        ) : isInProgress ? (
                                            <CheckCircle2
                                                size={24}
                                            />
                                        ) : (
                                            <Circle
                                                size={24}
                                            />
                                        )}

                                    </div>


                                    {/* Topic information */}

                                    <div className="learning-topic-main">

                                        <div className="learning-topic-title-row">

                                            <span className="learning-topic-order">
                                                {String(
                                                    topic.order_number
                                                ).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </span>

                                            <h3>
                                                {topic.title}
                                            </h3>

                                        </div>


                                        <p>
                                            {topic.description}
                                        </p>


                                        <div className="learning-topic-meta">

                                            <span>
                                                <Clock3
                                                    size={14}
                                                />

                                                {
                                                    topic.estimated_minutes
                                                }{" "}
                                                min
                                            </span>


                                            <span>
                                                {
                                                    topic.difficulty
                                                }
                                            </span>


                                            {topicProgress >
                                                0 && (
                                                <span>
                                                    Progress:{" "}
                                                    {
                                                        topicProgress
                                                    }
                                                    %
                                                </span>
                                            )}


                                            {isCompleted && (
                                                <span>
                                                    Completed
                                                </span>
                                            )}


                                            {isInProgress && (
                                                <span>
                                                    In Progress
                                                </span>
                                            )}


                                            {isLocked && (
                                                <span>
                                                    Complete
                                                    previous
                                                    topic to
                                                    unlock
                                                </span>
                                            )}

                                        </div>

                                    </div>


                                    {/* Arrow */}

                                    <div className="learning-topic-arrow">

                                        {isLocked ? (
                                            <Lock
                                                size={18}
                                            />
                                        ) : (
                                            <ChevronRight
                                                size={20}
                                            />
                                        )}

                                    </div>

                                </div>
                            );
                        }
                    )}

                </div>

            </section>

        </div>
    );
}

export default Learning;