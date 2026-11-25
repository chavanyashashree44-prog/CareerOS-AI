import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});


// =====================================================
// PROFILE API
// =====================================================

// Get all profiles
export const getProfiles = async () => {
    const response = await API.get("/profiles");
    return response.data;
};


// Get profile by ID
export const getProfileById = async (id) => {
    const response = await API.get(`/profiles/${id}`);
    return response.data;
};


// Create profile
export const createProfile = async (profileData) => {
    const response = await API.post("/profiles", profileData);
    return response.data;
};


// Update profile
export const updateProfile = async (id, profileData) => {
    const response = await API.put(`/profiles/${id}`, profileData);
    return response.data;
};


// Delete profile
export const deleteProfile = async (id) => {
    const response = await API.delete(`/profiles/${id}`);
    return response.data;
};


export default API;