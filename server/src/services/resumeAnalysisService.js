const { createClient } = require("@supabase/supabase-js");


/**
 * Get the complete resume of the authenticated user
 * for AI analysis.
 */
const getResumeForAnalysis = async (userId, accessToken) => {

    // --------------------------------------------------
    // 1. Validate user ID
    // --------------------------------------------------

    if (!userId) {
        throw new Error("User ID is required.");
    }


    // --------------------------------------------------
    // 2. Validate access token
    // --------------------------------------------------

    if (!accessToken) {
        throw new Error("Access token is required.");
    }


    // --------------------------------------------------
    // 3. Create Supabase client using user's session
    // --------------------------------------------------

    const userSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_PUBLISHABLE_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },

            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false,
            },
        }
    );


    // --------------------------------------------------
    // 4. Get main resume
    // --------------------------------------------------

    const {
        data: resume,
        error: resumeError,
    } = await userSupabase
        .from("resumes")
        .select(`
            id,
            user_id,
            summary,
            phone,
            location,
            linkedin,
            github,
            created_at,
            updated_at
        `)
        .eq("user_id", userId)
        .maybeSingle();


    if (resumeError) {
        throw resumeError;
    }


    // --------------------------------------------------
    // 5. Make sure resume exists
    // --------------------------------------------------

    if (!resume) {
        throw new Error("Resume not found.");
    }


    // --------------------------------------------------
    // 6. Get all resume sections
    // --------------------------------------------------

    const [
        educationResponse,
        skillsResponse,
        projectsResponse,
        experienceResponse,
        certificationsResponse,
        achievementsResponse,
    ] = await Promise.all([

        // Education
        userSupabase
            .from("resume_education")
            .select("*")
            .eq("resume_id", resume.id)
            .order("id", {
                ascending: true,
            }),

        // Skills
        userSupabase
            .from("resume_skills")
            .select("*")
            .eq("resume_id", resume.id)
            .order("id", {
                ascending: true,
            }),

        // Projects
        userSupabase
            .from("resume_projects")
            .select("*")
            .eq("resume_id", resume.id)
            .order("id", {
                ascending: true,
            }),

        // Experience
        userSupabase
            .from("resume_experience")
            .select("*")
            .eq("resume_id", resume.id)
            .order("id", {
                ascending: true,
            }),

        // Certifications
        userSupabase
            .from("resume_certifications")
            .select("*")
            .eq("resume_id", resume.id)
            .order("id", {
                ascending: true,
            }),

        // Achievements
        userSupabase
            .from("resume_achievements")
            .select("*")
            .eq("resume_id", resume.id)
            .order("id", {
                ascending: true,
            }),
    ]);


    // --------------------------------------------------
    // 7. Check for errors
    // --------------------------------------------------

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


    // --------------------------------------------------
    // 8. Return complete resume data
    // --------------------------------------------------

    return {
        resume,

        education:
            educationResponse.data || [],

        skills:
            skillsResponse.data || [],

        projects:
            projectsResponse.data || [],

        experience:
            experienceResponse.data || [],

        certifications:
            certificationsResponse.data || [],

        achievements:
            achievementsResponse.data || [],
    };
};


// --------------------------------------------------
// Export the service function
// --------------------------------------------------

module.exports = {
    getResumeForAnalysis,
};