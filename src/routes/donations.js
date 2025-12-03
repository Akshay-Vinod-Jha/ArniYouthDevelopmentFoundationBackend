import express from "express";
import { body } from "express-validator";
import Donation from "../models/Donation.js";
import { createOrder, verifyPayment } from "../utils/razorpay.js";
import { validate } from "../middleware/validator.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/donations/create
// @desc    Create donation order
// @access  Public
router.post(
  "/create",
  [
    body("donor.name").trim().notEmpty().withMessage("Donor name is required"),
    body("donor.email").isEmail().withMessage("Valid email is required"),
    body("donor.phone")
      .matches(/^[0-9]{10}$/)
      .withMessage("Valid phone number is required"),
    body("amount").isInt({ min: 1 }).withMessage("Amount must be at least ₹1"),
    body("program")
      .optional()
      .isIn([
        "healthcare",
        "education",
        "rural-development",
        "social-justice",
        "general",
      ]),
  ],
  validate,
  async (req, res) => {
    try {
      const { donor, amount, program, message, isAnonymous } = req.body;

      // Create Razorpay order
      const receiptId = `DON${Date.now()}`;
      const order = await createOrder(amount, receiptId);

      // Create donation record
      const donation = await Donation.create({
        donor,
        amount,
        program: program || "general",
        message,
        isAnonymous: isAnonymous || false,
        paymentDetails: {
          orderId: order.orderId,
          status: "pending",
        },
      });

      res.status(201).json({
        success: true,
        message: "Donation order created",
        donation: {
          id: donation._id,
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
        message: "Failed to create donation",
        error: error.message,
      });
    }
  }
);

// @route   POST /api/donations/verify
// @desc    Verify donation payment
// @access  Public
router.post("/verify", async (req, res) => {
  try {
    const { donationId, orderId, paymentId, signature } = req.body;

    const isValid = verifyPayment(orderId, paymentId, signature);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const donation = await Donation.findByIdAndUpdate(
      donationId,
      {
        "paymentDetails.paymentId": paymentId,
        "paymentDetails.status": "completed",
        "paymentDetails.paidAt": new Date(),
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Donation successful! Thank you for your contribution.",
      donation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
});

// @route   GET /api/donations
// @desc    Get all donations (Admin)
// @access  Private (Admin)
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, program } = req.query;

    const query = {};
    if (status) query["paymentDetails.status"] = status;
    if (program) query.program = program;

    const donations = await Donation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Donation.countDocuments(query);
    const totalAmount = await Donation.aggregate([
      { $match: { "paymentDetails.status": "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.status(200).json({
      success: true,
      donations,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
      totalAmount: totalAmount[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch donations",
      error: error.message,
    });
  }
});

// @route   GET /api/donations/stats
// @desc    Get donation statistics
// @access  Public
router.get("/stats", async (req, res) => {
  try {
    const stats = await Donation.aggregate([
      { $match: { "paymentDetails.status": "completed" } },
      {
        $group: {
          _id: "$program",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalDonations = await Donation.countDocuments({
      "paymentDetails.status": "completed",
    });
    const totalAmount = stats.reduce((sum, item) => sum + item.totalAmount, 0);

    res.status(200).json({
      success: true,
      stats: {
        totalDonations,
        totalAmount,
        byProgram: stats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
      error: error.message,
    });
  }
});

export default router;
