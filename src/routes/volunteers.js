import express from "express";
import { body } from "express-validator";
import Volunteer from "../models/Volunteer.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";

const router = express.Router();

// @route   POST /api/volunteers/apply
// @desc    Submit volunteer application
// @access  Public
router.post(
  "/apply",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone")
      .matches(/^[0-9]{10}$/)
      .withMessage("Valid phone is required"),
    body("age").isInt({ min: 16 }).withMessage("Age must be at least 16"),
    body("reason")
      .trim()
      .notEmpty()
      .withMessage("Please tell us why you want to volunteer"),
  ],
  validate,
  async (req, res) => {
    try {
      const volunteerData = req.body;

      const volunteer = await Volunteer.create(volunteerData);

      res.status(201).json({
        success: true,
        message:
          "Application submitted successfully! We will contact you soon.",
        volunteer: {
          id: volunteer._id,
          name: volunteer.name,
          email: volunteer.email,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Application submission failed",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/volunteers
// @desc    Get all volunteers (Admin)
// @access  Private (Admin)
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = status ? { status } : {};

    const volunteers = await Volunteer.find(query)
      .sort({ appliedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Volunteer.countDocuments(query);

    res.status(200).json({
      success: true,
      volunteers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch volunteers",
      error: error.message,
    });
  }
});

// @route   GET /api/volunteers/:id
// @desc    Get single volunteer by ID (Admin)
// @access  Private (Admin)
router.get("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer application not found",
      });
    }

    res.status(200).json({
      success: true,
      volunteer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch volunteer",
      error: error.message,
    });
  }
});

// @route   PUT /api/volunteers/:id/approve
// @desc    Approve volunteer application (Admin)
// @access  Private (Admin)
router.put("/:id/approve", protect, authorize("admin"), async (req, res) => {
  try {
    const { notes } = req.body;

    const volunteer = await Volunteer.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        notes,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer application not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Volunteer application approved successfully",
      volunteer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve application",
      error: error.message,
    });
  }
});

// @route   PUT /api/volunteers/:id/reject
// @desc    Reject volunteer application (Admin)
// @access  Private (Admin)
router.put("/:id/reject", protect, authorize("admin"), async (req, res) => {
  try {
    const { notes } = req.body;

    const volunteer = await Volunteer.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        notes,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer application not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Volunteer application rejected",
      volunteer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reject application",
      error: error.message,
    });
  }
});

// @route   PATCH /api/volunteers/:id/status
// @desc    Update volunteer status (Admin)
// @access  Private (Admin)
router.patch("/:id/status", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, notes } = req.body;

    const volunteer = await Volunteer.findByIdAndUpdate(
      req.params.id,
      {
        status,
        notes,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer application not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      volunteer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
});

export default router;
