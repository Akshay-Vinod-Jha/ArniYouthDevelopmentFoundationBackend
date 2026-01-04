import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  membershipId: {
    type: String,
    unique: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  occupation: String,
  dateOfBirth: Date,
  membershipStartDate: {
    type: Date,
    default: Date.now,
  },
  membershipExpiryDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  paymentDetails: {
    orderId: String,
    paymentId: String,
    amount: {
      type: Number,
      default: 500,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paidAt: Date,
  },
  digitalIdUrl: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate membership ID before saving
memberSchema.pre("save", async function (next) {
  if (!this.membershipId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Member").countDocuments();
    this.membershipId = `AYDF${year}${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

export default mongoose.model("Member", memberSchema);
