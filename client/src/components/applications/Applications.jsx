import { useEffect, useState } from "react";
import {
    Briefcase,
    Calendar,
    ExternalLink,
    FileText,
    Clock,
} from "lucide-react";
import { supabase } from "../../config/supabase";
import "./Applications.css";

function Applications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError("");

            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                setError("Please log in to view your applications.");
                return;
            }

            const { data, error } = await supabase
                .from("applications")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                throw error;
            }

            setApplications(data || []);
        } catch (error) {
            console.error("Error loading applications:", error);
            setError("Unable to load your applications.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) {
            return "Not specified";
        }

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusClass = (status) => {
        if (!status) {
            return "status-default";
        }

        return `status-${status
            .toLowerCase()
            .replace(/\s+/g, "-")}`;
    };

    if (loading) {
        return (
            <div className="applications-page">
                <div className="applications-loading">
                    Loading your applications...
                </div>
            </div>
        );
    }

    return (
        <div className="applications-page">
            <div className="applications-header">
                <div>
                    <h1>Application Tracking</h1>
                    <p>
                        Track the jobs and internships you have applied for.
                    </p>
                </div>

                <div className="applications-summary">
                    <Briefcase size={20} />
                    <span>
                        {applications.length}{" "}
                        {applications.length === 1
                            ? "Application"
                            : "Applications"}
                    </span>
                </div>
            </div>

            {error && (
                <div className="applications-error">
                    {error}
                </div>
            )}

            {!error && applications.length === 0 && (
                <div className="applications-empty">
                    <FileText size={46} />

                    <h2>No applications yet</h2>

                    <p>
                        Applications you track from the Opportunities page
                        will appear here.
                    </p>
                </div>
            )}

            {!error && applications.length > 0 && (
                <div className="applications-list">
                    {applications.map((application) => (
                        <div
                            className="application-card"
                            key={application.id}
                        >
                            <div className="application-card-main">
                                <div className="application-icon">
                                    <Briefcase size={22} />
                                </div>

                                <div className="application-content">
                                    <div className="application-title-row">
                                        <div>
                                            <h2>
                                                {application.role ||
                                                    "Opportunity"}
                                            </h2>

                                            <h3>
                                                {application.company ||
                                                    "Company"}
                                            </h3>
                                        </div>

                                        <span
                                            className={`application-status ${getStatusClass(
                                                application.status
                                            )}`}
                                        >
                                            {application.status ||
                                                "Applied"}
                                        </span>
                                    </div>

                                    <div className="application-details">
                                        <div>
                                            <Calendar size={16} />
                                            <span>
                                                Applied{" "}
                                                {formatDate(
                                                    application.applied_at
                                                )}
                                            </span>
                                        </div>

                                        <div>
                                            <Clock size={16} />
                                            <span>
                                                Added{" "}
                                                {formatDate(
                                                    application.created_at
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {application.notes && (
                                        <div className="application-notes">
                                            <strong>Notes:</strong>{" "}
                                            {application.notes}
                                        </div>
                                    )}

                                    {application.application_url && (
                                        <a
                                            href={
                                                application.application_url
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="application-link"
                                        >
                                            View Application
                                            <ExternalLink size={15} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Applications;