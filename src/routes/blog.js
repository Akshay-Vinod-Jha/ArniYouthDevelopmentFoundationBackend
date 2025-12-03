import express from "express";
import Blog from "../models/Blog.js";
import { protect, authorize } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const router = express.Router();

// @route   GET /api/blog
// @desc    Get all published blogs
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;

    const query = { published: true };
    if (category) query.category = category;

    const blogs = await Blog.find(query)
      .populate("author", "name")
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      blogs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
      error: error.message,
    });
  }
});

// @route   GET /api/blog/:slug
// @desc    Get blog by slug
// @access  Public
router.get("/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, published: true },
      { $inc: { views: 1 } },
      { new: true }
    ).populate("author", "name");

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
      error: error.message,
    });
  }
});

// @route   POST /api/blog
// @desc    Create new blog (Admin)
// @access  Private (Admin)
router.post(
  "/",
  protect,
  authorize("admin"),
  uploadImage.single("image"),
  async (req, res) => {
    try {
      const blogData = {
        ...req.body,
        author: req.user.id,
      };

      if (req.file) {
        const imageResult = await uploadToCloudinary(
          req.file.buffer,
          "aydf/blog"
        );
        blogData.featuredImage = imageResult;
      }

      if (blogData.published === "true" || blogData.published === true) {
        blogData.published = true;
        blogData.publishedAt = new Date();
      }

      const blog = await Blog.create(blogData);

      res.status(201).json({
        success: true,
        message: "Blog created successfully",
        blog,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create blog",
        error: error.message,
      });
    }
  }
);

export default router;
