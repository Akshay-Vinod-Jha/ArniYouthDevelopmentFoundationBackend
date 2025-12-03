import mongoose from "mongoose";

const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  position: {
    type: String,
    required: [true, "Position is required"],
    enum: ["president", "secretary", "supervisor", "member"],
  },
  boardType: {
    type: String,
    required: [true, "Board type is required"],
    enum: [
      "health",
      "education",
      "city-development",
      "social-justice",
      "outreach",
    ],
  },
  email: {
    type: String,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
  },
  phone: String,
  bio: String,
  image: {
    url: String,
    publicId: String,
  },
  linkedIn: String,
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Board", boardSchema);
