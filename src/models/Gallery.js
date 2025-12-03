import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  description: String,
  type: {
    type: String,
    enum: ["image", "video"],
    required: true,
  },
  media: {
    url: {
      type: String,
      required: true,
    },
    publicId: String,
    thumbnail: String,
  },
  category: {
    type: String,
    enum: [
      "healthcare",
      "education",
      "development",
      "justice",
      "events",
      "general",
    ],
    default: "general",
  },
  tags: [String],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Gallery", gallerySchema);
