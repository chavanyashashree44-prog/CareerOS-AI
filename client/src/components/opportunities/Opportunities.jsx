import { useEffect, useState } from "react";
import {
    Briefcase,
    MapPin,
    Calendar,
    ExternalLink,
    Sparkles,
    UserCheck,
} from "lucide-react";
import { supabase } from "../../config/supabase";
import "./Opportunities.css";

function Opportunities() {
    const [opportunities, setOpportunities] = useState([]);
    const [matchScores, setMatchScores] = useState({});
    const [profileMatches, setProfileMatches] = useState({});
    const [appliedOpportunities, setAppliedOpportunities] = useState(
        new Set()
    );

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [applicationError, setApplicationError] = useState("");
    const [applyingId, setApplyingId] = useState(null);

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const fetchOpportunities = async () => {
        try {
            setLoading(true);
            setError("");
            setApplicationError("");

            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                setError("Please log in to view opportunities.");
                return;
            }

            // ---------------------------------------------------------
            // 1. Fetch opportunities
            // ---------------------------------------------------------
            const {
                data: opportunitiesData,
                error: opportunitiesError,
            } = await supabase
                .from("opportunities")
                .select("*")
                .order("deadline", { ascending: true });

            if (opportunitiesError) {
                throw opportunitiesError;
            }

            // ---------------------------------------------------------
            // 2. Fetch current student's profile
            // ---------------------------------------------------------
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select(
                    "branch, degree, degree_start_year, graduation_year"
                )
                .eq("user_id", session.user.id)
                .maybeSingle();

            if (profileError) {
                throw profileError;
            }

            // ---------------------------------------------------------
            // 3. Fetch student's skills
            // ---------------------------------------------------------
            const { data: userSkills, error: skillsError } = await supabase
                .from("user_skills")
                .select("skill")
                .eq("user_id", session.user.id);

            if (skillsError) {
                throw skillsError;
            }

            const studentSkills = (userSkills || []).map((item) =>
                item.skill.toLowerCase().trim()
            );

            // ---------------------------------------------------------
            // 4. Calculate skill and profile matches
            // ---------------------------------------------------------
            const scores = {};
            const profileScoreMap = {};

            (opportunitiesData || []).forEach((opportunity) => {
                const requiredSkills = opportunity.required_skills || [];

                // Skill match
                const matchingSkills = requiredSkills.filter(
                    (requiredSkill) =>
                        studentSkills.includes(
                            requiredSkill.toLowerCase().trim()
                        )
                );

                const skillMatch =
                    requiredSkills.length > 0
                        ? Math.round(
                              (matchingSkills.length /
                                  requiredSkills.length) *
                                  100
                          )
                        : 0;

                scores[opportunity.id] = skillMatch;

                // -----------------------------------------------------
                // Profile eligibility
                // -----------------------------------------------------
                const eligibility = (
                    opportunity.eligibility || ""
                ).toLowerCase();

                const studentBranch = (
                    profile?.branch || ""
                ).toLowerCase();

                const graduationYear = Number(
                    profile?.graduation_year
                );

                const currentYear = new Date().getFullYear();

                const isStudent =
                    graduationYear > currentYear;

                const branchMatches =
                    !studentBranch ||
                    eligibility.includes(studentBranch);

                const acceptsStudents =
                    eligibility.includes("student");

                const acceptsGraduates =
                    eligibility.includes("graduate");

                let profileMatch = false;

                if (!eligibility) {
                    profileMatch = true;
                } else if (branchMatches) {
                    if (acceptsStudents && isStudent) {
                        profileMatch = true;
                    } else if (
                        acceptsGraduates &&
                        !isStudent
                    ) {
                        profileMatch = true;
                    } else if (
                        !acceptsStudents &&
                        !acceptsGraduates
                    ) {
                        profileMatch = true;
                    }
                }

                profileScoreMap[opportunity.id] = profileMatch;
            });

            // ---------------------------------------------------------
            // 5. Fetch application history
            // ---------------------------------------------------------
            const {
                data: applications,
                error: applicationsError,
            } = await supabase
                .from("applications")
                .select("opportunity_id, status")
                .eq("user_id", session.user.id);

            if (applicationsError) {
                throw applicationsError;
            }

            const appliedIds = new Set(
                (applications || [])
                    .filter(
                        (application) =>
                            application.status === "Applied"
                    )
                    .map(
                        (application) =>
                            application.opportunity_id
                    )
            );

            // ---------------------------------------------------------
            // 6. Sort personalized opportunities
            // ---------------------------------------------------------
            const sortedOpportunities = [
                ...(opportunitiesData || []),
            ].sort((a, b) => {
                const aProfile =
                    profileScoreMap[a.id] ? 1 : 0;

                const bProfile =
                    profileScoreMap[b.id] ? 1 : 0;

                if (aProfile !== bProfile) {
                    return bProfile - aProfile;
                }

                return (
                    (scores[b.id] || 0) -
                    (scores[a.id] || 0)
                );
            });

            setOpportunities(sortedOpportunities);
            setMatchScores(scores);
            setProfileMatches(profileScoreMap);
            setAppliedOpportunities(appliedIds);
        } catch (error) {
            console.error(
                "Error loading opportunities:",
                error
            );

            setError("Unable to load opportunities.");
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------
    // Format deadline
    // ---------------------------------------------------------
    const formatDeadline = (deadline) => {
        if (!deadline) {
            return "No deadline specified";
        }

        return new Date(deadline).toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );
    };

    // ---------------------------------------------------------
    // Track application
    // ---------------------------------------------------------
    const handleApply = async (opportunity) => {
        try {
            setApplyingId(opportunity.id);
            setApplicationError("");

            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                setApplicationError(
                    "Please log in to apply."
                );
                return;
            }

            if (
                appliedOpportunities.has(
                    opportunity.id
                )
            ) {
                if (opportunity.application_url) {
                    window.open(
                        opportunity.application_url,
                        "_blank",
                        "noopener,noreferrer"
                    );
                }

                return;
            }

            const { error } = await supabase
                .from("applications")
                .insert({
                    user_id: session.user.id,
                    opportunity_id: opportunity.id,
                    company: opportunity.company,
                    role: opportunity.title,
                    application_url:
                        opportunity.application_url,
                    status: "Applied",
                    applied_at: new Date()
                        .toISOString()
                        .split("T")[0],
                });

            if (error) {
                console.error(
                    "Error creating application:",
                    error
                );

                throw error;
            }

            setAppliedOpportunities((previous) => {
                const updated = new Set(previous);

                updated.add(opportunity.id);

                return updated;
            });

            if (opportunity.application_url) {
                window.open(
                    opportunity.application_url,
                    "_blank",
                    "noopener,noreferrer"
                );
            }
        } catch (error) {
            console.error(
                "Error creating application:",
                error
            );

            setApplicationError(
                "Unable to track your application. Please try again."
            );
        } finally {
            setApplyingId(null);
        }
    };

    // ---------------------------------------------------------
    // Loading
    // ---------------------------------------------------------
    if (loading) {
        return (
            <div className="opportunities-page">
                <div className="opportunities-loading">
                    Loading opportunities...
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------
    // Main page
    // ---------------------------------------------------------
    return (
        <div className="opportunities-page">
            <div className="opportunities-header">
                <div>
                    <h1>Opportunities</h1>

                    <p>
                        Explore jobs and internships
                        relevant to your career.
                    </p>
                </div>
            </div>

            {error && (
                <div className="opportunities-error">
                    {error}
                </div>
            )}

            {applicationError && (
                <div className="opportunities-error">
                    {applicationError}
                </div>
            )}

            {!error &&
                opportunities.length === 0 && (
                    <div className="opportunities-empty">
                        <Briefcase size={42} />

                        <h2>
                            No opportunities available yet
                        </h2>

                        <p>
                            New jobs and internships will
                            appear here when they are added
                            to CareerOS AI.
                        </p>
                    </div>
                )}

            {!error &&
                opportunities.length > 0 && (
                    <div className="opportunities-grid">
                        {opportunities.map(
                            (opportunity) => {
                                const matchPercentage =
                                    matchScores[
                                        opportunity.id
                                    ] || 0;

                                const profileMatch =
                                    profileMatches[
                                        opportunity.id
                                    ];

                                const isApplied =
                                    appliedOpportunities.has(
                                        opportunity.id
                                    );

                                const isApplying =
                                    applyingId ===
                                    opportunity.id;

                                return (
                                    <div
                                        className="opportunity-card"
                                        key={
                                            opportunity.id
                                        }
                                    >
                                        {/* Card top */}
                                        <div className="opportunity-card-top">
                                            <div className="opportunity-icon">
                                                <Briefcase
                                                    size={22}
                                                />
                                            </div>

                                            <span className="opportunity-type">
                                                {
                                                    opportunity.opportunity_type
                                                }
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h2>
                                            {
                                                opportunity.title
                                            }
                                        </h2>

                                        {/* Company */}
                                        <h3>
                                            {
                                                opportunity.company
                                            }
                                        </h3>

                                        {/* Skill match */}
                                        <div className="opportunity-match">
                                            <Sparkles
                                                size={16}
                                            />

                                            <span>
                                                {
                                                    matchPercentage
                                                }
                                                % skill match
                                            </span>
                                        </div>

                                        {/* Profile match */}
                                        {profileMatch && (
                                            <div className="opportunity-profile-match">
                                                <UserCheck
                                                    size={16}
                                                />

                                                <span>
                                                    Matches
                                                    your
                                                    profile
                                                </span>
                                            </div>
                                        )}

                                        {/* Location */}
                                        {opportunity.location && (
                                            <div className="opportunity-info">
                                                <MapPin
                                                    size={16}
                                                />

                                                <span>
                                                    {
                                                        opportunity.location
                                                    }

                                                    {opportunity.work_mode
                                                        ? ` • ${opportunity.work_mode}`
                                                        : ""}
                                                </span>
                                            </div>
                                        )}

                                        {/* Description */}
                                        {opportunity.description && (
                                            <p className="opportunity-description">
                                                {
                                                    opportunity.description
                                                }
                                            </p>
                                        )}

                                        {/* Required skills */}
                                        {opportunity
                                            .required_skills
                                            ?.length >
                                            0 && (
                                            <div className="opportunity-skills">
                                                {opportunity.required_skills.map(
                                                    (
                                                        skill,
                                                        index
                                                    ) => (
                                                        <span
                                                            key={
                                                                index
                                                            }
                                                        >
                                                            {
                                                                skill
                                                            }
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {/* Eligibility */}
                                        {opportunity.eligibility && (
                                            <p className="opportunity-eligibility">
                                                <strong>
                                                    Eligibility:
                                                </strong>{" "}
                                                {
                                                    opportunity.eligibility
                                                }
                                            </p>
                                        )}

                                        {/* Footer */}
                                        <div className="opportunity-footer">
                                            <div className="opportunity-deadline">
                                                <Calendar
                                                    size={
                                                        16
                                                    }
                                                />

                                                <span>
                                                    {formatDeadline(
                                                        opportunity.deadline
                                                    )}
                                                </span>
                                            </div>

                                            {opportunity.application_url && (
                                                <button
                                                    type="button"
                                                    className={`apply-button ${
                                                        isApplied
                                                            ? "applied-button"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        handleApply(
                                                            opportunity
                                                        )
                                                    }
                                                    disabled={
                                                        isApplying
                                                    }
                                                >
                                                    {isApplying
                                                        ? "Tracking..."
                                                        : isApplied
                                                        ? "Applied"
                                                        : "Apply"}

                                                    <ExternalLink
                                                        size={
                                                            15
                                                        }
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                )}
        </div>
    );
}

export default Opportunities;