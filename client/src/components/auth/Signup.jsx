import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    Mail,
    Lock,
    UserRound,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    GraduationCap,
} from "lucide-react";

import { supabase } from "../../config/supabase";

import "./Auth.css";


function Signup() {

    const navigate = useNavigate();


    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        branch: "",
    });


    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");


    // =========================
    // HANDLE INPUT CHANGES
    // =========================

    const handleChange = (event) => {

        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

    };


    // =========================
    // HANDLE SIGNUP
    // =========================

    const handleSignup = async (event) => {

        event.preventDefault();

        setError("");

        setSuccess("");


        // Validate fields

        if (
            !formData.full_name ||
            !formData.email ||
            !formData.password ||
            !formData.branch
        ) {

            setError(
                "Please fill in all fields."
            );

            return;
        }


        // Validate password

        if (formData.password.length < 6) {

            setError(
                "Password must contain at least 6 characters."
            );

            return;
        }


        try {

            setLoading(true);


            // =========================
            // CREATE AUTH ACCOUNT
            // =========================

            const {
                data,
                error: authError,
            } = await supabase.auth.signUp({

                email: formData.email,

                password: formData.password,

            });


            if (authError) {

                throw authError;

            }


            // Make sure Supabase returned a user

            if (!data.user) {

                throw new Error(
                    "Account could not be created. Please try again."
                );

            }


            // =========================
            // CREATE CAREEROS PROFILE
            // =========================

            const {
                error: profileError,
            } = await supabase
                .from("profiles")
                .insert([
                    {
                        user_id: data.user.id,

                        full_name:
                            formData.full_name,

                        email:
                            formData.email,

                        branch:
                            formData.branch,

                        college:
                            "",

                        degree:
                            "",

                        degree_start_year:
                            null,

                        graduation_year:
                            null,
                    },
                ]);


            if (profileError) {

                throw profileError;

            }


            console.log(
                "CareerOS account created:",
                data.user.id
            );


            // =========================
            // SUCCESS
            // =========================

            setSuccess(
                "Account created successfully! Welcome to CareerOS AI."
            );


            setTimeout(() => {

                navigate("/");

            }, 1500);


        } catch (err) {

            console.error(
                "Signup error:",
                err
            );


            setError(
                err.message ||
                "Unable to create your account."
            );


        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="auth-page">


            {/* =========================
                BACKGROUND ORBS
            ========================= */}

            <div className="auth-background-orb auth-orb-one"></div>

            <div className="auth-background-orb auth-orb-two"></div>


            {/* =========================
                AUTH CARD
            ========================= */}

            <div className="auth-card">


                {/* =========================
                    BRAND
                ========================= */}

                <div className="auth-brand">

                    <div className="auth-brand-icon">

                        <Sparkles size={22} />

                    </div>


                    <div>

                        <h2>
                            CareerOS AI
                        </h2>

                        <span>
                            Your Career Intelligence Platform
                        </span>

                    </div>

                </div>


                {/* =========================
                    HEADING
                ========================= */}

                <div className="auth-heading">

                    <div className="auth-eyebrow">
                        GET STARTED
                    </div>


                    <h1>
                        Create your account
                    </h1>


                    <p>
                        Build your personalized career
                        journey with CareerOS AI.
                    </p>

                </div>


                {/* =========================
                    ERROR MESSAGE
                ========================= */}

                {error && (

                    <div className="auth-message auth-error">

                        {error}

                    </div>

                )}


                {/* =========================
                    SUCCESS MESSAGE
                ========================= */}

                {success && (

                    <div className="auth-message auth-success">

                        <CheckCircle2 size={17} />

                        {success}

                    </div>

                )}


                {/* =========================
                    SIGNUP FORM
                ========================= */}

                <form
                    className="auth-form"
                    onSubmit={handleSignup}
                >


                    {/* =========================
                        FULL NAME
                    ========================= */}

                    <div className="auth-field">

                        <label>
                            Full Name
                        </label>


                        <div className="auth-input-wrapper">

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

                    </div>


                    {/* =========================
                        EMAIL
                    ========================= */}

                    <div className="auth-field">

                        <label>
                            Email Address
                        </label>


                        <div className="auth-input-wrapper">

                            <Mail size={17} />


                            <input
                                type="email"
                                name="email"
                                value={
                                    formData.email
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="you@example.com"
                            />

                        </div>

                    </div>


                    {/* =========================
                        PASSWORD
                    ========================= */}

                    <div className="auth-field">

                        <label>
                            Password
                        </label>


                        <div className="auth-input-wrapper">

                            <Lock size={17} />


                            <input
                                type="password"
                                name="password"
                                value={
                                    formData.password
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Minimum 6 characters"
                            />

                        </div>

                    </div>


                    {/* =========================
                        BRANCH
                    ========================= */}

                    <div className="auth-field">

                        <label>
                            Branch
                        </label>


                        <div
                            className="auth-input-wrapper"
                            style={{
                                position: "relative",
                            }}
                        >

                            <GraduationCap size={17} />


                            <select
                                name="branch"
                                value={
                                    formData.branch
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                style={{
                                    flex: 1,
                                    width: "100%",
                                    height: "100%",
                                    border: "none",
                                    outline: "none",
                                    background: "transparent",
                                    color: formData.branch
                                        ? "#2b344e"
                                        : "#a8b0c5",
                                    fontFamily: "inherit",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                    appearance: "none",
                                    WebkitAppearance: "none",
                                    padding: "0 35px 0 0",
                                }}
                            >

                                <option
                                    value=""
                                    disabled
                                >
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


                            {/* Custom Arrow */}

                            <span
                                style={{
                                    position: "absolute",
                                    right: "17px",
                                    top: "50%",
                                    transform: "translateY(-55%)",
                                    color: "#9185c9",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    pointerEvents: "none",
                                }}
                            >
                                ⌄
                            </span>

                        </div>

                    </div>


                    {/* =========================
                        CREATE ACCOUNT BUTTON
                    ========================= */}

                    <button
                        type="submit"
                        className="auth-primary-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Creating account..."
                            : "Create Account"
                        }


                        {!loading && (

                            <ArrowRight size={17} />

                        )}

                    </button>


                </form>


                {/* =========================
                    LOGIN LINK
                ========================= */}

                <div className="auth-footer">

                    <span>
                        Already have an account?
                    </span>


                    <Link to="/login">
                        Sign in
                    </Link>

                </div>


                {/* =========================
                    FOOTER NOTE
                ========================= */}

                <div className="auth-note">

                    <Sparkles size={14} />


                    <span>
                        Designed for CSE, AI & IT students
                    </span>

                </div>


            </div>

        </div>

    );

}


export default Signup;