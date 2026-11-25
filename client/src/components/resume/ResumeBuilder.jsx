import { useEffect, useState } from "react";
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    User,
    GraduationCap,
    FileText,
    Code2,
    FolderKanban,
    Briefcase,
    Award,
    Trophy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../config/supabase";
import ThemeSwitcher from "../ThemeSwitcher";

import "./ResumeBuilder.css";

function ResumeBuilder() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [profile, setProfile] = useState(null);
    const [resumeId, setResumeId] = useState(null);

    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [formData, setFormData] = useState({
        phone: "",
        location: "",
        linkedin: "",
        github: "",
        summary: "",
        skills: "",

        projects: [
            {
                name: "",
                description: "",
                technologies: "",
                link: "",
            },
        ],

        experience: [
            {
                company: "",
                role: "",
                start_date: "",
                end_date: "",
                description: "",
            },
        ],

        certifications: [
            {
                name: "",
                issuer: "",
                year: "",
            },
        ],

        achievements: [
            {
                title: "",
                description: "",
            },
        ],
    });

    // --------------------------------------------------
    // LOAD PROFILE + EXISTING RESUME
    // --------------------------------------------------

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

            // -----------------------------
            // PROFILE
            // -----------------------------

            const { data: profileData, error: profileError } =
                await supabase
                    .from("profiles")
                    .select(
                        "id, user_id, full_name, email, branch, college, degree, degree_start_year, graduation_year"
                    )
                    .eq("user_id", user.id)
                    .maybeSingle();

            if (profileError) {
                throw profileError;
            }

            setProfile(profileData);

            // -----------------------------
            // RESUME
            // -----------------------------

            const { data: resumeData, error: resumeError } =
                await supabase
                    .from("resumes")
                    .select(
                        "id, user_id, summary, phone, location, linkedin, github, created_at, updated_at"
                    )
                    .eq("user_id", user.id)
                    .maybeSingle();

            if (resumeError) {
                throw resumeError;
            }

            // No resume created yet
            if (!resumeData) {
                setLoading(false);
                return;
            }

            setResumeId(resumeData.id);

            // -----------------------------
            // CHILD TABLES
            // -----------------------------

            const [
                educationResponse,
                skillsResponse,
                projectsResponse,
                experienceResponse,
                certificationsResponse,
                achievementsResponse,
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
            ]);

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

            const skills = skillsResponse.data || [];
            const projects = projectsResponse.data || [];
            const experience = experienceResponse.data || [];
            const certifications = certificationsResponse.data || [];
            const achievements = achievementsResponse.data || [];

            setFormData({
                phone: resumeData.phone || "",
                location: resumeData.location || "",
                linkedin: resumeData.linkedin || "",
                github: resumeData.github || "",
                summary: resumeData.summary || "",

                skills: skills
                    .map((item) => item.skill || "")
                    .filter(Boolean)
                    .join(", "),

                projects:
                    projects.length > 0
                        ? projects.map((item) => ({
                              name: item.name || "",
                              description: item.description || "",
                              technologies: item.technologies || "",
                              link: item.link || "",
                          }))
                        : [
                              {
                                  name: "",
                                  description: "",
                                  technologies: "",
                                  link: "",
                              },
                          ],

                experience:
                    experience.length > 0
                        ? experience.map((item) => ({
                              company: item.company || "",
                              role: item.role || "",
                              start_date: item.start_date
                                  ? item.start_date.substring(0, 7)
                                  : "",
                              end_date: item.end_date
                                  ? item.end_date.substring(0, 7)
                                  : "",
                              description: item.description || "",
                          }))
                        : [
                              {
                                  company: "",
                                  role: "",
                                  start_date: "",
                                  end_date: "",
                                  description: "",
                              },
                          ],

                certifications:
                    certifications.length > 0
                        ? certifications.map((item) => ({
                              name: item.name || "",
                              issuer: item.issuer || "",
                              year: item.year || "",
                          }))
                        : [
                              {
                                  name: "",
                                  issuer: "",
                                  year: "",
                              },
                          ],

                achievements:
                    achievements.length > 0
                        ? achievements.map((item) => ({
                              title: item.title || "",
                              description: item.description || "",
                          }))
                        : [
                              {
                                  title: "",
                                  description: "",
                              },
                          ],
            });
        } catch (error) {
            console.error("Resume load error:", error);

            setErrorMessage(
                error?.message || "Failed to load resume data."
            );
        } finally {
            setLoading(false);
        }
    };

    // --------------------------------------------------
    // BASIC FIELD CHANGE
    // --------------------------------------------------

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // --------------------------------------------------
    // ARRAY FIELD CHANGE
    // --------------------------------------------------

    const handleArrayChange = (section, index, field, value) => {
        setFormData((previous) => ({
            ...previous,
            [section]: previous[section].map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          [field]: value,
                      }
                    : item
            ),
        }));
    };

    // --------------------------------------------------
    // ADD ITEM
    // --------------------------------------------------

    const addItem = (section) => {
        const newItems = {
            projects: {
                name: "",
                description: "",
                technologies: "",
                link: "",
            },

            experience: {
                company: "",
                role: "",
                start_date: "",
                end_date: "",
                description: "",
            },

            certifications: {
                name: "",
                issuer: "",
                year: "",
            },

            achievements: {
                title: "",
                description: "",
            },
        };

        setFormData((previous) => ({
            ...previous,
            [section]: [
                ...previous[section],
                newItems[section],
            ],
        }));
    };

    // --------------------------------------------------
    // REMOVE ITEM
    // --------------------------------------------------

    const removeItem = (section, index) => {
        setFormData((previous) => {
            const updated = previous[section].filter(
                (_, itemIndex) => itemIndex !== index
            );

            return {
                ...previous,
                [section]:
                    updated.length > 0
                        ? updated
                        : previous[section],
            };
        });
    };

    // --------------------------------------------------
    // SAVE RESUME
    // --------------------------------------------------

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage("");
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

            // ------------------------------------------
            // 1. SAVE MAIN RESUME
            // ------------------------------------------

            const resumePayload = {
                user_id: user.id,
                summary: formData.summary.trim() || null,
                phone: formData.phone.trim() || null,
                location: formData.location.trim() || null,
                linkedin: formData.linkedin.trim() || null,
                github: formData.github.trim() || null,
            };

            const { data: savedResume, error: resumeError } =
                await supabase
                    .from("resumes")
                    .upsert(resumePayload, {
                        onConflict: "user_id",
                    })
                    .select(
                        "id, user_id, summary, phone, location, linkedin, github"
                    )
                    .single();

            if (resumeError) {
                throw new Error(
                    `Resume table error: ${resumeError.message}`
                );
            }

            const currentResumeId = savedResume.id;

            setResumeId(currentResumeId);

            // ------------------------------------------
            // 2. DELETE OLD CHILD DATA
            // ------------------------------------------

            const deleteOperations = await Promise.all([
                supabase
                    .from("resume_education")
                    .delete()
                    .eq("resume_id", currentResumeId),

                supabase
                    .from("resume_skills")
                    .delete()
                    .eq("resume_id", currentResumeId),

                supabase
                    .from("resume_projects")
                    .delete()
                    .eq("resume_id", currentResumeId),

                supabase
                    .from("resume_experience")
                    .delete()
                    .eq("resume_id", currentResumeId),

                supabase
                    .from("resume_certifications")
                    .delete()
                    .eq("resume_id", currentResumeId),

                supabase
                    .from("resume_achievements")
                    .delete()
                    .eq("resume_id", currentResumeId),
            ]);

            for (const result of deleteOperations) {
                if (result.error) {
                    throw result.error;
                }
            }

            // ------------------------------------------
            // 3. EDUCATION
            // ------------------------------------------

            if (profile) {
                const educationPayload = {
                    resume_id: currentResumeId,
                    college: profile.college || null,
                    degree: profile.degree || null,
                    branch: profile.branch || null,
                    start_year: profile.degree_start_year || null,
                    graduation_year: profile.graduation_year || null,
                };

                const { error: educationError } =
                    await supabase
                        .from("resume_education")
                        .insert(educationPayload);

                if (educationError) {
                    throw educationError;
                }
            }

            // ------------------------------------------
            // 4. TECHNICAL SKILLS
            // ------------------------------------------

            const skills = formData.skills
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean);

            if (skills.length > 0) {
                const skillPayload = skills.map((skill) => ({
                    resume_id: currentResumeId,
                    skill,
                    category: "Technical Skills",
                }));

                const { error: skillsError } = await supabase
                    .from("resume_skills")
                    .insert(skillPayload);

                if (skillsError) {
                    throw skillsError;
                }
            }

            // ------------------------------------------
            // 5. PROJECTS
            // ------------------------------------------

            const projects = formData.projects
                .filter(
                    (project) =>
                        project.name.trim() ||
                        project.description.trim() ||
                        project.technologies.trim() ||
                        project.link.trim()
                )
                .map((project) => ({
                    resume_id: currentResumeId,
                    name: project.name.trim() || null,
                    description:
                        project.description.trim() || null,
                    technologies:
                        project.technologies.trim() || null,
                    link: project.link.trim() || null,
                }));

            if (projects.length > 0) {
                const { error: projectsError } =
                    await supabase
                        .from("resume_projects")
                        .insert(projects);

                if (projectsError) {
                    throw projectsError;
                }
            }

            // ------------------------------------------
            // 6. EXPERIENCE
            // ------------------------------------------

            const experience = formData.experience
                .filter(
                    (item) =>
                        item.company.trim() ||
                        item.role.trim() ||
                        item.start_date ||
                        item.end_date ||
                        item.description.trim()
                )
                .map((item) => ({
                    resume_id: currentResumeId,
                    company: item.company.trim() || null,
                    role: item.role.trim() || null,
                    start_date: item.start_date
                        ? `${item.start_date}-01`
                        : null,
                    end_date: item.end_date
                        ? `${item.end_date}-01`
                        : null,
                    description:
                        item.description.trim() || null,
                }));

            if (experience.length > 0) {
                const { error: experienceError } =
                    await supabase
                        .from("resume_experience")
                        .insert(experience);

                if (experienceError) {
                    throw experienceError;
                }
            }

            // ------------------------------------------
            // 7. CERTIFICATIONS
            // ------------------------------------------

            const certifications = formData.certifications
                .filter(
                    (item) =>
                        item.name.trim() ||
                        item.issuer.trim() ||
                        item.year
                )
                .map((item) => ({
                    resume_id: currentResumeId,
                    name: item.name.trim() || null,
                    issuer: item.issuer.trim() || null,
                    year: item.year
                        ? Number(item.year)
                        : null,
                }));

            if (certifications.length > 0) {
                const { error: certificationsError } =
                    await supabase
                        .from("resume_certifications")
                        .insert(certifications);

                if (certificationsError) {
                    throw certificationsError;
                }
            }

            // ------------------------------------------
            // 8. ACHIEVEMENTS
            // ------------------------------------------

            const achievements = formData.achievements
                .filter(
                    (item) =>
                        item.title.trim() ||
                        item.description.trim()
                )
                .map((item) => ({
                    resume_id: currentResumeId,
                    title: item.title.trim() || null,
                    description:
                        item.description.trim() || null,
                }));

            if (achievements.length > 0) {
                const { error: achievementsError } =
                    await supabase
                        .from("resume_achievements")
                        .insert(achievements);

                if (achievementsError) {
                    throw achievementsError;
                }
            }

            // ------------------------------------------
            // SUCCESS
            // ------------------------------------------

            setMessage("Resume saved successfully.");

            console.log("Resume saved successfully:", {
                resumeId: currentResumeId,
            });
        } catch (error) {
            console.error("Resume save error:", {
                message: error?.message,
                details: error?.details,
                hint: error?.hint,
                code: error?.code,
                status: error?.status,
            });

            setErrorMessage(
                error?.message ||
                    "Failed to save resume. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    // --------------------------------------------------
    // LOADING
    // --------------------------------------------------

    if (loading) {
        return (
            <div className="resume-builder-page">
                <div className="resume-builder-loading">
                    Loading Resume Builder...
                </div>
            </div>
        );
    }

    // --------------------------------------------------
    // UI
    // --------------------------------------------------

    return (
        <div className="resume-builder-page">

            {/* SIDEBAR */}

            <aside className="resume-builder-sidebar">

                <div className="resume-builder-brand">
                    <div className="resume-builder-brand-icon">
                        C
                    </div>

                    <div>
                        <h2>CareerOS</h2>
                        <span>AI Career Platform</span>
                    </div>
                </div>

                <nav className="resume-builder-nav">

                    <button
                        type="button"
                        onClick={() => navigate("/")}
                    >
                        <FileText size={18} />
                        Overview
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/profile")}
                    >
                        <User size={18} />
                        My Profile
                    </button>

                    <button
                        type="button"
                        className="active"
                        onClick={() => navigate("/resume")}
                    >
                        <FileText size={18} />
                        AI Resume
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/learning")}
                    >
                        <GraduationCap size={18} />
                        Learning Hub
                    </button>

                </nav>

                <div className="resume-builder-sidebar-bottom">

                    <button type="button">
                        <Briefcase size={18} />
                        Opportunities
                    </button>

                    <button type="button">
                        <Code2 size={18} />
                        Skill Development
                    </button>

                    <button type="button">
                        <Award size={18} />
                        Interview Studio
                    </button>

                    <button type="button">
                        <Trophy size={18} />
                        Aptitude
                    </button>

                </div>
            </aside>

            {/* MAIN */}

            <main className="resume-builder-main">

                {/* TOP BAR */}

                <header className="resume-builder-topbar">

                    <button
                        type="button"
                        className="resume-back-button"
                        onClick={() => navigate("/resume")}
                    >
                        <ArrowLeft size={18} />
                        Back to Resume
                    </button>

                    <div className="resume-builder-topbar-right">
                        <ThemeSwitcher />
                    </div>

                </header>

                {/* CONTENT */}

                <section className="resume-builder-content">

                    <div className="resume-builder-heading">
                        <div>
                            <span className="resume-builder-eyebrow">
                                AI RESUME
                            </span>

                            <h1>Create Your Resume</h1>

                            <p>
                                Build a professional resume using your
                                CareerOS profile and career information.
                            </p>
                        </div>
                    </div>

                    {/* STATUS */}

                    {message && (
                        <div className="resume-success-message">
                            {message}
                        </div>
                    )}

                    {errorMessage && (
                        <div className="resume-error-message">
                            {errorMessage}
                        </div>
                    )}

                    {/* PERSONAL INFORMATION */}

                    <section className="resume-form-section">

                        <div className="resume-section-title">
                            <User size={20} />

                            <div>
                                <h2>Personal Information</h2>
                                <p>Your basic profile information</p>
                            </div>
                        </div>

                        <div className="resume-form-grid">

                            <div className="resume-field">
                                <label>Full Name</label>

                                <input
                                    type="text"
                                    value={profile?.full_name || ""}
                                    disabled
                                />
                            </div>

                            <div className="resume-field">
                                <label>Email</label>

                                <input
                                    type="email"
                                    value={profile?.email || ""}
                                    disabled
                                />
                            </div>

                            <div className="resume-field">
                                <label>Branch</label>

                                <input
                                    type="text"
                                    value={profile?.branch || ""}
                                    disabled
                                />
                            </div>

                            <div className="resume-field">
                                <label>Phone</label>

                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                />
                            </div>

                            <div className="resume-field">
                                <label>Location</label>

                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="City, State, Country"
                                />
                            </div>

                            <div className="resume-field">
                                <label>LinkedIn</label>

                                <input
                                    type="text"
                                    name="linkedin"
                                    value={formData.linkedin}
                                    onChange={handleChange}
                                    placeholder="LinkedIn profile URL"
                                />
                            </div>

                            <div className="resume-field">
                                <label>GitHub</label>

                                <input
                                    type="text"
                                    name="github"
                                    value={formData.github}
                                    onChange={handleChange}
                                    placeholder="GitHub profile URL"
                                />
                            </div>

                        </div>
                    </section>

                    {/* EDUCATION */}

                    <section className="resume-form-section">

                        <div className="resume-section-title">
                            <GraduationCap size={20} />

                            <div>
                                <h2>Education</h2>
                                <p>Education information from your profile</p>
                            </div>
                        </div>

                        <div className="resume-form-grid">

                            <div className="resume-field">
                                <label>College</label>

                                <input
                                    type="text"
                                    value={profile?.college || ""}
                                    disabled
                                />
                            </div>

                            <div className="resume-field">
                                <label>Degree</label>

                                <input
                                    type="text"
                                    value={profile?.degree || ""}
                                    disabled
                                />
                            </div>

                            <div className="resume-field">
                                <label>Start Year</label>

                                <input
                                    type="text"
                                    value={
                                        profile?.degree_start_year || ""
                                    }
                                    disabled
                                />
                            </div>

                            <div className="resume-field">
                                <label>Graduation Year</label>

                                <input
                                    type="text"
                                    value={
                                        profile?.graduation_year || ""
                                    }
                                    disabled
                                />
                            </div>

                        </div>
                    </section>

                    {/* SUMMARY */}

                    <section className="resume-form-section">

                        <div className="resume-section-title">
                            <FileText size={20} />

                            <div>
                                <h2>Professional Summary</h2>
                                <p>
                                    Write a short summary about your
                                    professional profile.
                                </p>
                            </div>
                        </div>

                        <div className="resume-field">

                            <textarea
                                name="summary"
                                value={formData.summary}
                                onChange={handleChange}
                                rows="6"
                                placeholder="Write your professional summary..."
                            />

                        </div>
                    </section>

                    {/* TECHNICAL SKILLS */}

                    <section className="resume-form-section">

                        <div className="resume-section-title">
                            <Code2 size={20} />

                            <div>
                                <h2>Technical Skills</h2>
                                <p>
                                    Add programming languages, tools,
                                    technologies and concepts.
                                </p>
                            </div>
                        </div>

                        <div className="resume-field">

                            <textarea
                                name="skills"
                                value={formData.skills}
                                onChange={handleChange}
                                rows="5"
                                placeholder="Example: Java, HTML, CSS, JavaScript, React, Node.js, MySQL, Git"
                            />

                        </div>

                        <p className="resume-field-note">
                            Skills will be connected to the AI Resume
                            analysis module in the next resume step.
                        </p>

                    </section>

                    {/* PROJECTS */}

                    <section className="resume-form-section">

                        <div className="resume-section-header">

                            <div className="resume-section-title">
                                <FolderKanban size={20} />

                                <div>
                                    <h2>Projects</h2>
                                    <p>
                                        Add projects that demonstrate your
                                        technical skills.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="resume-add-button"
                                onClick={() => addItem("projects")}
                            >
                                <Plus size={16} />
                                Add Project
                            </button>

                        </div>

                        {formData.projects.map((project, index) => (
                            <div
                                className="resume-array-card"
                                key={index}
                            >

                                <div className="resume-array-card-header">

                                    <h3>
                                        Project {index + 1}
                                    </h3>

                                    {formData.projects.length > 1 && (
                                        <button
                                            type="button"
                                            className="resume-delete-button"
                                            onClick={() =>
                                                removeItem(
                                                    "projects",
                                                    index
                                                )
                                            }
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}

                                </div>

                                <div className="resume-form-grid">

                                    <div className="resume-field">
                                        <label>Project Name</label>

                                        <input
                                            type="text"
                                            value={project.name}
                                            onChange={(event) =>
                                                handleArrayChange(
                                                    "projects",
                                                    index,
                                                    "name",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Project name"
                                        />
                                    </div>

                                    <div className="resume-field">
                                        <label>Technologies Used</label>

                                        <input
                                            type="text"
                                            value={
                                                project.technologies
                                            }
                                            onChange={(event) =>
                                                handleArrayChange(
                                                    "projects",
                                                    index,
                                                    "technologies",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Java, React, Node.js..."
                                        />
                                    </div>

                                    <div className="resume-field">
                                        <label>Project Link</label>

                                        <input
                                            type="text"
                                            value={project.link}
                                            onChange={(event) =>
                                                handleArrayChange(
                                                    "projects",
                                                    index,
                                                    "link",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="GitHub / Live URL"
                                        />
                                    </div>

                                    <div className="resume-field resume-field-full">
                                        <label>Description</label>

                                        <textarea
                                            rows="4"
                                            value={
                                                project.description
                                            }
                                            onChange={(event) =>
                                                handleArrayChange(
                                                    "projects",
                                                    index,
                                                    "description",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Describe your project..."
                                        />
                                    </div>

                                </div>
                            </div>
                        ))}

                    </section>

                    {/* EXPERIENCE */}

                    <section className="resume-form-section">

                        <div className="resume-section-header">

                            <div className="resume-section-title">
                                <Briefcase size={20} />

                                <div>
                                    <h2>Experience</h2>
                                    <p>
                                        Add internships, jobs, or relevant
                                        experience.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="resume-add-button"
                                onClick={() => addItem("experience")}
                            >
                                <Plus size={16} />
                                Add Experience
                            </button>

                        </div>

                        {formData.experience.map((item, index) => (
                            <div
                                className="resume-array-card"
                                key={index}
                            >

                                <div className="resume-array-card-header">

                                    <h3>
                                        Experience {index + 1}
                                    </h3>

                                    {formData.experience.length > 1 && (
                                        <button
                                            type="button"
                                            className="resume-delete-button"
                                            onClick={() =>
                                                removeItem(
                                                    "experience",
                                                    index
                                                )
                                            }
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}

                                </div>

                                <div className="resume-form-grid">

                                    <div className="resume-field">
                                        <label>Company</label>

                                        <input
                                            type="text"
                                            value={item.company}
                                            onChange={(event) =>
                                                handleArrayChange(
                                                    "experience",
                                                    index,
                                                    "company",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Company name"
                                        />
                                    </div>

                                    <div className="resume-field">
                                        <label>Role</label>

                                        <input
                                            type="text"
                                            value={item.role}
                                            onChange={(event) =>
                                                handleArrayChange(
                                                    "experience",
                                                    index,
                                                    "role",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Your role"
                                        />
                                    </div>

                                    <div className="resume-field">
                                        <label>Start Date</label>

                                        <input
                                            type="month"
                                            value={item.start_date}
                                            onChange={(event) =>
                                                handleArrayChange(
                                                    "experience",
                                                    index,
                                                    "start_date",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="resume-field">
                                        <label>End Date</label>

                                        <input
                                            type="month"
                                            value={item.end_date}
                                            onChange={(event) =>
                                                handleArrayChange(
                                                    "experience",
                                                    index,
                                                    "end_date",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="resume-field resume-field-full">
                                        <label>Description</label>

                                        <textarea
                                            rows="5"
                                            value={item.description}
                                            onChange={(event) =>
                                                handleArrayChange(
                                                    "experience",
                                                    index,
                                                    "description",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Describe your responsibilities and experience..."
                                        />
                                    </div>

                                </div>
                            </div>
                        ))}

                    </section>

                    {/* CERTIFICATIONS */}

                    <section className="resume-form-section">

                        <div className="resume-section-header">

                            <div className="resume-section-title">
                                <Award size={20} />

                                <div>
                                    <h2>Certifications</h2>
                                    <p>
                                        Add relevant certifications and
                                        credentials.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="resume-add-button"
                                onClick={() =>
                                    addItem("certifications")
                                }
                            >
                                <Plus size={16} />
                                Add Certification
                            </button>

                        </div>

                        {formData.certifications.map(
                            (item, index) => (
                                <div
                                    className="resume-array-card"
                                    key={index}
                                >

                                    <div className="resume-array-card-header">

                                        <h3>
                                            Certification {index + 1}
                                        </h3>

                                        {formData.certifications
                                            .length > 1 && (
                                            <button
                                                type="button"
                                                className="resume-delete-button"
                                                onClick={() =>
                                                    removeItem(
                                                        "certifications",
                                                        index
                                                    )
                                                }
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}

                                    </div>

                                    <div className="resume-form-grid">

                                        <div className="resume-field">
                                            <label>
                                                Certification Name
                                            </label>

                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(event) =>
                                                    handleArrayChange(
                                                        "certifications",
                                                        index,
                                                        "name",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Certification name"
                                            />
                                        </div>

                                        <div className="resume-field">
                                            <label>
                                                Issuing Organization
                                            </label>

                                            <input
                                                type="text"
                                                value={item.issuer}
                                                onChange={(event) =>
                                                    handleArrayChange(
                                                        "certifications",
                                                        index,
                                                        "issuer",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Issuing organization"
                                            />
                                        </div>

                                        <div className="resume-field">
                                            <label>Year</label>

                                            <input
                                                type="number"
                                                value={item.year}
                                                onChange={(event) =>
                                                    handleArrayChange(
                                                        "certifications",
                                                        index,
                                                        "year",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="2026"
                                            />
                                        </div>

                                    </div>
                                </div>
                            )
                        )}

                    </section>

                    {/* ACHIEVEMENTS */}

                    <section className="resume-form-section">

                        <div className="resume-section-header">

                            <div className="resume-section-title">
                                <Trophy size={20} />

                                <div>
                                    <h2>Achievements</h2>
                                    <p>
                                        Highlight achievements that
                                        strengthen your profile.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="resume-add-button"
                                onClick={() =>
                                    addItem("achievements")
                                }
                            >
                                <Plus size={16} />
                                Add Achievement
                            </button>

                        </div>

                        {formData.achievements.map(
                            (item, index) => (
                                <div
                                    className="resume-array-card"
                                    key={index}
                                >

                                    <div className="resume-array-card-header">

                                        <h3>
                                            Achievement {index + 1}
                                        </h3>

                                        {formData.achievements
                                            .length > 1 && (
                                            <button
                                                type="button"
                                                className="resume-delete-button"
                                                onClick={() =>
                                                    removeItem(
                                                        "achievements",
                                                        index
                                                    )
                                                }
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}

                                    </div>

                                    <div className="resume-form-grid">

                                        <div className="resume-field resume-field-full">
                                            <label>
                                                Achievement Title
                                            </label>

                                            <input
                                                type="text"
                                                value={item.title}
                                                onChange={(event) =>
                                                    handleArrayChange(
                                                        "achievements",
                                                        index,
                                                        "title",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Achievement title"
                                            />
                                        </div>

                                        <div className="resume-field resume-field-full">
                                            <label>Description</label>

                                            <textarea
                                                rows="4"
                                                value={
                                                    item.description
                                                }
                                                onChange={(event) =>
                                                    handleArrayChange(
                                                        "achievements",
                                                        index,
                                                        "description",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Describe your achievement..."
                                            />
                                        </div>

                                    </div>
                                </div>
                            )
                        )}

                    </section>

                </section>

                {/* STICKY SAVE BAR */}

                <div className="resume-save-bar">

                    <div>
                        <strong>
                            {resumeId
                                ? "Resume ready to update"
                                : "Resume not saved yet"}
                        </strong>

                        <span>
                            Save your information to CareerOS AI.
                        </span>
                    </div>

                    <button
                        type="button"
                        className="resume-save-button"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        <Save size={17} />

                        {saving
                            ? "Saving..."
                            : "Save Resume"}
                    </button>

                </div>

            </main>
        </div>
    );
}

export default ResumeBuilder;