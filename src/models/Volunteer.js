import mongoose from "mongoose";

const volunteerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
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
  dateOfBirth: {
    type: Date,
  },
  address: {
    city: String,
    state: String,
  },
  occupation: String,
  skills: [String],
  interests: [String], // Programs of interest
  availability: {
    type: String,
    enum: ["5-10", "10-20", "20+", "flexible"],
    default: "flexible",
  },
  availableDays: [String], // Array of days
  experience: String,
  reason: {
    type: String,
    required: [true, "Please tell us why you want to volunteer"],
  },
  resumeUrl: String, // Cloudinary URL
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "active", "inactive"],
    default: "pending",
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  reviewedAt: Date,
  notes: String,
});

export default mongoose.model("Volunteer", volunteerSchema);
