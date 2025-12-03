import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Blog title is required"],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  content: {
    type: String,
    required: [true, "Blog content is required"],
  },
  excerpt: {
    type: String,
    maxlength: 200,
  },
  featuredImage: {
    url: String,
    publicId: String,
  },
  category: {
    type: String,
    enum: [
      "healthcare",
      "education",
      "development",
      "justice",
      "events",
      "success-story",
      "general",
    ],
    default: "general",
  },
  tags: [String],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  published: {
    type: Boolean,
    default: false,
  },
  publishedAt: Date,
  views: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate slug before saving
blogSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  if (this.isModified("content") && !this.excerpt) {
    this.excerpt = this.content.substring(0, 200).trim() + "...";
  }
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Blog", blogSchema);
