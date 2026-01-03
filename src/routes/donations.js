import express from "express";
import { body } from "express-validator";
import Donation from "../models/Donation.js";
import { createOrder, verifyPayment } from "../utils/razorpay.js";
import { sendDonationReceipt } from "../utils/email.js";
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

      console.log("Received donation request:", { donor, amount, program });

      // Create Razorpay order
      const receiptId = `DON${Date.now()}`;
      const order = await createOrder(amount, receiptId);

      console.log("Razorpay order created:", order);

      // Clean donor data - remove empty PAN if present
      const donorData = { ...donor };
      if (!donorData.panNumber || donorData.panNumber.trim() === "") {
        delete donorData.panNumber;
      }

      // Create donation record
      const donation = await Donation.create({
        donor: donorData,
        amount,
        program: program || "general",
        message,
        isAnonymous: isAnonymous || false,
        paymentDetails: {
          orderId: order.orderId,
          status: "pending",
        },
      });

      console.log("Donation record created:", donation._id);

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
      console.error("Error creating donation:", error);
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

    console.log("🔍 Verifying payment:", { donationId, orderId, paymentId });

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

    console.log("💾 Donation updated:", donation._id);
    console.log("📧 Anonymous donation?", donation.isAnonymous);

    // Return donation data - frontend will handle email
    res.status(200).json({
      success: true,
      message: "Donation successful! Thank you for your contribution.",
      donation,
      sendEmail: !donation.isAnonymous, // Flag for frontend to send email
    });
  } catch (error) {
    console.error("❌ Error in verify route:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
});

// @route   POST /api/donations/test-email
// @desc    Test email sending (for debugging)
// @access  Public
router.post("/test-email", async (req, res) => {
  try {
    const { email } = req.body;

    console.log(
      "🧪 Testing email send to:",
      email || "akshayjha2006@gmail.com"
    );

    const result = await sendDonationReceipt({
      donor: {
        name: "Test User",
        email: email || "akshayjha2006@gmail.com",
      },
      amount: 100,
      paymentId: "test_payment_123",
      donationId: "test_donation_123",
      program: "general",
    });

    res.status(200).json({
      success: true,
      message: "Test email sent",
      result: result,
    });
  } catch (error) {
    console.error("❌ Test email failed:", error);
    res.status(500).json({
      success: false,
      message: "Test email failed",
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

// @route   GET /api/donations/admin/all
// @desc    Get all donations with filters (Admin)
// @access  Private (Admin)
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      program,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
    } = req.query;

    const query = {};
    if (status) query["paymentDetails.status"] = status;
    if (program) query.program = program;

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseInt(minAmount);
      if (maxAmount) query.amount.$lte = parseInt(maxAmount);
    }

    const donations = await Donation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Donation.countDocuments(query);

    res.status(200).json({
      success: true,
      donations,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch donations",
      error: error.message,
    });
  }
});

// @route   GET /api/donations/export
// @desc    Export donations as CSV (Admin)
// @access  Private (Admin)
router.get("/export", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, program, dateFrom, dateTo } = req.query;

    const query = { "paymentDetails.status": "completed" };
    if (program) query.program = program;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const donations = await Donation.find(query).sort({ createdAt: -1 });

    // Generate CSV
    const csvRows = [
      [
        "Date",
        "Donor Name",
        "Email",
        "Phone",
        "Amount",
        "Program",
        "Payment ID",
        "Anonymous",
      ],
    ];

    donations.forEach((donation) => {
      csvRows.push([
        new Date(donation.createdAt).toLocaleDateString(),
        donation.isAnonymous ? "Anonymous" : donation.donor.name,
        donation.isAnonymous ? "" : donation.donor.email,
        donation.isAnonymous ? "" : donation.donor.phone,
        donation.amount,
        donation.program,
        donation.paymentDetails.paymentId || "",
        donation.isAnonymous ? "Yes" : "No",
      ]);
    });

    const csv = csvRows.map((row) => row.join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=donations-${Date.now()}.csv`
    );
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to export donations",
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
