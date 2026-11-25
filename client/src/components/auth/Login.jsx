import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";
import "./Auth.css";

function Login() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    const handleChange = (event) => {

        setFormData({
            ...formData,
            [event.target.name]: event.target.value,
        });

    };


    const handleLogin = async (event) => {

        event.preventDefault();

        setError("");


        if (!formData.email || !formData.password) {

            setError("Please enter your email and password.");

            return;
        }


        try {

            setLoading(true);


            const { data, error: loginError } =
                await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                });


            if (loginError) {
                throw loginError;
            }


            if (!data.session) {

                throw new Error(
                    "Login successful, but no active session was created."
                );

            }


            console.log(
                "Logged in user:",
                data.user.id
            );


            navigate("/");


        } catch (err) {

            console.error(
                "Login error:",
                err
            );

            setError(
                err.message ||
                "Unable to login."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="auth-page">

            <div className="auth-card">

                <div className="auth-brand">

                    <div className="auth-logo">
                        ✦
                    </div>

                    <div>

                        <h1>
                            CareerOS AI
                        </h1>

                        <p>
                            Your intelligent career companion
                        </p>

                    </div>

                </div>


                <div className="auth-heading">

                    <p className="auth-eyebrow">
                        WELCOME BACK
                    </p>

                    <h2>
                        Continue your career journey
                    </h2>

                    <p>
                        Login to access your personalized
                        CareerOS dashboard.
                    </p>

                </div>


                {error && (

                    <div className="auth-error">
                        {error}
                    </div>

                )}


                <form
                    className="auth-form"
                    onSubmit={handleLogin}
                >

                    <div className="auth-field">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />

                    </div>


                    <div className="auth-field">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                        />

                    </div>


                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Logging in..."
                            : "Login to CareerOS"
                        }

                    </button>

                </form>


                <div className="auth-footer">

                    <span>
                        Don't have an account?
                    </span>

                    <Link to="/signup">
                        Create account
                    </Link>

                </div>


                <div className="auth-note">

                    Designed for CSE, AI & IT students ✦

                </div>

            </div>

        </div>

    );

}


export default Login;