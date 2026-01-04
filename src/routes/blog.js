import express from "express";
import Blog from "../models/Blog.js";
import { protect, authorize } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const router = express.Router();

// @route   GET /api/blog/published
// @desc    Get all published blogs (simple endpoint for public display)
// @access  Public
router.get("/published", async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true })
      .populate("author", "name")
      .sort({ publishedAt: -1 });

    res.status(200).json({
      success: true,
      blogs,
      total: blogs.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
      error: error.message,
    });
  }
});

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

// ============= ADMIN ROUTES =============

// @route   GET /api/blog/admin/all
// @desc    Get all blogs including unpublished (Admin)
// @access  Private (Admin)
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const { category, page = 1, limit = 10, published } = req.query;

    const query = {};
    if (category) query.category = category;
    if (published !== undefined) query.published = published === "true";

    const blogs = await Blog.find(query)
      .populate("author", "name")
      .sort({ createdAt: -1 })
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

// @route   POST /api/blog
// @desc    Create new blog (Admin)
// @access  Private (Admin)
router.post(
  "/",
  protect,
  authorize("admin"),
  uploadImage.single("featuredImage"),
  async (req, res) => {
    try {
      console.log("=== Blog Creation Request ===");
      console.log("Request body:", req.body);
      console.log("Request file:", req.file ? "File present" : "No file");
      console.log("User ID:", req.user?.id);

      const blogData = {
        ...req.body,
        author: req.user.id,
      };

      // Convert category to lowercase to match enum values
      if (blogData.category) {
        blogData.category = blogData.category.toLowerCase();
      }

      console.log("Blog data before image upload:", blogData);

      if (req.file) {
        console.log("Uploading image to Cloudinary...");
        const imageResult = await uploadToCloudinary(
          req.file.buffer,
          "aydf/blog"
        );
        console.log("Image upload result:", imageResult);
        blogData.featuredImage = imageResult;
      }

      if (blogData.published === "true" || blogData.published === true) {
        blogData.published = true;
        blogData.publishedAt = new Date();
      }

      console.log("Final blog data:", blogData);
      console.log("Creating blog in database...");

      const blog = await Blog.create(blogData);

      console.log("Blog created successfully:", blog._id);

      res.status(201).json({
        success: true,
        message: "Blog created successfully",
        blog,
      });
    } catch (error) {
      console.error("=== Blog Creation Error ===");
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Error details:", error);

      res.status(500).json({
        success: false,
        message: "Failed to create blog",
        error: error.message,
      });
    }
  }
);

// @route   PUT /api/blog/admin/:id
// @desc    Update blog (Admin)
// @access  Private (Admin)
router.put(
  "/admin/:id",
  protect,
  authorize("admin"),
  uploadImage.single("featuredImage"),
  async (req, res) => {
    try {
      const blog = await Blog.findById(req.params.id);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found",
        });
      }

      const updateData = { ...req.body };

      // Convert category to lowercase to match enum values
      if (updateData.category) {
        updateData.category = updateData.category.toLowerCase();
      }

      if (req.file) {
        const imageResult = await uploadToCloudinary(
          req.file.buffer,
          "aydf/blog"
        );
        updateData.featuredImage = imageResult;
      }

      if (updateData.published === "true" || updateData.published === true) {
        updateData.published = true;
        if (!blog.publishedAt) {
          updateData.publishedAt = new Date();
        }
      } else {
        updateData.published = false;
      }

      const updatedBlog = await Blog.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).populate("author", "name");

      res.status(200).json({
        success: true,
        message: "Blog updated successfully",
        blog: updatedBlog,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update blog",
        error: error.message,
      });
    }
  }
);

// @route   DELETE /api/blog/admin/:id
// @desc    Delete blog (Admin)
// @access  Private (Admin)
router.delete("/admin/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    await blog.deleteOne();

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete blog",
      error: error.message,
    });
  }
});

export default router;
