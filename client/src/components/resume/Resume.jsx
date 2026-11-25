import { useEffect, useState } from "react";
import "../../App.css";

import {
    LayoutDashboard,
    UserRound,
    FileText,
    BriefcaseBusiness,
    Video,
    Brain,
    MessageCircle,
    Settings,
    Bell,
    Search,
    ChevronRight,
    Sparkles,
    Target,
    Upload,
    Plus,
    CheckCircle2,
    Pencil,
    GraduationCap,
    Award,
    Trophy,
    FolderKanban,
    Code2,
    Printer,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../../config/supabase";

import ThemeSwitcher from "../ThemeSwitcher";

import "./Resume.css";

function Resume() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);

    const [resume, setResume] = useState(null);
    const [education, setEducation] = useState([]);
    const [skills, setSkills] = useState([]);
    const [projects, setProjects] = useState([]);
    const [experience, setExperience] = useState([]);
    const [certifications, setCertifications] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [analysis, setAnalysis] = useState(null);

    const [loading, setLoading] = useState(true);
const [errorMessage, setErrorMessage] = useState("");



    // =====================================================
    // LOAD PROFILE + SAVED RESUME
    // =====================================================

    useEffect(() => {
        loadResumeData();
    }, []);

    const loadResumeData = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw userError;
            }

            if (!user) {
                navigate("/login");
                return;
            }

            // -------------------------------------------------
            // PROFILE
            // -------------------------------------------------

            const {
                data: profileData,
                error: profileError,
            } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (profileError) {
                throw profileError;
            }

            setProfile(profileData);

            // -------------------------------------------------
            // MAIN RESUME
            // -------------------------------------------------

            const {
                data: resumeData,
                error: resumeError,
            } = await supabase
                .from("resumes")
                .select(
                    "id, user_id, summary, phone, location, linkedin, github, created_at, updated_at"
                )
                .eq("user_id", user.id)
                .maybeSingle();

            if (resumeError) {
                throw resumeError;
            }

            setResume(resumeData);

            // -------------------------------------------------
            // NO RESUME YET
            // -------------------------------------------------

            if (!resumeData) {
                setLoading(false);
                return;
            }

            // -------------------------------------------------
            // LOAD RELATED RESUME DATA
            // -------------------------------------------------

            const [
                educationResponse,
                skillsResponse,
                projectsResponse,
                experienceResponse,
                certificationsResponse,
                achievementsResponse,
                analysisResponse,
            ] = await Promise.all([
                supabase
                    .from("resume_education")
                    .select("*")
                    .eq("resume_id", resumeData.id)
                    .order("id", { ascending: true }),

                supabase
                    .from("resume_skills")
                    .select("*")
                    .eq("resume_id", resumeData.id)
                    .order("id", { ascending: true }),

                supabase
                    .from("resume_projects")
                    .select("*")
                    .eq("resume_id", resumeData.id)
                    .order("id", { ascending: true }),

                supabase
                    .from("resume_experience")
                    .select("*")
                    .eq("resume_id", resumeData.id)
                    .order("id", { ascending: true }),

                supabase
                    .from("resume_certifications")
                    .select("*")
                    .eq("resume_id", resumeData.id)
                    .order("id", { ascending: true }),

                supabase
                    .from("resume_achievements")
                    .select("*")
                    .eq("resume_id", resumeData.id)
                    .order("id", { ascending: true }),

                supabase
                    .from("resume_analysis")
                    .select("id, resume_id, ats_score, strengths, skill_gaps, suggestions, keyword_analysis, analyzed_at, created_at, updated_at")
                    .eq("resume_id", resumeData.id)
                    .maybeSingle(),
            ]);

            // -------------------------------------------------
            // CHECK RELATED DATA ERRORS
            // -------------------------------------------------

            if (educationResponse.error) {
                throw educationResponse.error;
            }

            if (skillsResponse.error) {
                throw skillsResponse.error;
            }

            if (projectsResponse.error) {
                throw projectsResponse.error;
            }

            if (experienceResponse.error) {
                throw experienceResponse.error;
            }

            if (certificationsResponse.error) {
                throw certificationsResponse.error;
            }

            if (achievementsResponse.error) {
                throw achievementsResponse.error;
            }

            if (analysisResponse.error) {
                throw analysisResponse.error;
            }

            // -------------------------------------------------
            // SAVE RELATED DATA TO STATE
            // -------------------------------------------------

            setEducation(educationResponse.data || []);
            setSkills(skillsResponse.data || []);
            setProjects(projectsResponse.data || []);
            setExperience(experienceResponse.data || []);
            setCertifications(certificationsResponse.data || []);
            setAchievements(achievementsResponse.data || []);

            const savedAnalysis = analysisResponse.data;

            const parseAnalysisArray = (value) => {
                if (Array.isArray(value)) {
                    return value;
                }

                if (typeof value !== "string" || !value.trim()) {
                    return [];
                }

                try {
                    const parsed = JSON.parse(value);
                    return Array.isArray(parsed) ? parsed : [];
                } catch (error) {
                    return [value];
                }
            };

            if (savedAnalysis) {
                setAnalysis({
                    ...savedAnalysis,
                    strengths: parseAnalysisArray(savedAnalysis.strengths),
                    skill_gaps: parseAnalysisArray(savedAnalysis.skill_gaps),
                    suggestions: parseAnalysisArray(savedAnalysis.suggestions),
                    keyword_analysis: parseAnalysisArray(savedAnalysis.keyword_analysis),
                });
            } else {
                setAnalysis(null);
            }
        } catch (error) {
            console.error("Resume page error:", error);

            setErrorMessage(
                error?.message || "Unable to load resume."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // RESUME ANALYSIS
    // =====================================================

    const handleAnalyzeResume = async () => {
        try {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
                throw sessionError;
            }

            if (!session?.access_token) {
                throw new Error("No active Supabase session found.");
            }

            const response = await fetch(
                "http://localhost:5000/api/resume-analysis",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result?.message ||
                        "Resume analysis request failed."
                );
            }

            console.log("AI Resume Analysis Result:", result);

            setAnalysis(result?.data?.analysis || null);

            alert("Resume analyzed successfully!");
        } catch (error) {
            console.error("AI Resume Analysis Error:", error);
            alert(error?.message || "Unable to analyze resume.");
        }
    };

    
    // USER INFORMATION
    // =====================================================

    const fullName =
        profile?.full_name || "Student";

    const firstName =
        fullName.trim().split(" ")[0] || "Student";

    const branch =
        profile?.branch || "";

    const branchLabel =
        branch
            ? `${branch} Student`
            : "Student";

    const avatarInitial =
        firstName.charAt(0).toUpperCase();

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "Not available";
        }

        return new Date(dateValue).toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );
    };

    // =====================================================
    // NAVIGATION
    // =====================================================

    const handleCreateResume = () => {
        navigate("/resume/create");
    };

    // =====================================================
    // PRINT / SAVE RESUME AS PDF
    // =====================================================

    const handlePrintResume = () => {
        window.print();
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="app">
                <main className="main">
                    <section className="resume-content">
                        <div className="resume-page-header">
                            <div>
                                <p className="resume-eyebrow">
                                    AI RESUME
                                </p>

                                <h1>
                                    Loading your resume...
                                </h1>

                                <p className="resume-description">
                                    Fetching your saved CareerOS AI resume.
                                </p>
                            </div>

                            <div className="resume-header-icon">
                                <FileText size={30} />
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    // =====================================================
    // MAIN UI
    // =====================================================

    return (
        <div className="app">

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="sidebar">

                <div className="logo-section">

                    <div className="logo-icon">
                        <Sparkles size={20} />
                    </div>

                    <div>
                        <h2>
                            CareerOS
                        </h2>

                        <span>
                            AI Career Intelligence
                        </span>
                    </div>

                </div>

                <nav className="navigation">

                    <p className="nav-title">
                        WORKSPACE
                    </p>

                    <a
                        className="nav-item"
                        href="/"
                    >
                        <LayoutDashboard size={18} />
                        <span>Overview</span>
                    </a>

                    <a
                        className="nav-item"
                        href="/profile"
                    >
                        <UserRound size={18} />
                        <span>My Profile</span>
                    </a>

                    <a
                        className="nav-item active"
                        href="/resume"
                    >
                        <FileText size={18} />
                        <span>AI Resume</span>
                    </a>

                    <a className="nav-item">
                        <BriefcaseBusiness size={18} />
                        <span>Opportunities</span>
                    </a>

                    <p className="nav-title">
                        GROWTH
                    </p>

                    <a className="nav-item">
                        <Target size={18} />
                        <span>Skill Development</span>
                    </a>

                    <a className="nav-item">
                        <Video size={18} />
                        <span>Interview Studio</span>
                    </a>

                    <a className="nav-item">
                        <Brain size={18} />
                        <span>Aptitude</span>
                    </a>

                    <a className="nav-item">
                        <MessageCircle size={18} />
                        <span>AI Mentor</span>
                    </a>

                    <p className="nav-title">
                        SYSTEM
                    </p>

                    <a className="nav-item">
                        <Settings size={18} />
                        <span>Settings</span>
                    </a>

                </nav>

                <div className="sidebar-bottom">

                    <div className="ai-mini-card">

                        <div className="ai-mini-icon">
                            <Sparkles size={16} />
                        </div>

                        <div>
                            <strong>
                                Career Intelligence
                            </strong>

                            <p>
                                Your AI career companion
                            </p>
                        </div>

                    </div>

                    <div className="user-mini">

                        <div className="avatar">
                            {avatarInitial}
                        </div>

                        <div className="user-info">

                            <strong>
                                {fullName}
                            </strong>

                            <span>
                                {branchLabel}
                            </span>

                        </div>

                        <ChevronRight size={15} />

                    </div>

                </div>

            </aside>

            {/* =================================================
                MAIN
            ================================================= */}

            <main className="main">

                {/* =================================================
                    TOPBAR
                ================================================= */}

                <header className="topbar">

                    <div className="mobile-brand">

                        <div className="logo-icon">
                            <Sparkles size={17} />
                        </div>

                        <strong>
                            CareerOS
                        </strong>

                    </div>

                    <div className="search-box">

                        <Search size={17} />

                        <input
                            type="text"
                            placeholder="Search jobs, skills, courses, or anything..."
                        />

                        <kbd>
                            Ctrl&nbsp;&nbsp;K
                        </kbd>

                    </div>

                    <div className="top-actions">

                        <ThemeSwitcher />

                        <button className="icon-button">
                            <Bell size={18} />
                            <span className="notification-dot" />
                        </button>

                        <div className="top-profile">

                            <div className="top-avatar">
                                {avatarInitial}
                            </div>

                            <div className="top-profile-info">

                                <strong>
                                    {fullName}
                                </strong>

                                <span>
                                    {branchLabel}
                                </span>

                            </div>

                            <ChevronRight size={15} />

                        </div>

                    </div>

                </header>

                {/* =================================================
                    RESUME CONTENT
                ================================================= */}

                <section className="resume-content">

                    {/* PAGE HEADER */}

                    <div className="resume-page-header">

                        <div>

                            <p className="resume-eyebrow">
                                AI RESUME
                            </p>

                            <h1>
                                Your Career Resume
                            </h1>

                            <p className="resume-description">
                                Manage your saved resume and prepare it
                                for AI analysis, ATS scoring, and career
                                recommendations.
                            </p>

                        </div>

                        <div
                            className="resume-header-actions"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                            }}
                        >
                            <button
                                type="button"
                                className="resume-secondary-button no-print"
                                onClick={handlePrintResume}
                                disabled={!resume}
                            >
                                <Printer size={17} />
                                Print / Save PDF
                            </button>

                            <div className="resume-header-icon">
                                <FileText size={30} />
                            </div>
                        </div>

                    </div>

                    {/* ERROR */}

                    {errorMessage && (
                        <div className="resume-ai-banner">

                            <div className="resume-ai-icon">
                                <FileText size={21} />
                            </div>

                            <div>

                                <span>
                                    RESUME ERROR
                                </span>

                                <h3>
                                    Unable to load some resume data.
                                </h3>

                                <p>
                                    {errorMessage}
                                </p>

                            </div>

                        </div>
                    )}

                    {/* =================================================
                        SAVED RESUME STATUS
                    ================================================= */}

                    {resume ? (

                        <div className="resume-ai-banner">

                            <div className="resume-ai-icon">
                                <CheckCircle2 size={21} />
                            </div>

                            <div style={{ flex: 1 }}>

                                <span>
                                    RESUME READY
                                </span>

                                <h3>
                                    Your resume is saved successfully.
                                </h3>

                                <p>
                                    Last updated on{" "}
                                    <strong>
                                        {formatDate(
                                            resume.updated_at ||
                                            resume.created_at
                                        )}
                                    </strong>
                                    .
                                </p>

                            </div>

                            <button
                                className="resume-primary-button"
                                onClick={handleCreateResume}
                            >
                                <Pencil size={17} />
                                Edit Resume
                            </button>

                            <button
                                    className="resume-secondary-button"
                                    onClick={handleAnalyzeResume}
                                >
                                    <Sparkles size={17} />
                                    Analyze Resume
                                </button> 




                        </div>

                    ) : (

                        <div className="resume-ai-banner">

                            <div className="resume-ai-icon">
                                <Sparkles size={21} />
                            </div>

                            <div>
                                <span>
                                    RESUME STATUS
                                </span>

                                <h3>
                                    Your resume has not been created yet.
                                </h3>

                                <p>
                                    Create your resume to unlock resume
                                    analysis and career intelligence.
                                </p>
                            </div>

                        </div>

                    )}



                                    

                    
                    
                    {/* =================================================
                        ATS SCORE
                    ================================================= */}

                    {resume && (
                        <div className="resume-benefits-panel">

                            <div className="resume-benefits-header">

                                <div>

                                    <p className="resume-eyebrow">
                                        RESUME INTELLIGENCE
                                    </p>

                                    <h2>
                                        ATS Score
                                    </h2>

                                </div>

                                <Target size={21} />

                            </div>

                            {analysis?.ats_score !== null &&
                            analysis?.ats_score !== undefined ? (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "18px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "42px",
                                            fontWeight: "800",
                                            lineHeight: "1",
                                        }}
                                    >
                                        {analysis.ats_score}
                                        <span
                                            style={{
                                                fontSize: "18px",
                                                fontWeight: "600",
                                                opacity: 0.6,
                                            }}
                                        >
                                            /100
                                        </span>
                                    </div>

                                    <div>
                                        <strong>
                                            AI-generated ATS readiness score
                                        </strong>

                                        <p style={{ margin: "6px 0 0", lineHeight: "1.6" }}>
                                            Based on the resume information currently saved in CareerOS AI.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ margin: 0, lineHeight: "1.7" }}>
                                    Click <strong>Analyze Resume</strong> to generate your ATS score.
                                </p>
                            )}

                        </div>
                    )}

                    {/* =================================================
                        AI IMPROVEMENT SUGGESTIONS
                    ================================================= */}

                    {resume && analysis?.suggestions?.length > 0 && (
                        <div className="resume-benefits-panel">

                            <div className="resume-benefits-header">

                                <div>
                                    <p className="resume-eyebrow">
                                        AI IMPROVEMENT SUGGESTIONS
                                    </p>

                                    <h2>
                                        How to Improve Your Resume
                                    </h2>
                                </div>

                                <Sparkles size={21} />

                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "14px",
                                }}
                            >
                                {analysis.suggestions.map((suggestion, index) => (
                                    <div
                                        className="resume-benefit"
                                        key={`suggestion-${index}`}
                                    >
                                        <CheckCircle2 size={18} />

                                        <div>
                                            <strong>
                                                Improvement {index + 1}
                                            </strong>

                                            <span>
                                                {suggestion}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    )}

                    {/* =================================================
                        SAVED RESUME DETAILS
                    ================================================= */}

                    {resume && (

                        <>

                            {/* PERSONAL DETAILS */}

                            <div className="resume-benefits-panel">

                                <div className="resume-benefits-header">

                                    <div>

                                        <p className="resume-eyebrow">
                                            PERSONAL INFORMATION
                                        </p>

                                        <h2>
                                            {fullName}
                                        </h2>

                                    </div>

                                    <UserRound size={21} />

                                </div>

                                <div className="resume-benefits-grid">

                                    <div className="resume-benefit">

                                        <FileText size={18} />

                                        <div>

                                            <strong>
                                                Email
                                            </strong>

                                            <span>
                                                {profile?.email ||
                                                    "Not added"}
                                            </span>

                                        </div>

                                    </div>

                                    <div className="resume-benefit">

                                        <FileText size={18} />

                                        <div>

                                            <strong>
                                                Phone
                                            </strong>

                                            <span>
                                                {resume.phone ||
                                                    "Not added"}
                                            </span>

                                        </div>

                                    </div>

                                    <div className="resume-benefit">

                                        <Target size={18} />

                                        <div>

                                            <strong>
                                                Location
                                            </strong>

                                            <span>
                                                {resume.location ||
                                                    "Not added"}
                                            </span>

                                        </div>

                                    </div>

                                    <div className="resume-benefit">

                                        <Target size={18} />

                                        <div>

                                            <strong>
                                                Branch
                                            </strong>

                                            <span>
                                                {profile?.branch ||
                                                    "Not added"}
                                            </span>

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* SUMMARY */}

                            <div className="resume-benefits-panel">

                                <div className="resume-benefits-header">

                                    <div>

                                        <p className="resume-eyebrow">
                                            PROFESSIONAL SUMMARY
                                        </p>

                                        <h2>
                                            About You
                                        </h2>

                                    </div>

                                    <FileText size={21} />

                                </div>

                                <p
                                    style={{
                                        margin: "0",
                                        lineHeight: "1.7",
                                    }}
                                >
                                    {resume.summary ||
                                        "No professional summary added yet."}
                                </p>

                            </div>

                            {/* =================================================
                                TECHNICAL SKILLS
                            ================================================= */}

                            <div className="resume-benefits-panel">

                                <div className="resume-benefits-header">

                                    <div>

                                        <p className="resume-eyebrow">
                                            TECHNICAL SKILLS
                                        </p>

                                        <h2>
                                            Skills & Technologies
                                        </h2>

                                    </div>

                                    <Code2 size={21} />

                                </div>

                                {skills.length > 0 ? (

                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "10px",
                                        }}
                                    >

                                        {skills.map((item) => (

                                            <span
                                                key={item.id}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    padding: "9px 14px",
                                                    borderRadius: "999px",
                                                    border: "1px solid rgba(99, 102, 241, 0.16)",
                                                    background: "rgba(99, 102, 241, 0.08)",
                                                    fontSize: "13px",
                                                    fontWeight: "600",
                                                    lineHeight: "1",
                                                }}
                                            >
                                                {item.skill}
                                            </span>

                                        ))}

                                    </div>

                                ) : (

                                    <p>
                                        No technical skills added yet.
                                    </p>

                                )}

                            </div>

                            {/* EDUCATION */}

                            <div className="resume-benefits-panel">

                                <div className="resume-benefits-header">

                                    <div>

                                        <p className="resume-eyebrow">
                                            EDUCATION
                                        </p>

                                        <h2>
                                            Academic Background
                                        </h2>

                                    </div>

                                    <GraduationCap size={21} />

                                </div>

                                {education.length > 0 ? (

                                    <div className="resume-benefits-grid">

                                        {education.map((item) => (

                                            <div
                                                className="resume-benefit"
                                                key={item.id}
                                            >

                                                <GraduationCap size={18} />

                                                <div>

                                                    <strong>
                                                        {item.degree ||
                                                            "Degree"}
                                                    </strong>

                                                    <span>
                                                        {item.college ||
                                                            "College not added"}
                                                    </span>

                                                    <span>
                                                        {item.branch
                                                            ? `${item.branch} • `
                                                            : ""}
                                                        {item.start_year ||
                                                            "Start year"}{" "}
                                                        -{" "}
                                                        {item.graduation_year ||
                                                            "Graduation year"}
                                                    </span>

                                                </div>

                                            </div>

                                        ))}

                                    </div>

                                ) : (

                                    <p>
                                        No education information saved.
                                    </p>

                                )}

                            </div>

                            {/* PROJECTS */}

                            <div className="resume-benefits-panel">

                                <div className="resume-benefits-header">

                                    <div>

                                        <p className="resume-eyebrow">
                                            PROJECTS
                                        </p>

                                        <h2>
                                            Technical Projects
                                        </h2>

                                    </div>

                                    <FolderKanban size={21} />

                                </div>

                                {projects.length > 0 ? (

                                    <div className="resume-benefits-grid">

                                        {projects.map((project) => (

                                            <div
                                                className="resume-benefit"
                                                key={project.id}
                                            >

                                                <FolderKanban size={18} />

                                                <div>

                                                    <strong>
                                                        {project.name ||
                                                            "Untitled Project"}
                                                    </strong>

                                                    <span>
                                                        {project.description ||
                                                            "No description added."}
                                                    </span>

                                                    {project.technologies && (
                                                        <span>
                                                            Technologies:{" "}
                                                            {project.technologies}
                                                        </span>
                                                    )}

                                                </div>

                                            </div>

                                        ))}

                                    </div>

                                ) : (

                                    <p>
                                        No projects added yet.
                                    </p>

                                )}

                            </div>

                            {/* EXPERIENCE */}

                            <div className="resume-benefits-panel">

                                <div className="resume-benefits-header">

                                    <div>

                                        <p className="resume-eyebrow">
                                            EXPERIENCE
                                        </p>

                                        <h2>
                                            Professional Experience
                                        </h2>

                                    </div>

                                    <BriefcaseBusiness size={21} />

                                </div>

                                {experience.length > 0 ? (

                                    <div className="resume-benefits-grid">

                                        {experience.map((item) => (

                                            <div
                                                className="resume-benefit"
                                                key={item.id}
                                            >

                                                <BriefcaseBusiness size={18} />

                                                <div>

                                                    <strong>
                                                        {item.role ||
                                                            "Role"}
                                                    </strong>

                                                    <span>
                                                        {item.company ||
                                                            "Company"}
                                                    </span>

                                                    <span>
                                                        {item.start_date
                                                            ? formatDate(
                                                                  item.start_date
                                                              )
                                                            : "Start date"}{" "}
                                                        -{" "}
                                                        {item.end_date
                                                            ? formatDate(
                                                                  item.end_date
                                                              )
                                                            : "Present"}
                                                    </span>

                                                    {item.description && (
                                                        <span>
                                                            {item.description}
                                                        </span>
                                                    )}

                                                </div>

                                            </div>

                                        ))}

                                    </div>

                                ) : (

                                    <p>
                                        No experience added yet.
                                    </p>

                                )}

                            </div>

                            {/* CERTIFICATIONS */}

                            <div className="resume-benefits-panel">

                                <div className="resume-benefits-header">

                                    <div>

                                        <p className="resume-eyebrow">
                                            CERTIFICATIONS
                                        </p>

                                        <h2>
                                            Credentials
                                        </h2>

                                    </div>

                                    <Award size={21} />

                                </div>

                                {certifications.length > 0 ? (

                                    <div className="resume-benefits-grid">

                                        {certifications.map(
                                            (item) => (

                                                <div
                                                    className="resume-benefit"
                                                    key={item.id}
                                                >

                                                    <Award size={18} />

                                                    <div>

                                                        <strong>
                                                            {item.name ||
                                                                "Certification"}
                                                        </strong>

                                                        <span>
                                                            {item.issuer ||
                                                                "Issuing organization"}
                                                        </span>

                                                        {item.year && (
                                                            <span>
                                                                {item.year}
                                                            </span>
                                                        )}

                                                    </div>

                                                </div>

                                            )
                                        )}

                                    </div>

                                ) : (

                                    <p>
                                        No certifications added yet.
                                    </p>

                                )}

                            </div>

                            {/* ACHIEVEMENTS */}

                            <div className="resume-benefits-panel">

                                <div className="resume-benefits-header">

                                    <div>

                                        <p className="resume-eyebrow">
                                            ACHIEVEMENTS
                                        </p>

                                        <h2>
                                            Highlights
                                        </h2>

                                    </div>

                                    <Trophy size={21} />

                                </div>

                                {achievements.length > 0 ? (

                                    <div className="resume-benefits-grid">

                                        {achievements.map(
                                            (item) => (

                                                <div
                                                    className="resume-benefit"
                                                    key={item.id}
                                                >

                                                    <Trophy size={18} />

                                                    <div>

                                                        <strong>
                                                            {item.title ||
                                                                "Achievement"}
                                                        </strong>

                                                        <span>
                                                            {item.description ||
                                                                "No description added."}
                                                        </span>

                                                    </div>

                                                </div>

                                            )
                                        )}

                                    </div>

                                ) : (

                                    <p>
                                        No achievements added yet.
                                    </p>

                                )}

                            </div>

                        </>

                    )}

                    {/* =================================================
                        ACTION CARDS
                    ================================================= */}

                    <div className="resume-options-grid">

                        {/* CREATE / EDIT */}

                        <div className="resume-action-card">

                            <div className="resume-action-icon create">
                                {resume ? (
                                    <Pencil size={25} />
                                ) : (
                                    <Plus size={25} />
                                )}
                            </div>

                            <div className="resume-action-content">

                                <span className="resume-card-label">
                                    {resume
                                        ? "UPDATE YOUR RESUME"
                                        : "START FRESH"}
                                </span>

                                <h2>
                                    {resume
                                        ? "Edit Resume"
                                        : "Create New Resume"}
                                </h2>

                                <p>
                                    {resume
                                        ? "Update your profile information, projects, experience, certifications, and achievements."
                                        : "Build your resume step by step using your profile, education, projects, experience, and achievements."}
                                </p>

                                <button
                                    className="resume-primary-button"
                                    onClick={handleCreateResume}
                                >
                                    {resume ? (
                                        <Pencil size={17} />
                                    ) : (
                                        <Plus size={17} />
                                    )}

                                    {resume
                                        ? "Edit Resume"
                                        : "Create Resume"}
                                </button>

                            </div>

                        </div>

                        {/* UPLOAD */}

                        <div className="resume-action-card">

                            <div className="resume-action-icon upload">
                                <Upload size={25} />
                            </div>

                            <div className="resume-action-content">

                                <span className="resume-card-label">
                                    ALREADY HAVE ONE?
                                </span>

                                <h2>
                                    Upload Existing Resume
                                </h2>

                                <p>
                                    Upload your PDF or DOCX resume and
                                    CareerOS AI will analyze its content,
                                    structure, skills, and ATS readiness.
                                </p>

                                <button
                                    className="resume-secondary-button"
                                    disabled
                                >
                                    <Upload size={17} />
                                    Upload Resume
                                </button>

                            </div>

                        </div>

                    </div>

                    {/* =================================================
                        WHAT CAREEROS WILL DO
                    ================================================= */}

                    <div className="resume-benefits-panel">

                        <div className="resume-benefits-header">

                            <div>

                                <p className="resume-eyebrow">
                                    RESUME INTELLIGENCE
                                </p>

                                <h2>
                                    What CareerOS will help you with
                                </h2>

                            </div>

                            <Sparkles size={21} />

                        </div>

                        <div className="resume-benefits-grid">

                            <div className="resume-benefit">

                                <CheckCircle2 size={18} />

                                <div>

                                    <strong>
                                        ATS Score
                                    </strong>

                                    <span>
                                        Understand how well your resume
                                        performs against ATS systems.
                                    </span>

                                </div>

                            </div>

                            <div className="resume-benefit">

                                <CheckCircle2 size={18} />

                                <div>

                                    <strong>
                                        AI Suggestions
                                    </strong>

                                    <span>
                                        Get actionable improvements for
                                        your resume content.
                                    </span>

                                </div>

                            </div>

                            <div className="resume-benefit">

                                <CheckCircle2 size={18} />

                                <div>

                                    <strong>
                                        Skill Analysis
                                    </strong>

                                    <span>
                                        Identify strengths and important
                                        skills missing from your resume.
                                    </span>

                                </div>

                            </div>

                            <div className="resume-benefit">

                                <CheckCircle2 size={18} />

                                <div>

                                    <strong>
                                        Keyword Analysis
                                    </strong>

                                    <span>
                                        Find relevant placement and role
                                        keywords to strengthen your resume.
                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>

                    {/* =================================================
                        PRINTABLE RESUME
                    ================================================= */}

                    {resume && (
                        <section className="resume-printable">
                            <div className="print-resume-header">
                                <h1>{fullName}</h1>

                                <p>
                                    {profile?.email || ""}
                                    {resume.phone ? ` • ${resume.phone}` : ""}
                                    {resume.location ? ` • ${resume.location}` : ""}
                                </p>

                                {(resume.linkedin || resume.github) && (
                                    <p>
                                        {resume.linkedin || ""}
                                        {resume.linkedin && resume.github ? " • " : ""}
                                        {resume.github || ""}
                                    </p>
                                )}
                            </div>

                            {resume.summary && (
                                <div className="print-resume-section">
                                    <h2>Professional Summary</h2>
                                    <p>{resume.summary}</p>
                                </div>
                            )}

                            {skills.length > 0 && (
                                <div className="print-resume-section">
                                    <h2>Technical Skills</h2>
                                    <p>
                                        {skills
                                            .map((item) => item.skill)
                                            .filter(Boolean)
                                            .join(" • ")}
                                    </p>
                                </div>
                            )}

                            {education.length > 0 && (
                                <div className="print-resume-section">
                                    <h2>Education</h2>
                                    {education.map((item) => (
                                        <div className="print-resume-entry" key={item.id}>
                                            <strong>{item.degree || "Degree"}</strong>
                                            <span>
                                                {item.college || "College not added"}
                                                {item.branch ? ` • ${item.branch}` : ""}
                                            </span>
                                            <span>
                                                {item.start_year || ""}
                                                {item.start_year || item.graduation_year ? " – " : ""}
                                                {item.graduation_year || ""}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {projects.length > 0 && (
                                <div className="print-resume-section">
                                    <h2>Projects</h2>
                                    {projects.map((project) => (
                                        <div className="print-resume-entry" key={project.id}>
                                            <strong>{project.name || "Untitled Project"}</strong>
                                            {project.technologies && (
                                                <span>{project.technologies}</span>
                                            )}
                                            {project.description && (
                                                <p>{project.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {experience.length > 0 && (
                                <div className="print-resume-section">
                                    <h2>Experience</h2>
                                    {experience.map((item) => (
                                        <div className="print-resume-entry" key={item.id}>
                                            <strong>
                                                {item.role || "Role"}
                                                {item.company ? ` • ${item.company}` : ""}
                                            </strong>
                                            <span>
                                                {item.start_date ? formatDate(item.start_date) : ""}
                                                {item.start_date || item.end_date ? " – " : ""}
                                                {item.end_date ? formatDate(item.end_date) : "Present"}
                                            </span>
                                            {item.description && (
                                                <p>{item.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {certifications.length > 0 && (
                                <div className="print-resume-section">
                                    <h2>Certifications</h2>
                                    {certifications.map((item) => (
                                        <div className="print-resume-entry" key={item.id}>
                                            <strong>{item.name || "Certification"}</strong>
                                            <span>
                                                {item.issuer || ""}
                                                {item.year ? ` • ${item.year}` : ""}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {achievements.length > 0 && (
                                <div className="print-resume-section">
                                    <h2>Achievements</h2>
                                    {achievements.map((item) => (
                                        <div className="print-resume-entry" key={item.id}>
                                            <strong>{item.title || "Achievement"}</strong>
                                            {item.description && (
                                                <p>{item.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    <style>{`
                        .resume-printable {
                            display: none;
                        }

                        @media print {
                            @page {
                                size: A4;
                                margin: 14mm;
                            }

                            body {
                                background: #ffffff !important;
                            }

                            .sidebar,
                            .topbar,
                            .resume-page-header,
                            .resume-ai-banner,
                            .resume-options-grid,
                            .resume-benefits-panel,
                            .resume-footer,
                            .no-print {
                                display: none !important;
                            }

                            .app,
                            .main,
                            .resume-content {
                                display: block !important;
                                width: 100% !important;
                                max-width: none !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                background: #ffffff !important;
                                box-shadow: none !important;
                            }

                            .resume-printable {
                                display: block !important;
                                color: #111827 !important;
                                background: #ffffff !important;
                                font-family: Arial, Helvetica, sans-serif;
                                font-size: 10.5pt;
                                line-height: 1.45;
                            }

                            .print-resume-header {
                                text-align: center;
                                border-bottom: 2px solid #111827;
                                padding-bottom: 10px;
                                margin-bottom: 16px;
                            }

                            .print-resume-header h1 {
                                margin: 0 0 5px;
                                font-size: 24pt;
                                line-height: 1.1;
                            }

                            .print-resume-header p {
                                margin: 3px 0;
                                font-size: 9.5pt;
                            }

                            .print-resume-section {
                                margin-bottom: 13px;
                                page-break-inside: avoid;
                            }

                            .print-resume-section h2 {
                                margin: 0 0 6px;
                                padding-bottom: 3px;
                                border-bottom: 1px solid #9ca3af;
                                font-size: 12pt;
                                text-transform: uppercase;
                                letter-spacing: 0.04em;
                            }

                            .print-resume-section p {
                                margin: 3px 0;
                            }

                            .print-resume-entry {
                                margin-bottom: 8px;
                                page-break-inside: avoid;
                            }

                            .print-resume-entry strong,
                            .print-resume-entry span {
                                display: block;
                            }

                            .print-resume-entry strong {
                                font-size: 10.5pt;
                            }

                            .print-resume-entry span {
                                font-size: 9.5pt;
                            }

                            .print-resume-entry p {
                                margin: 3px 0 0;
                            }
                        }
                    `}</style>

                    {/* =================================================
                        FOOTER
                    ================================================= */}

                    <footer className="resume-footer">

                        <span>
                            CareerOS AI v1.0
                        </span>

                        <span>
                            Building brighter futures ✦
                        </span>

                    </footer>

                </section>

            </main>

        </div>
    );
}

export default Resume;