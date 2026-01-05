import express from "express";
import VillageProfile from "../models/VillageProfile.js";
import { protect, authorize } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const router = express.Router();

// Get all village profiles with filters and search (Public route)
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      village,
      currentCity,
      occupation,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    // Search across multiple fields
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { village: { $regex: search, $options: "i" } },
        { currentCity: { $regex: search, $options: "i" } },
        { occupation: { $regex: search, $options: "i" } },
      ];
    }

    // Individual filters
    if (village) {
      filter.village = { $regex: village, $options: "i" };
    }
    if (currentCity) {
      filter.currentCity = { $regex: currentCity, $options: "i" };
    }
    if (occupation) {
      filter.occupation = { $regex: occupation, $options: "i" };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const profiles = await VillageProfile.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await VillageProfile.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: profiles,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching village profiles:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching village profiles",
      error: error.message,
    });
  }
});

// Get unique villages, cities, and occupations for filters (Public route)
router.get("/filters/options", async (req, res) => {
  try {
    const villages = await VillageProfile.distinct("village", {
      isActive: true,
    });
    const cities = await VillageProfile.distinct("currentCity", {
      isActive: true,
    });
    const occupations = await VillageProfile.distinct("occupation", {
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: {
        villages: villages.sort(),
        cities: cities.sort(),
        occupations: occupations.sort(),
      },
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching filter options",
      error: error.message,
    });
  }
});

// Get all profiles for admin (includes inactive)
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      village,
      currentCity,
      occupation,
      isActive,
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { village: { $regex: search, $options: "i" } },
        { currentCity: { $regex: search, $options: "i" } },
        { occupation: { $regex: search, $options: "i" } },
      ];
    }

    if (village) filter.village = { $regex: village, $options: "i" };
    if (currentCity)
      filter.currentCity = { $regex: currentCity, $options: "i" };
    if (occupation) filter.occupation = { $regex: occupation, $options: "i" };
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const profiles = await VillageProfile.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await VillageProfile.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: profiles,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching profiles for admin:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profiles",
      error: error.message,
    });
  }
});

// Get single profile by ID
router.get("/:id", async (req, res) => {
  try {
    const profile = await VillageProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
});

// Create new profile (Admin only)
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("photo"),
  async (req, res) => {
    try {
      const { name, village, currentCity, occupation, bio, contactDetails } =
        req.body;

      // Parse contactDetails if it's a string
      let parsedContactDetails = contactDetails;
      if (typeof contactDetails === "string") {
        parsedContactDetails = JSON.parse(contactDetails);
      }

      let photoUrl = "";

      // Upload photo to Cloudinary if provided
      if (req.file) {
        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          "village-profiles"
        );
        photoUrl = uploadResult.url;
      }

      const profile = await VillageProfile.create({
        name,
        village,
        currentCity,
        occupation,
        bio,
        contactDetails: parsedContactDetails,
        photo: photoUrl,
      });

      res.status(201).json({
        success: true,
        message: "Profile created successfully",
        data: profile,
      });
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({
        success: false,
        message: "Error creating profile",
        error: error.message,
      });
    }
  }
);

// Update profile (Admin only)
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("photo"),
  async (req, res) => {
    try {
      const {
        name,
        village,
        currentCity,
        occupation,
        bio,
        contactDetails,
        isActive,
      } = req.body;

      const profile = await VillageProfile.findById(req.params.id);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
        });
      }

      // Parse contactDetails if it's a string
      let parsedContactDetails = contactDetails;
      if (typeof contactDetails === "string") {
        parsedContactDetails = JSON.parse(contactDetails);
      }

      // Update fields
      if (name) profile.name = name;
      if (village) profile.village = village;
      if (currentCity) profile.currentCity = currentCity;
      if (occupation) profile.occupation = occupation;
      if (bio !== undefined) profile.bio = bio;
      if (parsedContactDetails) profile.contactDetails = parsedContactDetails;
      if (isActive !== undefined) profile.isActive = isActive;

      // Upload new photo if provided
      if (req.file) {
        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          "village-profiles"
        );
        profile.photo = uploadResult.url;
      }

      await profile.save();

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: profile,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({
        success: false,
        message: "Error updating profile",
        error: error.message,
      });
    }
  }
);

// Delete profile (Admin only)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const profile = await VillageProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    await profile.deleteOne();

    res.status(200).json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting profile",
      error: error.message,
    });
  }
});

export default router;
