import express from "express";
import { body } from "express-validator";
import Member from "../models/Member.js";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";
import { createOrder, verifyPayment } from "../utils/razorpay.js";

const router = express.Router();

// @route   POST /api/members/register
// @desc    Register new member with payment
// @access  Public
router.post(
  "/register",
  [
    body("userId").notEmpty().withMessage("User ID is required"),
    body("address.city").optional().trim(),
    body("address.state").optional().trim(),
    body("address.pincode")
      .optional()
      .matches(/^[0-9]{6}$/),
    body("occupation").optional().trim(),
    body("dateOfBirth").optional().isISO8601(),
  ],
  validate,
  async (req, res) => {
    try {
      const { userId, address, occupation, dateOfBirth } = req.body;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if already a member
      const existingMember = await Member.findOne({ user: userId });
      if (existingMember && existingMember.isActive) {
        return res.status(400).json({
          success: false,
          message: "User is already an active member",
        });
      }

      // Create Razorpay order
      const membershipAmount = 500;
      const receiptId = `MEM${Date.now()}`;
      const order = await createOrder(membershipAmount, receiptId);

      // Calculate expiry date (1 year from now)
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      // Create member (payment pending)
      const member = await Member.create({
        user: userId,
        address,
        occupation,
        dateOfBirth,
        membershipExpiryDate: expiryDate,
        paymentDetails: {
          orderId: order.orderId,
          amount: membershipAmount,
          status: "pending",
        },
      });

      res.status(201).json({
        success: true,
        message: "Membership registration initiated",
        member: {
          id: member._id,
          membershipId: member.membershipId,
        },
        order: {
          orderId: order.orderId,
          amount: order.amount,
          currency: order.currency,
          key: process.env.RAZORPAY_KEY_ID,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Membership registration failed",
        error: error.message,
      });
    }
  }
);

// @route   POST /api/members/verify-payment
// @desc    Verify payment and activate membership
// @access  Public
router.post("/verify-payment", async (req, res) => {
  try {
    const { memberId, orderId, paymentId, signature } = req.body;

    // Verify payment signature
    const isValid = verifyPayment(orderId, paymentId, signature);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Update member payment status
    const member = await Member.findByIdAndUpdate(
      memberId,
      {
        "paymentDetails.paymentId": paymentId,
        "paymentDetails.status": "completed",
        "paymentDetails.paidAt": new Date(),
        isActive: true,
      },
      { new: true }
    ).populate("user", "name email phone");

    // Update user role to member
    await User.findByIdAndUpdate(member.user._id, { role: "member" });

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      member: {
        id: member._id,
        membershipId: member.membershipId,
        expiryDate: member.membershipExpiryDate,
        user: member.user,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
});

// @route   GET /api/members/profile
// @desc    Get member profile
// @access  Private (Member)
router.get(
  "/profile",
  protect,
  authorize("member", "admin"),
  async (req, res) => {
    try {
      const member = await Member.findOne({ user: req.user.id }).populate(
        "user",
        "name email phone"
      );

      if (!member) {
        return res.status(404).json({
          success: false,
          message: "Member profile not found",
        });
      }

      res.status(200).json({
        success: true,
        member,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch profile",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/members
// @desc    Get all members (Admin only)
// @access  Private (Admin)
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status) {
      query.isActive = status === "active";
    }

    const members = await Member.find(query)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Member.countDocuments(query);

    res.status(200).json({
      success: true,
      members,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch members",
      error: error.message,
    });
  }
});

// @route   GET /api/members/:id
// @desc    Get single member by ID (Admin only)
// @access  Private (Admin)
router.get("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).populate(
      "user",
      "name email phone"
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    res.status(200).json({
      success: true,
      member,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch member",
      error: error.message,
    });
  }
});

// @route   PUT /api/members/:id/status
// @desc    Update member status (Admin only)
// @access  Private (Admin)
router.put("/:id/status", protect, authorize("admin"), async (req, res) => {
  try {
    const { isActive, notes } = req.body;

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      {
        isActive,
        notes,
        updatedBy: req.user.id,
      },
      { new: true }
    ).populate("user", "name email phone");

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // Update user role if deactivating
    if (!isActive) {
      await User.findByIdAndUpdate(member.user._id, { role: "user" });
    }

    res.status(200).json({
      success: true,
      message: `Member ${isActive ? "activated" : "deactivated"} successfully`,
      member,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update member status",
      error: error.message,
    });
  }
});

// @route   DELETE /api/members/admin/:id
// @desc    Delete member (Admin only)
// @access  Private (Admin)
router.delete("/admin/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // Update user role back to user
    await User.findByIdAndUpdate(member.user, { role: "user" });

    await member.deleteOne();

    res.status(200).json({
      success: true,
      message: "Member deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete member",
      error: error.message,
    });
  }
});

export default router;
