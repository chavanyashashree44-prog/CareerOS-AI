import { useEffect, useState } from "react";
import {
    ArrowLeft,
    Award,
    BookOpen,
    CheckCircle2,
    Sparkles,
    TrendingUp,
    AlertTriangle,
    ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";
import "./SkillDevelopment.css";

function SkillDevelopment() {
    const navigate = useNavigate();

    const [skills, setSkills] = useState([]);
    const [learningProgress, setLearningProgress] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadSkillDevelopment();
    }, []);

    const loadSkillDevelopment = async () => {
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
                    "Please login to access your skill profile."
                );
            }

            const {
                data: skillData,
                error: skillsError,
            } = await supabase
                .from("user_skills")
                .select(
                    "id, skill, category, proficiency_level, progress_percentage, source, is_recommended, recommendation_reason"
                )
                .eq("user_id", user.id)
                .order("skill", {
                    ascending: true,
                });

            if (skillsError) {
                throw skillsError;
            }

            const {
                data: progressData,
                error: progressError,
            } = await supabase
                .from("user_progress")
                .select(
                    `
                    learning_topic_id,
                    status,
                    progress_percentage,
                    learning_topics (
                        learning_path_id,
                        learning_paths (
                            name
                        )
                    )
                `
                )
                .eq("user_id", user.id);

            if (progressError) {
                throw progressError;
            }

            const pathProgress = {};

            const learningPaths = [
                "Java Development",
                "Python Development",
                "JavaScript Development",
            ];

            learningPaths.forEach((pathName) => {
                pathProgress[pathName] = {
                    totalTopics: 22,
                    completedTopics: 0,
                    progress: 0,
                };
            });

            (progressData || []).forEach((record) => {
                const pathName =
                    record.learning_topics?.learning_paths?.name;

                if (!pathName || !pathProgress[pathName]) {
                    return;
                }

                if (record.status === "completed") {
                    pathProgress[pathName].completedTopics += 1;
                }
            });

            Object.keys(pathProgress).forEach((pathName) => {
                const path = pathProgress[pathName];

                path.progress = Math.round(
                    (path.completedTopics /
                        path.totalTopics) *
                        100
                );
            });

            setSkills(skillData || []);
            setLearningProgress(pathProgress);
        } catch (err) {
            console.error(
                "Skill Development error:",
                err
            );

            setError(
                err.message ||
                    "Unable to load your skills."
            );
        } finally {
            setLoading(false);
        }
    };

    const getSkillProgress = (skill) => {
        const normalizedSkill =
            skill.skill.trim().toLowerCase();

        if (normalizedSkill === "java") {
            return (
                learningProgress[
                    "Java Development"
                ]?.progress ??
                skill.progress_percentage ??
                0
            );
        }

        if (
            normalizedSkill === "javascript" ||
            normalizedSkill === "java script"
        ) {
            return (
                learningProgress[
                    "JavaScript Development"
                ]?.progress ??
                skill.progress_percentage ??
                0
            );
        }

        return skill.progress_percentage || 0;
    };

    const getSkillLevel = (progress) => {
        if (progress >= 100) {
            return "Completed";
        }

        if (progress >= 70) {
            return "Nearly Complete";
        }

        if (progress >= 40) {
            return "Developing";
        }

        return "Beginner";
    };

    const getGapMessage = (skill, progress) => {
        const normalizedSkill =
            skill.skill.trim().toLowerCase();

        if (
            normalizedSkill === "java"
        ) {
            return "Continue the Java learning path to improve this skill.";
        }

        if (
            normalizedSkill === "javascript" ||
            normalizedSkill === "java script"
        ) {
            return "Continue the JavaScript learning path to improve this skill.";
        }

        if (progress === 0) {
            return "This skill has not been developed through the CareerOS learning system yet.";
        }

        return "Continue learning and practicing to improve this skill.";
    };

    const skillsWithProgress = skills.map((skill) => {
        const progress = getSkillProgress(skill);

        return {
            ...skill,
            displayProgress: progress,
            displayLevel: getSkillLevel(progress),
            gapMessage: getGapMessage(
                skill,
                progress
            ),
        };
    });

    const skillGaps = skillsWithProgress.filter(
        (skill) => skill.displayProgress < 40
    );

    const averageProgress =
        skillsWithProgress.length > 0
            ? Math.round(
                  skillsWithProgress.reduce(
                      (total, skill) =>
                          total +
                          skill.displayProgress,
                      0
                  ) / skillsWithProgress.length
              )
            : 0;

    const completedSkills =
        skillsWithProgress.filter(
            (skill) =>
                skill.displayProgress >= 100
        ).length;

    const recommendedSkills =
        skillsWithProgress.filter(
            (skill) => skill.is_recommended
        ).length;

    if (loading) {
        return (
            <div className="skill-page">
                <div className="skill-loading">
                    <div className="skill-spinner"></div>
                    <p>
                        Loading your skill profile...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="skill-page">
                <div className="skill-error">
                    <h2>
                        Unable to load skills
                    </h2>

                    <p>{error}</p>

                    <button
                        type="button"
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
        <div className="skill-page">
            <header className="skill-header">
                <button
                    type="button"
                    className="skill-back-button"
                    onClick={() =>
                        navigate("/")
                    }
                >
                    <ArrowLeft size={18} />
                    Dashboard
                </button>

                <div className="skill-header-content">
                    <div className="skill-header-icon">
                        <TrendingUp size={28} />
                    </div>

                    <div>
                        <p className="skill-eyebrow">
                            SKILL DEVELOPMENT
                        </p>

                        <h1>My Skills</h1>

                        <p className="skill-description">
                            Track your technical skills,
                            monitor your progress, and
                            identify areas for improvement.
                        </p>
                    </div>
                </div>
            </header>

            <section className="skill-summary">
                <div className="skill-summary-card">
                    <BookOpen size={22} />

                    <div>
                        <span>
                            Total Skills
                        </span>

                        <strong>
                            {skills.length}
                        </strong>
                    </div>
                </div>

                <div className="skill-summary-card">
                    <TrendingUp size={22} />

                    <div>
                        <span>
                            Average Progress
                        </span>

                        <strong>
                            {averageProgress}%
                        </strong>
                    </div>
                </div>

                <div className="skill-summary-card">
                    <CheckCircle2 size={22} />

                    <div>
                        <span>
                            Completed Skills
                        </span>

                        <strong>
                            {completedSkills}
                        </strong>
                    </div>
                </div>

                <div className="skill-summary-card">
                    <Sparkles size={22} />

                    <div>
                        <span>
                            Recommended
                        </span>

                        <strong>
                            {recommendedSkills}
                        </strong>
                    </div>
                </div>
            </section>

            <section className="skill-banner">
                <div className="skill-banner-icon">
                    <Award size={22} />
                </div>

                <div>
                    <h3>
                        Your Skill Profile
                    </h3>

                    <p>
                        Programming skill progress is
                        connected to your CareerOS learning
                        journey. Your skill gaps highlight
                        areas that need more learning and
                        practice.
                    </p>
                </div>
            </section>

            {/* =========================
                SKILL GAPS
            ========================= */}

            <section className="skill-list-section">
                <div className="skill-section-heading">
                    <div>
                        <p className="skill-eyebrow">
                            AREAS TO IMPROVE
                        </p>

                        <h2>
                            Skill Gaps
                        </h2>

                        <p>
                            Skills below 40% currently need
                            more learning and practice.
                        </p>
                    </div>
                </div>

                {skillGaps.length === 0 ? (
                    <div className="skill-empty">
                        <CheckCircle2 size={28} />

                        <h3>
                            No major skill gaps
                        </h3>

                        <p>
                            Your current skills are
                            progressing well.
                        </p>
                    </div>
                ) : (
                    <div className="skill-list">
                        {skillGaps.map((skill) => (
                            <div
                                className="skill-card"
                                key={`gap-${skill.id}`}
                            >
                                <div className="skill-card-top">
                                    <div>
                                        <h3>
                                            <AlertTriangle
                                                size={18}
                                                style={{
                                                    marginRight:
                                                        "8px",
                                                    verticalAlign:
                                                        "middle",
                                                }}
                                            />
                                            {skill.skill}
                                        </h3>

                                        <span>
                                            {
                                                skill.category
                                            }
                                        </span>
                                    </div>

                                    <strong>
                                        {
                                            skill.displayProgress
                                        }
                                        %
                                    </strong>
                                </div>

                                <div className="skill-progress-track">
                                    <div
                                        className="skill-progress-fill"
                                        style={{
                                            width: `${Math.min(
                                                Math.max(
                                                    skill.displayProgress,
                                                    0
                                                ),
                                                100
                                            )}%`,
                                        }}
                                    ></div>
                                </div>

                                <div className="skill-card-bottom">
                                    <span>
                                        Needs Improvement
                                    </span>

                                    <span>
                                        {
                                            skill.gapMessage
                                        }
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {skillGaps.length > 0 && (
                    <div
                        style={{
                            marginTop: "24px",
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/learning"
                                )
                            }
                            style={{
                                display: "inline-flex",
                                alignItems:
                                    "center",
                                gap: "8px",
                                padding:
                                    "12px 20px",
                                border: "none",
                                borderRadius:
                                    "10px",
                                cursor: "pointer",
                                fontWeight: "600",
                            }}
                        >
                            Continue Learning
                            <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </section>

            {/* =========================
                ALL SKILLS
            ========================= */}

            <section className="skill-list-section">
                <div className="skill-section-heading">
                    <div>
                        <p className="skill-eyebrow">
                            YOUR TECHNICAL SKILLS
                        </p>

                        <h2>
                            Skill Progress
                        </h2>

                        <p>
                            Monitor your current skill
                            development.
                        </p>
                    </div>
                </div>

                {skills.length === 0 ? (
                    <div className="skill-empty">
                        <BookOpen size={28} />

                        <h3>
                            No skills added yet
                        </h3>

                        <p>
                            Add skills to your resume
                            to build your skill profile.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/resume")
                            }
                        >
                            Go to Resume
                        </button>
                    </div>
                ) : (
                    <div className="skill-list">
                        {skillsWithProgress.map(
                            (skill) => (
                                <div
                                    className="skill-card"
                                    key={skill.id}
                                >
                                    <div className="skill-card-top">
                                        <div>
                                            <h3>
                                                {skill.skill}
                                            </h3>

                                            <span>
                                                {
                                                    skill.category
                                                }
                                            </span>
                                        </div>

                                        <strong>
                                            {
                                                skill.displayProgress
                                            }
                                            %
                                        </strong>
                                    </div>

                                    <div className="skill-progress-track">
                                        <div
                                            className="skill-progress-fill"
                                            style={{
                                                width: `${Math.min(
                                                    Math.max(
                                                        skill.displayProgress,
                                                        0
                                                    ),
                                                    100
                                                )}%`,
                                            }}
                                        ></div>
                                    </div>

                                    <div className="skill-card-bottom">
                                        <span>
                                            {
                                                skill.displayLevel
                                            }
                                        </span>

                                        <span>
                                            Source:{" "}
                                            {
                                                skill.source
                                            }
                                        </span>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}

export default SkillDevelopment;