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
    TrendingUp,
    CheckCircle2,
    ArrowUpRight,
    Zap,
} from "lucide-react";

import { supabase } from "../../config/supabase";

import ThemeSwitcher from "../ThemeSwitcher";


function Dashboard() {
    

    // =========================
    // USER PROFILE STATE
    // =========================

    const [profile, setProfile] = useState(null);

    const [loading, setLoading] = useState(true);

    const [profileError, setProfileError] = useState("");


    // =========================
    // CURRENT TIME STATE
    // =========================

    const [currentTime, setCurrentTime] = useState(
        new Date()
    );


    // =========================
    // FETCH USER PROFILE
    // =========================

    useEffect(() => {

        const fetchProfile = async () => {

            try {

                setLoading(true);

                setProfileError("");


                // Get logged-in user

                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();


                if (userError) {
                    throw userError;
                }


                if (!user) {

                    setProfileError(
                        "No user is currently logged in."
                    );

                    return;
                }


                console.log(
                    "Dashboard logged-in user:",
                    user.id
                );


                // Get user's CareerOS profile

                const {
                    data,
                    error: profileFetchError,
                } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("user_id", user.id)
                    .single();


                if (profileFetchError) {
                    throw profileFetchError;
                }


                setProfile(data);


                console.log(
                    "Dashboard profile:",
                    data
                );


            } catch (err) {

                console.error(
                    "Dashboard profile error:",
                    err
                );


                setProfileError(
                    err.message ||
                    "Unable to load your profile."
                );


            } finally {

                setLoading(false);

            }

        };


        fetchProfile();

    }, []);


    // =========================
    // LIVE CURRENT TIME
    // =========================

    useEffect(() => {

        const timer = setInterval(() => {

            setCurrentTime(
                new Date()
            );

        }, 1000);


        return () => {

            clearInterval(timer);

        };

    }, []);


    // =========================
    // GREETING
    // =========================

    const getGreeting = () => {

        const hour = currentTime.getHours();


        if (hour >= 5 && hour < 12) {

            return "Good morning";

        }


        if (hour >= 12 && hour < 17) {

            return "Good afternoon";

        }


        if (hour >= 17 && hour < 21) {

            return "Good evening";

        }


        return "Good night";

    };


    // =========================
    // USER NAME
    // =========================

    const fullName =
        profile?.full_name ||
        "Student";


    const firstName =
        fullName
            .trim()
            .split(" ")[0] ||
        "Student";


    // =========================
    // USER BRANCH
    // =========================

    const branch =
        profile?.branch ||
        "";


    const branchLabel =
        branch
            ? `${branch} Student`
            : "Student";


    // =========================
    // USER AVATAR
    // =========================

    const avatarInitial =
        firstName
            .charAt(0)
            .toUpperCase();


    // =========================
    // CURRENT DATE
    // =========================

    const formattedDate =
        currentTime.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );


    // =========================
    // CURRENT TIME
    // =========================

    const formattedTime =
        currentTime.toLocaleTimeString(
            "en-IN",
            {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            }
        );


    // =========================
    // LOADING STATE
    // =========================

    if (loading) {

        return (

            <div className="app">

                <main className="main">

                    <section className="dashboard">

                        <div
                            style={{
                                padding: "40px",
                                textAlign: "center",
                            }}
                        >

                            <h2>
                                Loading your CareerOS dashboard...
                            </h2>

                            <p>
                                Preparing your personalized career space.
                            </p>

                        </div>

                    </section>

                </main>

            </div>

        );

    }


    // =========================
    // MAIN DASHBOARD
    // =========================

    return (

        <div className="app">


            {/* ================= SIDEBAR ================= */}

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


                    <a className="nav-item active">

                        <LayoutDashboard size={18} />

                        <span>
                            Overview
                        </span>

                    </a>


                    <a
                        className="nav-item"
                        href="/profile"
                    >

                        <UserRound size={18} />

                        <span>
                            My Profile
                        </span>

                    </a>


                    <a
                        className="nav-item"
                        href="/resume"
                    >

                        <FileText size={18} />

                        <span>
                            AI Resume
                        </span>

                    </a>


                    <a
                        className="nav-item"
                        href="/opportunities"
                    >

                        <BriefcaseBusiness size={18} />

                        <span>
                            Opportunities
                        </span>

                    </a>


                    <a
                        className="nav-item"
                        href="/applications"
                    >

                        <FileText size={18} />

                        <span>
                            Applications
                        </span>

                    </a>


                    <p className="nav-title">
                        GROWTH
                    </p>


                    <a
                        className="nav-item"
                        href="/learning"
                    >

                        <Target size={18} />

                        <span>
                            Skill Development
                        </span>

                    </a>


                    
        <a
            className="nav-item"
            href="/interview"
        >
            <Video size={18} />

            <span>
                Interview Studio
            </span>
        </a>



                    <a className="nav-item">

                        <Brain size={18} />

                        <span>
                            Aptitude
                        </span>

                    </a>


                    <a className="nav-item">

                        <MessageCircle size={18} />

                        <span>
                            AI Mentor
                        </span>

                    </a>


                    <p className="nav-title">
                        SYSTEM
                    </p>


                    <a className="nav-item">

                        <Settings size={18} />

                        <span>
                            Settings
                        </span>

                    </a>

                </nav>


                {/* ================= SIDEBAR BOTTOM ================= */}

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


                    {/* DYNAMIC USER */}

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


            {/* ================= MAIN ================= */}

            <main className="main">


                {/* ================= TOPBAR ================= */}

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


                        {/* DYNAMIC TOP PROFILE */}

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


                {/* ================= DASHBOARD CONTENT ================= */}

                <section className="dashboard">


                    {/* ================= WELCOME ================= */}

                    <div className="welcome-section">


                        <div>


                            <p className="eyebrow">
                                CAREER COMMAND CENTER
                            </p>


                            <h1>

                                {getGreeting()}, {firstName} 👋

                            </h1>


                            <p className="welcome-text">

                                Your career is moving forward.
                                Here's what deserves your attention today.

                            </p>

                        </div>


                        <div className="welcome-actions">


                            <div className="daily-message">


                                <span>
                                    {formattedDate}
                                </span>


                                <strong
                                    style={{
                                        display: "block",
                                        marginTop: "5px",
                                        fontSize: "15px",
                                        fontWeight: "600",
                                    }}
                                >
                                    {formattedTime}
                                </strong>


                                <em>
                                    "Build the future you want."
                                </em>

                            </div>


                            <button className="primary-button">

                                <Sparkles size={16} />

                                Ask CareerOS AI

                            </button>

                        </div>

                    </div>


                    {/* ================= AI INSIGHT ================= */}

                    <div className="ai-insight">


                        <div className="ai-insight-glow" />


                        <div className="ai-robot">


                            <div className="robot-face">

                                <div className="robot-eye"></div>

                                <div className="robot-eye"></div>

                            </div>

                        </div>


                        <div className="ai-insight-content">


                            <span className="ai-label">
                                ✦ AI INSIGHT
                            </span>


                            <h3>
                                You're closer to your target role than you think.
                            </h3>


                            <p>
                                Your profile matches several software
                                engineering opportunities. Strengthening DSA
                                and adding two projects could significantly
                                improve your match quality.
                            </p>

                        </div>


                        <div className="suggested-next">


                            <div className="suggested-icon">

                                <Target size={17} />

                            </div>


                            <div>

                                <span>
                                    SUGGESTED NEXT STEP
                                </span>


                                <strong>
                                    Complete 15 DSA problems
                                </strong>


                                <p>
                                    this week to boost your profile.
                                </p>

                            </div>


                            <button className="insight-button">

                                See my roadmap

                                <ArrowUpRight size={14} />

                            </button>

                        </div>

                    </div>


                    {/* ================= METRICS ================= */}

                    <div className="stats-grid">


                        <div className="stat-card">


                            <div className="stat-top">

                                <span>
                                    Career Readiness
                                </span>


                                <div className="stat-icon purple">

                                    <TrendingUp size={17} />

                                </div>

                            </div>


                            <div className="stat-value">
                                85%
                            </div>


                            <div className="progress">

                                <div
                                    className="progress-fill"
                                    style={{
                                        width: "85%",
                                    }}
                                />

                            </div>


                            <p className="stat-note">

                                <span className="positive">
                                    ↑ 12%
                                </span>

                                compared with last month

                            </p>

                        </div>


                        <div className="stat-card">


                            <div className="stat-top">

                                <span>
                                    Resume Intelligence
                                </span>


                                <div className="stat-icon blue">

                                    <FileText size={17} />

                                </div>

                            </div>


                            <div className="stat-value">

                                82<span>/100</span>

                            </div>


                            <p className="stat-note">

                                <span className="positive">
                                    Strong
                                </span>

                                ATS compatibility

                            </p>

                        </div>


                        <div className="stat-card">


                            <div className="stat-top">

                                <span>
                                    Skill Coverage
                                </span>


                                <div className="stat-icon green">

                                    <Target size={17} />

                                </div>

                            </div>


                            <div className="stat-value">

                                8<span>/12</span>

                            </div>


                            <p className="stat-note">
                                4 skills need attention
                            </p>

                        </div>


                        <div className="stat-card">


                            <div className="stat-top">

                                <span>
                                    Active Applications
                                </span>


                                <div className="stat-icon orange">

                                    <BriefcaseBusiness size={17} />

                                </div>

                            </div>


                            <div className="stat-value">
                                12
                            </div>


                            <p className="stat-note">
                                3 interview opportunities
                            </p>

                        </div>

                    </div>


                    {/* ================= MAIN PANELS ================= */}

                    <div className="content-grid">


                        {/* ================= ROADMAP ================= */}

                        <div className="panel roadmap-panel">


                            <div className="panel-header">


                                <div>


                                    <div className="panel-title">

                                        <Target size={17} />

                                        Your Career Roadmap

                                    </div>


                                    <p>
                                        Your personalized path to placement
                                    </p>

                                </div>


                                <button className="text-button">

                                    View full roadmap

                                    <ArrowUpRight size={14} />

                                </button>

                            </div>


                            <div className="roadmap">


                                <div className="roadmap-line" />


                                <div className="roadmap-step completed">


                                    <div className="roadmap-dot">

                                        <CheckCircle2 size={15} />

                                    </div>


                                    <div>

                                        <strong>
                                            Build your foundation
                                        </strong>


                                        <p>
                                            Java, SQL & web development
                                        </p>

                                    </div>


                                    <span>
                                        Completed
                                    </span>

                                </div>


                                <div className="roadmap-step current">


                                    <div className="roadmap-dot">

                                        <Zap size={14} />

                                    </div>


                                    <div>

                                        <strong>
                                            Strengthen DSA
                                        </strong>


                                        <p>
                                            Arrays, strings & problem solving
                                        </p>

                                    </div>


                                    <span>
                                        In progress
                                    </span>

                                </div>


                                <div className="roadmap-step">


                                    <div className="roadmap-dot">

                                        <BriefcaseBusiness size={14} />

                                    </div>


                                    <div>

                                        <strong>
                                            Target your opportunities
                                        </strong>


                                        <p>
                                            Apply to high-match roles
                                        </p>

                                    </div>


                                    <span>
                                        Next
                                    </span>

                                </div>

                            </div>

                        </div>


                        {/* ================= PROFILE STRENGTH ================= */}

                        <div className="panel profile-panel">


                            <div className="panel-header">


                                <div>


                                    <div className="panel-title">

                                        <UserRound size={17} />

                                        Profile strength

                                    </div>


                                    <p>
                                        Small improvements make a big difference.
                                    </p>

                                </div>


                                <strong className="profile-score">
                                    85%
                                </strong>

                            </div>


                            <div className="profile-progress">

                                <div
                                    style={{
                                        width: "85%",
                                    }}
                                />

                            </div>


                            <div className="profile-list">


                                <div>

                                    <CheckCircle2 size={16} />

                                    <span>
                                        Personal information
                                    </span>

                                </div>


                                <div>

                                    <CheckCircle2 size={16} />

                                    <span>
                                        Education details
                                    </span>

                                </div>


                                <div>

                                    <CheckCircle2 size={16} />

                                    <span>
                                        Technical skills
                                    </span>

                                </div>


                                <div className="pending">

                                    <span className="pending-dot" />

                                    <span>
                                        Add 2 projects
                                    </span>

                                </div>


                                <div className="pending">

                                    <span className="pending-dot" />

                                    <span>
                                        Add certifications
                                    </span>

                                </div>

                            </div>


                            <button
                                className="outline-button"
                                onClick={() =>
                                    window.location.href = "/profile"
                                }
                            >

                                Complete profile

                                <ChevronRight size={15} />

                            </button>

                        </div>

                    </div>


                    {/* ================= OPPORTUNITIES ================= */}

                    <div className="panel opportunities-panel">


                        <div className="panel-header">


                            <div>


                                <div className="panel-title">

                                    <BriefcaseBusiness size={17} />

                                    Recommended opportunities

                                </div>


                                <p>
                                    Roles selected based on your current profile
                                </p>

                            </div>


                            <button className="text-button">

                                Explore all

                                <ChevronRight size={15} />

                            </button>

                        </div>


                        <div className="opportunity-list">


                            <div className="opportunity">


                                <div className="company-mark">
                                    T
                                </div>


                                <div className="opportunity-info">


                                    <span className="opportunity-type">
                                        FULL-TIME
                                    </span>


                                    <h3>
                                        Graduate Software Engineer
                                    </h3>


                                    <p>
                                        Tata Consultancy Services · Pune
                                    </p>

                                </div>


                                <div className="match-score">


                                    <strong>
                                        94%
                                    </strong>


                                    <span>
                                        match
                                    </span>

                                </div>


                                <button className="view-button">

                                    <ArrowUpRight size={15} />

                                </button>

                            </div>


                            <div className="opportunity">


                                <div className="company-mark">
                                    I
                                </div>


                                <div className="opportunity-info">


                                    <span className="opportunity-type">
                                        INTERNSHIP
                                    </span>


                                    <h3>
                                        Software Engineering Intern
                                    </h3>


                                    <p>
                                        Infosys · Bengaluru
                                    </p>

                                </div>


                                <div className="match-score">


                                    <strong>
                                        89%
                                    </strong>


                                    <span>
                                        match
                                    </span>

                                </div>


                                <button className="view-button">

                                    <ArrowUpRight size={15} />

                                </button>

                            </div>


                            <div className="opportunity">


                                <div className="company-mark">
                                    W
                                </div>


                                <div className="opportunity-info">


                                    <span className="opportunity-type">
                                        FULL-TIME
                                    </span>


                                    <h3>
                                        Junior React Developer
                                    </h3>


                                    <p>
                                        Wipro · Mumbai
                                    </p>

                                </div>


                                <div className="match-score">


                                    <strong>
                                        86%
                                    </strong>


                                    <span>
                                        match
                                    </span>

                                </div>


                                <button className="view-button">

                                    <ArrowUpRight size={15} />

                                </button>

                            </div>

                        </div>

                    </div>


                    {/* ================= FOOTER ================= */}

                    <footer className="dashboard-footer">

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
export default Dashboard;