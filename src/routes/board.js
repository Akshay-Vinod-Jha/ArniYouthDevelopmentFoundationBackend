import express from "express";
import Board from "../models/Board.js";
import { protect, authorize } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const router = express.Router();

// @route   GET /api/board
// @desc    Get all board members
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { boardType } = req.query;

    const query = { isActive: true };
    if (boardType) query.boardType = boardType;

    const boardMembers = await Board.find(query).sort({
      order: 1,
      position: 1,
    });

    // Group by board type
    const grouped = boardMembers.reduce((acc, member) => {
      if (!acc[member.boardType]) {
        acc[member.boardType] = [];
      }
      acc[member.boardType].push(member);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      boardMembers: grouped,
      total: boardMembers.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch board members",
      error: error.message,
    });
  }
});

// @route   POST /api/board
// @desc    Add board member (Admin)
// @access  Private (Admin)
router.post(
  "/",
  protect,
  authorize("admin"),
  uploadImage.single("image"),
  async (req, res) => {
    try {
      const boardData = req.body;

      // Upload image if provided
      if (req.file) {
        const imageResult = await uploadToCloudinary(
          req.file.buffer,
          "aydf/board"
        );
        boardData.image = imageResult;
      }

      const boardMember = await Board.create(boardData);

      res.status(201).json({
        success: true,
        message: "Board member added successfully",
        boardMember,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to add board member",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/board/admin/all
// @desc    Get all board members for admin
// @access  Private (Admin)
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 50, boardType } = req.query;

    const query = {};
    if (boardType) query.boardType = boardType;

    const boardMembers = await Board.find(query)
      .sort({ order: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Board.countDocuments(query);

    res.status(200).json({
      success: true,
      boardMembers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch board members",
      error: error.message,
    });
  }
});

// @route   PUT /api/board/admin/:id
// @desc    Update board member (Admin)
// @access  Private (Admin)
router.put(
  "/admin/:id",
  protect,
  authorize("admin"),
  uploadImage.single("image"),
  async (req, res) => {
    try {
      const boardMember = await Board.findById(req.params.id);

      if (!boardMember) {
        return res.status(404).json({
          success: false,
          message: "Board member not found",
        });
      }

      const updateData = req.body;

      // Upload new image if provided
      if (req.file) {
        // Delete old image from Cloudinary
        if (boardMember.image?.public_id) {
          await deleteFromCloudinary(boardMember.image.public_id);
        }

        const imageResult = await uploadToCloudinary(
          req.file.buffer,
          "aydf/board"
        );
        updateData.image = imageResult;
      }

      Object.assign(boardMember, updateData);
      await boardMember.save();

      res.status(200).json({
        success: true,
        message: "Board member updated successfully",
        boardMember,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update board member",
        error: error.message,
      });
    }
  }
);

// @route   DELETE /api/board/admin/:id
// @desc    Delete board member (Admin)
// @access  Private (Admin)
router.delete("/admin/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const boardMember = await Board.findById(req.params.id);

    if (!boardMember) {
      return res.status(404).json({
        success: false,
        message: "Board member not found",
      });
    }

    // Delete image from Cloudinary
    if (boardMember.image?.public_id) {
      await deleteFromCloudinary(boardMember.image.public_id);
    }

    await boardMember.deleteOne();

    res.status(200).json({
      success: true,
      message: "Board member deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete board member",
      error: error.message,
    });
  }
});

export default router;
