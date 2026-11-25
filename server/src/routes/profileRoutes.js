const express = require("express");

const {
    createProfile,
    getProfiles,
    getProfileById,
    updateProfile,
    deleteProfile
} = require("../controllers/profileController");

const router = express.Router();

// Create a profile
router.post("/", createProfile);

// Get all profiles
router.get("/", getProfiles);

// Get a single profile by ID
router.get("/:id", getProfileById);

// Update a profile by ID
router.put("/:id", updateProfile);

// Delete a profile by ID
router.delete("/:id", deleteProfile);

module.exports = router;