import { useEffect, useState } from "react";
import {
    ArrowLeft,
    BookOpen,
    Clock3,
    ExternalLink,
    FileText,
    PlayCircle,
    Sparkles,
    CheckCircle2,
    Lock,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../config/supabase";
import "./TopicDetail.css";

function TopicDetail() {
    const navigate = useNavigate();
    const { topicId } = useParams();

    const [topic, setTopic] = useState(null);
    const [resources, setResources] = useState([]);
    const [progress, setProgress] = useState(null);
    const [learningPath, setLearningPath] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchTopic();
    }, [topicId]);

    // ==================================================
    // FETCH TOPIC
    // ==================================================

    const fetchTopic = async () => {
        try {
            setLoading(true);
            setError("");

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw userError;
            }

            if (!user) {
                throw new Error(
                    "Please login to access this learning topic."
                );
            }

            // ------------------------------------------
            // TOPIC
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
            // LEARNING PATH
            // ------------------------------------------

            const {
                data: pathData,
                error: pathError,
            } = await supabase
                .from("learning_paths")
                .select("*")
                .eq(
                    "id",
                    topicData.learning_path_id
                )
                .single();

            if (pathError) {
                throw pathError;
            }

            // ------------------------------------------
            // RESOURCES
            // ------------------------------------------

            const {
                data: resourceData,
                error: resourceError,
            } = await supabase
                .from("learning_resources")
                .select("*")
                .eq(
                    "learning_topic_id",
                    Number(topicId)
                )
                .order("is_primary", {
                    ascending: false,
                });

            if (resourceError) {
                throw resourceError;
            }

            // ------------------------------------------
            // USER PROGRESS
            // ------------------------------------------

            const {
                data: progressData,
                error: progressError,
            } = await supabase
                .from("user_progress")
                .select(
                    `
                    status,
                    progress_percentage,
                    practice_score,
                    assessment_score,
                    attempts,
                    started_at,
                    completed_at,
                    last_activity_at
                    `
                )
                .eq("user_id", user.id)
                .eq(
                    "learning_topic_id",
                    Number(topicId)
                )
                .maybeSingle();

            if (progressError) {
                throw progressError;
            }

            setTopic(topicData);
            setLearningPath(pathData);
            setResources(resourceData || []);
            setProgress(progressData);
        } catch (err) {
            console.error(
                "Topic detail error:",
                err
            );

            setError(
                err.message ||
                    "Unable to load this learning topic."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==================================================
    // RESOURCE ICON
    // ==================================================

    const getResourceIcon = (type) => {
        if (type === "Course") {
            return <PlayCircle size={20} />;
        }

        if (type === "Documentation") {
            return <FileText size={20} />;
        }

        return <BookOpen size={20} />;
    };

    // ==================================================
    // GROUP RESOURCES USING DATABASE "level"
    // ==================================================

    const beginnerResources = resources.filter(
        (resource) =>
            String(resource.level || "")
                .trim()
                .toLowerCase() === "beginner"
    );

    const intermediateResources = resources.filter(
        (resource) =>
            String(resource.level || "")
                .trim()
                .toLowerCase() === "intermediate"
    );

    const advancedResources = resources.filter(
        (resource) =>
            String(resource.level || "")
                .trim()
                .toLowerCase() === "advanced"
    );

    // ==================================================
    // RESOURCE GROUP
    // ==================================================

    const renderResourceGroup = (
        title,
        description,
        resourcesToRender,
        dotColor
    ) => {
        if (resourcesToRender.length === 0) {
            return null;
        }

        return (
            <div
                className="topic-resource-group"
                style={{
                    marginBottom: "32px",
                }}
            >
                {/* LEVEL HEADING */}

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "14px",
                    }}
                >
                    <span
                        style={{
                            width: "9px",
                            height: "9px",
                            minWidth: "9px",
                            borderRadius: "50%",
                            background:
                                dotColor,
                            display:
                                "inline-block",
                        }}
                    />

                    <div>
                        <p
                            style={{
                                margin: 0,
                                fontSize: "13px",
                                fontWeight: "700",
                                letterSpacing:
                                    "0.12em",
                                color:
                                    "#68749b",
                            }}
                        >
                            {title}
                        </p>

                        <p
                            style={{
                                margin:
                                    "3px 0 0",
                                fontSize: "13px",
                                color:
                                    "#7b84a3",
                            }}
                        >
                            {description}
                        </p>
                    </div>
                </div>

                {/* RESOURCE CARDS */}

                <div className="topic-resource-list">

                    {resourcesToRender.map(
                        (resource) => (
                            <div
                                className={`topic-resource-card ${
                                    resource.is_primary
                                        ? "primary-resource"
                                        : ""
                                }`}
                                key={
                                    resource.id
                                }
                            >
                                <div className="resource-icon">
                                    {getResourceIcon(
                                        resource.resource_type
                                    )}
                                </div>

                                <div className="resource-content">

                                    <div className="resource-title-row">

                                        <h3>
                                            {
                                                resource.title
                                            }
                                        </h3>

                                        {resource.is_primary && (
                                            <span className="primary-badge">
                                                Recommended
                                            </span>
                                        )}

                                    </div>

                                    <p>
                                        {
                                            resource.description
                                        }
                                    </p>

                                    <div className="resource-meta">

                                        <span>
                                            {
                                                resource.resource_type
                                            }
                                        </span>

                                        <span>
                                            {
                                                resource.provider
                                            }
                                        </span>

                                    </div>

                                </div>

                                {resource.url && (
                                    <a
                                        href={
                                            resource.url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="resource-button"
                                    >
                                        Open

                                        <ExternalLink
                                            size={16}
                                        />
                                    </a>
                                )}

                            </div>
                        )
                    )}

                </div>
            </div>
        );
    };

    // ==================================================
    // PROGRESS
    // ==================================================

    const progressPercentage =
        progress?.progress_percentage || 0;

    const isCompleted =
        progress?.status === "completed";

    const practiceCompleted =
        progressPercentage >= 60 ||
        progress?.practice_score !== null ||
        isCompleted;

    const assessmentAvailable =
        practiceCompleted || isCompleted;

    // ==================================================
    // NAVIGATION
    // ==================================================

    const handlePractice = () => {
        navigate(
            `/learning/topic/${topicId}/practice`
        );
    };

    const handleAssessment = () => {
        if (!assessmentAvailable) {
            return;
        }

        navigate(
            `/learning/topic/${topicId}/assessment`
        );
    };

    const handleNextTopic = () => {
        if (!isCompleted) {
            return;
        }

        navigate("/learning");
    };

    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <div className="topic-detail-page">

                <div className="topic-detail-loading">

                    <div className="topic-detail-spinner"></div>

                    <p>
                        Loading topic...
                    </p>

                </div>

            </div>
        );
    }

    // ==================================================
    // ERROR
    // ==================================================

    if (error || !topic) {
        return (
            <div className="topic-detail-page">

                <div className="topic-detail-error">

                    <h2>
                        Unable to load topic
                    </h2>

                    <p>
                        {error ||
                            "The requested topic could not be found."}
                    </p>

                    <button
                        onClick={() =>
                            navigate(
                                "/learning"
                            )
                        }
                    >
                        <ArrowLeft size={17} />
                        Back to Learning
                    </button>

                </div>

            </div>
        );
    }

    // ==================================================
    // PAGE
    // ==================================================

    return (
        <div className="topic-detail-page">

            {/* HEADER */}

            <header className="topic-detail-header">

                <button
                    className="topic-back-button"
                    onClick={() =>
                        navigate("/learning")
                    }
                >
                    <ArrowLeft size={18} />
                    Back to Learning
                </button>

                <div className="topic-detail-heading">

                    <div className="topic-detail-icon">
                        <BookOpen size={28} />
                    </div>

                    <div>

                        <p className="topic-detail-eyebrow">
                            {learningPath?.name ||
                                "LEARNING PATH"}
                        </p>

                        <div className="topic-title-row">

                            <span className="topic-order">
                                {String(
                                    topic.order_number
                                ).padStart(2, "0")}
                            </span>

                            <h1>
                                {topic.title}
                            </h1>

                            {isCompleted && (
                                <span
                                    style={{
                                        display:
                                            "inline-flex",
                                        alignItems:
                                            "center",
                                        gap: "6px",
                                        marginLeft:
                                            "12px",
                                        padding:
                                            "6px 10px",
                                        borderRadius:
                                            "999px",
                                        fontSize:
                                            "12px",
                                        fontWeight:
                                            "600",
                                        background:
                                            "rgba(110, 170, 125, 0.12)",
                                        color:
                                            "#5b8f67",
                                    }}
                                >
                                    <CheckCircle2
                                        size={14}
                                    />
                                    Completed
                                </span>
                            )}

                        </div>

                        <p className="topic-description">
                            {topic.description}
                        </p>

                        <div className="topic-meta">

                            <span>
                                <Clock3 size={15} />
                                {
                                    topic.estimated_minutes
                                }{" "}
                                min
                            </span>

                            <span>
                                {topic.difficulty}
                            </span>

                            {progressPercentage >
                                0 && (
                                <span>
                                    Progress:{" "}
                                    {
                                        progressPercentage
                                    }
                                    %
                                </span>
                            )}

                        </div>

                    </div>

                </div>

            </header>

            {/* AI GUIDANCE */}

            <section className="topic-ai-card">

                <div className="topic-ai-icon">
                    <Sparkles size={22} />
                </div>

                <div>

                    <p className="topic-ai-label">
                        CAREEROS AI
                    </p>

                    <h2>
                        Learn this topic before
                        moving ahead
                    </h2>

                    <p>
                        Start with the recommended
                        resource, understand the
                        concepts, and then continue
                        to practice and assess your
                        knowledge.
                    </p>

                </div>

            </section>

            {/* LEARNING FLOW */}

            <section className="topic-learning-flow">

                <div className="topic-flow-step active">

                    <div className="topic-flow-number">
                        1
                    </div>

                    <div>
                        <strong>
                            Learn
                        </strong>

                        <span>
                            Study the recommended
                            resources
                        </span>
                    </div>

                </div>

                <div className="topic-flow-line"></div>

                <div
                    className={`topic-flow-step ${
                        practiceCompleted
                            ? "active"
                            : ""
                    }`}
                >
                    <div className="topic-flow-number">
                        2
                    </div>

                    <div>
                        <strong>
                            Practice
                        </strong>

                        <span>
                            Solve topic questions
                        </span>
                    </div>

                </div>

                <div className="topic-flow-line"></div>

                <div
                    className={`topic-flow-step ${
                        assessmentAvailable
                            ? "active"
                            : ""
                    }`}
                >
                    <div className="topic-flow-number">
                        3
                    </div>

                    <div>
                        <strong>
                            Assessment
                        </strong>

                        <span>
                            Test your understanding
                        </span>
                    </div>

                </div>

            </section>

            {/* LEARNING RESOURCES */}

            <section className="topic-resources-section">

                <div className="topic-section-heading">

                    <div>

                        <p className="topic-detail-eyebrow">
                            LEARNING RESOURCES
                        </p>

                        <h2>
                            Start learning
                        </h2>

                        <p>
                            Follow the recommended
                            learning path from
                            beginner to advanced.
                        </p>

                    </div>

                </div>

                {resources.length === 0 ? (
                    <div className="topic-empty">

                        <BookOpen size={22} />

                        <p>
                            Learning resources
                            will be available
                            soon.
                        </p>

                    </div>
                ) : (
                    <>
                        {renderResourceGroup(
                            "BEGINNER",
                            "Start here and build your foundation.",
                            beginnerResources,
                            "#6faa7d"
                        )}

                        {renderResourceGroup(
                            "INTERMEDIATE",
                            "Build deeper understanding and practical skills.",
                            intermediateResources,
                            "#d6a84f"
                        )}

                        {renderResourceGroup(
                            "ADVANCED",
                            "Strengthen advanced concepts and real-world skills.",
                            advancedResources,
                            "#c56b6b"
                        )}
                    </>
                )}

            </section>

            {/* AFTER LEARNING */}

            <section className="topic-next-section">

                <div>

                    <p className="topic-detail-eyebrow">
                        AFTER LEARNING
                    </p>

                    <h2>
                        {isCompleted
                            ? "Topic completed!"
                            : practiceCompleted
                            ? "Ready for assessment?"
                            : "Ready to practice?"}
                    </h2>

                    <p>
                        {isCompleted
                            ? "Excellent work. You have completed this topic and unlocked your next learning step."
                            : practiceCompleted
                            ? "Great work. Your practice is complete. Take the assessment to complete this topic."
                            : "Once you've understood the concepts, test yourself with CareerOS practice questions before taking the assessment."}
                    </p>

                </div>

                <div className="topic-next-items">

                    <button
                        className="topic-next-action"
                        onClick={handlePractice}
                    >
                        <span>
                            02
                        </span>

                        <strong>
                            {practiceCompleted
                                ? "Practice Again"
                                : "Start Practice"}
                        </strong>
                    </button>

                    {assessmentAvailable ? (
                        <button
                            className="topic-next-action"
                            onClick={
                                handleAssessment
                            }
                        >
                            <span>
                                03
                            </span>

                            <strong>
                                {isCompleted
                                    ? "View Assessment"
                                    : "Start Assessment"}
                            </strong>
                        </button>
                    ) : (
                        <div className="topic-next-disabled">

                            <span>
                                03
                            </span>

                            <strong>
                                Assessment
                            </strong>

                            <Lock size={16} />

                        </div>
                    )}

                    {isCompleted ? (
                        <button
                            className="topic-next-action"
                            onClick={
                                handleNextTopic
                            }
                        >
                            <span>
                                04
                            </span>

                            <strong>
                                Continue Learning
                            </strong>
                        </button>
                    ) : (
                        <div className="topic-next-disabled">

                            <span>
                                04
                            </span>

                            <strong>
                                Next Topic
                            </strong>

                            <Lock size={16} />

                        </div>
                    )}

                </div>

            </section>

        </div>
    );
}

export default TopicDetail;