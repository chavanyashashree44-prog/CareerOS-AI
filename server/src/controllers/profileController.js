const supabase = require("../config/supabase");

// Create a new profile
const createProfile = async (req, res) => {
    const {
        full_name,
        email,
        college,
        degree,
        graduation_year
    } = req.body;

    const { data, error } = await supabase
        .from("profiles")
        .insert([
            {
                full_name,
                email,
                college,
                degree,
                graduation_year
            }
        ])
        .select();

    if (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }

    res.status(201).json({
        success: true,
        message: "Profile created successfully 🚀",
        data: data
    });
};


// Get all profiles
const getProfiles = async (req, res) => {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }

    res.json({
        success: true,
        message: "Profiles fetched successfully 🚀",
        data: data
    });
};


// Get a single profile by ID
const getProfileById = async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        return res.status(404).json({
            success: false,
            message: "Profile not found"
        });
    }

    res.json({
        success: true,
        message: "Profile fetched successfully 🚀",
        data: data
    });
};


// Update a profile by ID
const updateProfile = async (req, res) => {
    const { id } = req.params;

    const {
        full_name,
        email,
        college,
        degree,
        graduation_year
    } = req.body;

    const { data, error } = await supabase
        .from("profiles")
        .update({
            full_name,
            email,
            college,
            degree,
            graduation_year
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }

    res.json({
        success: true,
        message: "Profile updated successfully 🚀",
        data: data
    });
};


// Delete a profile by ID
const deleteProfile = async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }

    res.json({
        success: true,
        message: "Profile deleted successfully 🚀",
        data: data
    });
};


module.exports = {
    createProfile,
    getProfiles,
    getProfileById,
    updateProfile,
    deleteProfile
};