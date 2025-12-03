import express from "express";
import Gallery from "../models/Gallery.js";
import { protect, authorize } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

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
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Media file is required",
        });
      }

      const mediaResult = await uploadToCloudinary(
        req.file.buffer,
        "aydf/gallery"
      );

      const galleryItem = await Gallery.create({
        ...req.body,
        type: "image",
        media: mediaResult,
        uploadedBy: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: "Gallery item uploaded successfully",
        item: galleryItem,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to upload gallery item",
        error: error.message,
      });
    }
  }
);

export default router;
