import mongoose from "mongoose";

const villageProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    photo: {
      type: String,
      default: "",
    },
    village: {
      type: String,
      required: [true, "Village name is required"],
      trim: true,
    },
    currentCity: {
      type: String,
      required: [true, "Current city is required"],
      trim: true,
    },
    occupation: {
      type: String,
      required: [true, "Occupation is required"],
      trim: true,
    },
    contactDetails: {
      phone: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      whatsapp: {
        type: String,
        trim: true,
      },
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search and filter
villageProfileSchema.index({
  name: "text",
  village: "text",
  occupation: "text",
});
villageProfileSchema.index({ village: 1, currentCity: 1, occupation: 1 });

const VillageProfile = mongoose.model("VillageProfile", villageProfileSchema);

export default VillageProfile;
