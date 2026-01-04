import express from "express";
import Gallery from "../models/Gallery.js";
import { protect, authorize } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const router = express.Router();

// @route   GET /api/gallery
// @desc    Get all gallery items
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { type, category, featured } = req.query;

    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (featured) query.featured = featured === "true";

    const items = await Gallery.find(query).sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      items,
      total: items.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery",
      error: error.message,
    });
  }
});

// @route   GET /api/gallery/admin/all
// @desc    Get all gallery items for admin (Image Library)
// @access  Private (Admin)
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 50, type, category } = req.query;

    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;

    const items = await Gallery.find(query)
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Gallery.countDocuments(query);

    res.status(200).json({
      success: true,
      items,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery items",
      error: error.message,
    });
  }
});

// @route   POST /api/gallery
// @desc    Upload gallery item (Admin)
// @access  Private (Admin)
router.post(
  "/",
  protect,
  authorize("admin"),
  uploadImage.single("media"),
  async (req, res) => {
    try {
      console.log("=== Gallery Upload Request ===");
      console.log("Request body:", req.body);
      console.log("Request file:", req.file ? "File present" : "No file");
      console.log("User ID:", req.user?.id);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Media file is required",
        });
      }

      console.log("Uploading to Cloudinary...");
      const mediaResult = await uploadToCloudinary(
        req.file.buffer,
        "aydf/gallery"
      );
      console.log("Cloudinary upload result:", mediaResult);

      console.log("Creating gallery item in database...");

      // Convert category to lowercase to match enum values
      const galleryData = {
        ...req.body,
        type: "image",
        media: mediaResult,
        uploadedBy: req.user.id,
      };

      if (galleryData.category) {
        galleryData.category = galleryData.category.toLowerCase();
      }

      const galleryItem = await Gallery.create(galleryData);
      console.log("Gallery item created:", galleryItem._id);

      res.status(201).json({
        success: true,
        message: "Gallery item uploaded successfully",
        item: galleryItem,
      });
    } catch (error) {
      console.error("=== Gallery Upload Error ===");
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Error details:", error);

      res.status(500).json({
        success: false,
        message: "Failed to upload gallery item",
        error: error.message,
      });
    }
  }
);

// @route   DELETE /api/gallery/admin/:id
// @desc    Delete gallery item (Admin)
// @access  Private (Admin)
router.delete("/admin/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);

    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    // Delete from Cloudinary
    if (galleryItem.media?.public_id) {
      await deleteFromCloudinary(galleryItem.media.public_id);
    }

    await galleryItem.deleteOne();

    res.status(200).json({
      success: true,
      message: "Gallery item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete gallery item",
      error: error.message,
    });
  }
});

export default router;
