import { useEffect, useState } from "react";

import {
    UserRound,
    GraduationCap,
    Building2,
    Mail,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Save,
    X,
    Pencil,
} from "lucide-react";

import { supabase } from "../../config/supabase";

import "./Profile.css";


function Profile() {

    const [profile, setProfile] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const [isEditing, setIsEditing] = useState(false);


    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        college: "",
        branch: "",
        degree: "",
        degree_start_year: "",
        graduation_year: "",
    });


    // =========================
    // FETCH PROFILE
    // =========================

    const fetchProfile = async () => {

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

                setError(
                    "No user is currently logged in."
                );

                return;
            }


            const {
                data,
                error: profileError,
            } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", user.id)
                .single();


            if (profileError) {
                throw profileError;
            }


            setProfile(data);


            setFormData({
                full_name: data.full_name || "",
                email: data.email || "",
                college: data.college || "",
                branch: data.branch || "",
                degree: data.degree || "",
                degree_start_year:
                    data.degree_start_year || "",
                graduation_year:
                    data.graduation_year || "",
            });


        } catch (err) {

            console.error(
                "Profile fetch error:",
                err
            );

            setError(
                err.message ||
                "Unable to load your profile."
            );

        } finally {

            setLoading(false);

        }

    };


    // =========================
    // LOAD PROFILE
    // =========================

    useEffect(() => {

        fetchProfile();

    }, []);


    // =========================
    // HANDLE CHANGE
    // =========================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;


        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

    };


    // =========================
    // SAVE PROFILE
    // =========================

    const handleSave = async () => {

        try {

            setError("");
            setSuccess("");


            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();


            if (userError) {
                throw userError;
            }


            if (!user) {

                setError(
                    "No user is currently logged in."
                );

                return;
            }


            const {
                data,
                error: updateError,
            } = await supabase
                .from("profiles")
                .update({

                    full_name:
                        formData.full_name.trim(),

                    college:
                        formData.college.trim(),

                    branch:
                        formData.branch,

                    degree:
                        formData.degree.trim(),

                    degree_start_year:
                        formData.degree_start_year
                            ? Number(
                                formData.degree_start_year
                            )
                            : null,

                    graduation_year:
                        formData.graduation_year
                            ? Number(
                                formData.graduation_year
                            )
                            : null,

                })
                .eq("user_id", user.id)
                .select()
                .single();


            if (updateError) {
                throw updateError;
            }


            setProfile(data);


            setFormData({

                full_name:
                    data.full_name || "",

                email:
                    data.email || "",

                college:
                    data.college || "",

                branch:
                    data.branch || "",

                degree:
                    data.degree || "",

                degree_start_year:
                    data.degree_start_year || "",

                graduation_year:
                    data.graduation_year || "",

            });


            setIsEditing(false);

            setSuccess(
                "Profile updated successfully."
            );


        } catch (err) {

            console.error(
                "Profile update error:",
                err
            );

            setError(
                err.message ||
                "Unable to update your profile."
            );

        }

    };


    // =========================
    // CANCEL EDITING
    // =========================

    const handleCancel = () => {

        if (!profile) return;


        setFormData({

            full_name:
                profile.full_name || "",

            email:
                profile.email || "",

            college:
                profile.college || "",

            branch:
                profile.branch || "",

            degree:
                profile.degree || "",

            degree_start_year:
                profile.degree_start_year || "",

            graduation_year:
                profile.graduation_year || "",

        });


        setIsEditing(false);

        setError("");

        setSuccess("");

    };


    // =========================
    // LOADING
    // =========================

    if (loading) {

        return (

            <div className="profile-page">

                <div className="profile-loading">

                    <div className="profile-loading-icon">

                        <Sparkles size={22} />

                    </div>

                    <h2>
                        Loading your profile...
                    </h2>

                    <p>
                        Fetching your CareerOS information.
                    </p>

                </div>

            </div>

        );

    }


    // =========================
    // ERROR
    // =========================

    if (error && !profile) {

        return (

            <div className="profile-page">

                <div className="profile-error">

                    <div className="profile-error-icon">

                        <AlertCircle size={22} />

                    </div>

                    <h2>
                        Unable to Load Profile
                    </h2>

                    <p>
                        {error}
                    </p>

                </div>

            </div>

        );

    }


    const fullName =
        profile?.full_name ||
        "Student";


    const firstName =
        fullName
            .trim()
            .split(" ")[0] ||
        "Student";


    const branch =
        profile?.branch ||
        "";


    const branchLabel =
        branch
            ? `${branch} Student`
            : "Student";


    const avatarInitial =
        firstName
            .charAt(0)
            .toUpperCase();


    return (

        <div className="profile-page">


            {/* =========================
                HEADER
            ========================= */}

            <div className="profile-page-header">

                <div>

                    <p className="profile-eyebrow">
                        CAREEROS AI
                    </p>


                    <h1>
                        My Profile
                    </h1>


                    <p>
                        Manage your career profile
                        and academic information.
                    </p>

                </div>


                <div className="profile-header-actions">

                    {!isEditing ? (

                        <button
                            className="profile-primary-button"
                            onClick={() => {
                                setSuccess("");
                                setError("");
                                setIsEditing(true);
                            }}
                        >

                            <Pencil size={15} />

                            Edit Profile

                        </button>

                    ) : (

                        <>

                            <button
                                className="profile-secondary-button"
                                onClick={handleCancel}
                            >

                                <X size={15} />

                                Cancel

                            </button>


                            <button
                                className="profile-primary-button"
                                onClick={handleSave}
                            >

                                <Save size={15} />

                                Save Changes

                            </button>

                        </>

                    )}

                </div>

            </div>


            {/* =========================
                SUCCESS
            ========================= */}

            {success && (

                <div className="profile-success">

                    <CheckCircle2 size={16} />

                    <span>
                        {success}
                    </span>

                </div>

            )}


            {/* =========================
                ERROR
            ========================= */}

            {error && profile && (

                <div className="profile-error-banner">

                    <AlertCircle size={16} />

                    <span>
                        {error}
                    </span>

                </div>

            )}


            {/* =========================
                PROFILE HERO
            ========================= */}

            <div className="panel profile-hero">

                <div className="profile-avatar-large">

                    {avatarInitial}

                </div>


                <div className="profile-hero-info">

                    <span>
                        {branchLabel}
                    </span>


                    <h2>
                        {fullName}
                    </h2>


                    <p>
                        {profile?.email || "No email available"}
                    </p>

                </div>


                <div className="profile-status">

                    <CheckCircle2 size={14} />

                    Profile Active

                </div>

            </div>


            {/* =========================
                PERSONAL INFORMATION
            ========================= */}

            <section className="profile-section">

                <div className="profile-section-heading">

                    <h2>
                        Personal Information
                    </h2>

                    <p>
                        Your basic account information.
                    </p>

                </div>


                <div className="panel profile-fields">


                    {/* FULL NAME */}

                    <div className="profile-field">

                        <label>
                            Full Name
                        </label>


                        {isEditing ? (

                            <div className="profile-input-wrapper">

                                <UserRound size={17} />

                                <input
                                    type="text"
                                    name="full_name"
                                    value={
                                        formData.full_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter your full name"
                                />

                            </div>

                        ) : (

                            <div className="profile-value">

                                <UserRound size={16} />

                                <span>
                                    {profile?.full_name ||
                                        "Not provided"}
                                </span>

                            </div>

                        )}

                    </div>


                    {/* EMAIL */}

                    <div className="profile-field">

                        <label>
                            Email
                        </label>


                        <div className="profile-value">

                            <Mail size={16} />

                            <span>
                                {profile?.email ||
                                    "Not provided"}
                            </span>

                        </div>

                    </div>

                </div>

            </section>


            {/* =========================
                ACADEMIC INFORMATION
            ========================= */}

            <section className="profile-section">

                <div className="profile-section-heading">

                    <h2>
                        Academic Information
                    </h2>

                    <p>
                        Your education and graduation details.
                    </p>

                </div>


                <div className="panel profile-fields">


                    {/* COLLEGE */}

                    <div className="profile-field full-width">

                        <label>
                            College
                        </label>


                        {isEditing ? (

                            <div className="profile-input-wrapper">

                                <Building2 size={17} />

                                <input
                                    type="text"
                                    name="college"
                                    value={
                                        formData.college
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter your college or university"
                                />

                            </div>

                        ) : (

                            <div className="profile-value">

                                <Building2 size={16} />

                                <span>
                                    {profile?.college ||
                                        "Not provided"}
                                </span>

                            </div>

                        )}

                    </div>


                    {/* BRANCH */}

                    <div className="profile-field">

                        <label>
                            Branch
                        </label>


                        {isEditing ? (

                            <div className="profile-input-wrapper">

                                <GraduationCap size={17} />

                                <select
                                    name="branch"
                                    value={
                                        formData.branch
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    <option value="">
                                        Select your branch
                                    </option>

                                    <option value="CSE">
                                        CSE — Computer Science & Engineering
                                    </option>

                                    <option value="AI">
                                        AI — Artificial Intelligence
                                    </option>

                                    <option value="IT">
                                        IT — Information Technology
                                    </option>

                                </select>

                            </div>

                        ) : (

                            <div className="profile-value">

                                <GraduationCap size={16} />

                                <span>
                                    {profile?.branch ||
                                        "Not provided"}
                                </span>

                            </div>

                        )}

                    </div>


                    {/* DEGREE */}

                    <div className="profile-field">

                        <label>
                            Degree
                        </label>


                        {isEditing ? (

                            <div className="profile-input-wrapper">

                                <GraduationCap size={17} />

                                <input
                                    type="text"
                                    name="degree"
                                    value={
                                        formData.degree
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. B.E. Computer Science"
                                />

                            </div>

                        ) : (

                            <div className="profile-value">

                                <GraduationCap size={16} />

                                <span>
                                    {profile?.degree ||
                                        "Not provided"}
                                </span>

                            </div>

                        )}

                    </div>


                    {/* START YEAR */}

                    <div className="profile-field">

                        <label>
                            Degree Start Year
                        </label>


                        {isEditing ? (

                            <div className="profile-input-wrapper">

                                <input
                                    type="number"
                                    name="degree_start_year"
                                    value={
                                        formData.degree_start_year
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. 2023"
                                    min="2000"
                                    max="2100"
                                />

                            </div>

                        ) : (

                            <div className="profile-value">

                                <span>
                                    {profile?.degree_start_year ||
                                        "Not provided"}
                                </span>

                            </div>

                        )}

                    </div>


                    {/* GRADUATION YEAR */}

                    <div className="profile-field">

                        <label>
                            Expected Graduation Year
                        </label>


                        {isEditing ? (

                            <div className="profile-input-wrapper">

                                <input
                                    type="number"
                                    name="graduation_year"
                                    value={
                                        formData.graduation_year
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. 2027"
                                    min="2000"
                                    max="2100"
                                />

                            </div>

                        ) : (

                            <div className="profile-value">

                                <span>
                                    {profile?.graduation_year ||
                                        "Not provided"}
                                </span>

                            </div>

                        )}

                    </div>

                </div>

            </section>


            {/* =========================
                AI INSIGHT
            ========================= */}

            <div className="panel profile-insight">

                <div className="profile-insight-icon">

                    <Sparkles size={20} />

                </div>


                <div>

                    <span>
                        CAREEROS AI INSIGHT
                    </span>


                    <h3>
                        Your profile powers your career journey.
                    </h3>


                    <p>
                        CareerOS AI will use your academic
                        background, skills, resume and career
                        goals to generate personalized
                        recommendations for your career path.
                    </p>

                </div>

            </div>

        </div>

    );

}


export default Profile;