import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Program title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Program description is required"],
      trim: true,
    },
    image: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },
    category: {
      type: String,
      enum: [
        "healthcare",
        "education",
        "rural-development",
        "social-justice",
        "environment",
        "other",
      ],
      default: "other",
    },
    objectives: [
      {
        type: String,
        trim: true,
      },
    ],
    targetAudience: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "upcoming", "on-hold"],
      default: "active",
    },
    initiatives: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
        },
        icon: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate ID if not provided
programSchema.pre("save", function (next) {
  if (!this.id && this.isNew) {
    // Generate ID from title: lowercase, replace spaces with hyphens
    this.id = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Add timestamp suffix to ensure uniqueness
    this.id += `-${Date.now()}`;
  }
  next();
});

export default mongoose.model("Program", programSchema);
