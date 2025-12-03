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

export default router;
