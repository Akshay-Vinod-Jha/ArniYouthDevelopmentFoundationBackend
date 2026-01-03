import express from "express";
import { body } from "express-validator";
import Contact from "../models/Contact.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";

const router = express.Router();

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone")
      .matches(/^[0-9]{10}$/)
      .withMessage("Valid phone is required"),
    body("subject").trim().notEmpty().withMessage("Subject is required"),
    body("message").trim().notEmpty().withMessage("Message is required"),
  ],
  validate,
  async (req, res) => {
    try {
      const contact = await Contact.create(req.body);

      res.status(201).json({
        success: true,
        message: "Thank you for contacting us! We will get back to you soon.",
        contact: {
          id: contact._id,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to submit contact form",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/contact
// @desc    Get all contacts (Admin)
// @access  Private (Admin)
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = status ? { status } : {};

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Contact.countDocuments(query);

    res.status(200).json({
      success: true,
      contacts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch contacts",
      error: error.message,
    });
  }
});

// @route   GET /api/contact/:id
// @desc    Get single contact by ID (Admin)
// @access  Private (Admin)
router.get("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    res.status(200).json({
      success: true,
      contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact",
      error: error.message,
    });
  }
});

// @route   PUT /api/contact/:id/status
// @desc    Update contact status - mark as read/archived (Admin)
// @access  Private (Admin)
router.put("/:id/status", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, response } = req.body;

    const updateData = {
      status,
      updatedBy: req.user.id,
    };

    if (status === "responded" && response) {
      updateData.response = response;
      updateData.respondedAt = new Date();
    }

    const contact = await Contact.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Contact marked as ${status}`,
      contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update contact status",
      error: error.message,
    });
  }
});

// @route   DELETE /api/contact/:id
// @desc    Delete contact message (Admin)
// @access  Private (Admin)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact message deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete contact",
      error: error.message,
    });
  }
});

export default router;
