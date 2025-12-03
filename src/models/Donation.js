import mongoose from "mongoose";

const donationSchema = new mongoose.Schema({
  donor: {
    name: {
      type: String,
      required: [true, "Donor name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    panNumber: {
      type: String,
      uppercase: true,
      validate: {
        validator: function (v) {
          // Only validate if PAN is provided
          if (!v || v === "") return true;
          return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
        },
        message: "Invalid PAN number format",
      },
    },
  },
  amount: {
    type: Number,
    required: [true, "Donation amount is required"],
    min: [1, "Amount must be at least ₹1"],
  },
  program: {
    type: String,
    enum: [
      "healthcare",
      "education",
      "rural-development",
      "social-justice",
      "general",
    ],
    default: "general",
  },
  paymentDetails: {
    orderId: String,
    paymentId: String,
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    method: String,
    paidAt: Date,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  message: String,
  receiptGenerated: {
    type: Boolean,
    default: false,
  },
  receiptUrl: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Donation", donationSchema);
