import express from "express";
import Program from "../models/Program.js";
import { protect, authorize } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const router = express.Router();

// @route   GET /api/programs
// @desc    Get all active programs
// @access  Public
router.get("/", async (req, res) => {
  try {
    const programs = await Program.find({ isActive: true }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      programs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch programs",
      error: error.message,
    });
  }
});

// @route   GET /api/programs/:id
// @desc    Get program by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const program = await Program.findOne({
      id: req.params.id,
      isActive: true,
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    res.status(200).json({
      success: true,
      program,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch program",
      error: error.message,
    });
  }
});

// ============= ADMIN ROUTES =============

// @route   GET /api/programs/admin/all
// @desc    Get all programs (including inactive) - Admin only
// @access  Private/Admin
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const programs = await Program.find().sort({ order: 1 });

    res.status(200).json({
      success: true,
      programs,
      total: programs.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch programs",
      error: error.message,
    });
  }
});

// @route   POST /api/programs
// @desc    Create new program - Admin only
// @access  Private/Admin
router.post(
  "/",
  protect,
  authorize("admin"),
  uploadImage.single("image"),
  async (req, res) => {
    try {
      const programData = { ...req.body };

      // Handle objectives if sent as string
      if (typeof programData.objectives === "string") {
        programData.objectives = programData.objectives
          .split(",")
          .map((obj) => obj.trim())
          .filter((obj) => obj);
      }

      // Upload image to Cloudinary if provided
      if (req.file) {
        const imageResult = await uploadToCloudinary(
          req.file.buffer,
          "aydf/programs"
        );
        programData.image = {
          url: imageResult.url,
          publicId: imageResult.publicId,
        };
      }

      const program = await Program.create(programData);

      res.status(201).json({
        success: true,
        message: "Program created successfully",
        program,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create program",
        error: error.message,
      });
    }
  }
);

// @route   PUT /api/programs/:id
// @desc    Update program - Admin only
// @access  Private/Admin
router.put(
  "/:id",
  protect,
  authorize("admin"),
  uploadImage.single("image"),
  async (req, res) => {
    try {
      const programData = { ...req.body };

      // Handle objectives if sent as string
      if (typeof programData.objectives === "string") {
        programData.objectives = programData.objectives
          .split(",")
          .map((obj) => obj.trim())
          .filter((obj) => obj);
      }

      // Find existing program
      const existingProgram = await Program.findOne({ id: req.params.id });
      if (!existingProgram) {
        return res.status(404).json({
          success: false,
          message: "Program not found",
        });
      }

      // Upload new image if provided
      if (req.file) {
        // Delete old image from Cloudinary if exists
        if (existingProgram.image?.publicId) {
          await deleteFromCloudinary(existingProgram.image.publicId);
        }

        const imageResult = await uploadToCloudinary(
          req.file.buffer,
          "aydf/programs"
        );
        programData.image = {
          url: imageResult.url,
          publicId: imageResult.publicId,
        };
      }

      const program = await Program.findOneAndUpdate(
        { id: req.params.id },
        programData,
        {
          new: true,
          runValidators: true,
        }
      );

      res.status(200).json({
        success: true,
        message: "Program updated successfully",
        program,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update program",
        error: error.message,
      });
    }
  }
);

// @route   DELETE /api/programs/:id
// @desc    Delete program - Admin only
// @access  Private/Admin
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const program = await Program.findOneAndDelete({ id: req.params.id });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    // Delete image from Cloudinary if exists
    if (program.image?.publicId) {
      await deleteFromCloudinary(program.image.publicId);
    }

    res.status(200).json({
      success: true,
      message: "Program deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete program",
      error: error.message,
    });
  }
});

export default router;
