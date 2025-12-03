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
  age: {
    type: Number,
    required: [true, "Age is required"],
    min: 16,
  },
  address: {
    city: String,
    state: String,
  },
  occupation: String,
  education: String,
  skills: [String],
  interests: {
    type: [String],
    enum: [
      "healthcare",
      "education",
      "rural-development",
      "social-justice",
      "events",
      "fundraising",
    ],
  },
  availability: {
    type: String,
    enum: ["weekends", "weekdays", "flexible", "full-time"],
  },
  experience: String,
  reason: {
    type: String,
    required: [true, "Please tell us why you want to volunteer"],
  },
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
