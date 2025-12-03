import express from "express";
const router = express.Router();

// Static program data
const programs = [
  {
    id: "healthcare",
    title: "Healthcare Initiatives",
    description: "Improving healthcare access in rural communities",
    initiatives: [
      {
        name: "Blood Donation Camps",
        description:
          "Regular blood donation camps in collaboration with district blood banks",
        icon: "droplet",
      },
      {
        name: "Medical Equipment Bank",
        description:
          "Establishing and expanding medical equipment bank for needy patients",
        icon: "heart-pulse",
      },
      {
        name: "Health Checkup & Awareness",
        description:
          "Conducting health checkups, cancer awareness camps, and specialist consultations",
        icon: "stethoscope",
      },
      {
        name: "Multi-City Patient Support",
        description:
          "Providing ambulance, accommodation, and guidance for multi-city medical needs",
        icon: "ambulance",
      },
    ],
  },
  {
    id: "education",
    title: "Education Initiatives",
    description: "Empowering students through education and guidance",
    initiatives: [
      {
        name: "Scholarships",
        description: "Offering scholarships to deserving rural students",
        icon: "graduation-cap",
      },
      {
        name: "Career Guidance",
        description:
          "Subject-based seminars and career guidance sessions in schools",
        icon: "users",
      },
      {
        name: "School Awareness Sessions",
        description:
          "Building platforms to connect donors, corporates, and students",
        icon: "book-open",
      },
    ],
  },
  {
    id: "rural-development",
    title: "City & Rural Development",
    description: "Sustainable community development initiatives",
    initiatives: [
      {
        name: "Environment & Cleanliness",
        description:
          "Addressing environmental issues like dumping grounds and cleanliness",
        icon: "recycle",
      },
      {
        name: "Infrastructure Support",
        description: "Working on rural/urban infrastructure improvements",
        icon: "building",
      },
      {
        name: "Community Development",
        description:
          "Taking initiatives on local issues affecting community wellbeing",
        icon: "home",
      },
    ],
  },
  {
    id: "social-justice",
    title: "Social Justice & Legal Support",
    description: "Empowering communities through legal awareness and support",
    initiatives: [
      {
        name: "Legal Guidance",
        description:
          "Providing guidance, motivation, and support to victims seeking justice",
        icon: "scale",
      },
      {
        name: "Rights Awareness",
        description:
          "Spreading legal awareness, especially among disadvantaged groups",
        icon: "shield",
      },
    ],
  },
];

// @route   GET /api/programs
// @desc    Get all programs
// @access  Public
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    programs,
  });
});

// @route   GET /api/programs/:id
// @desc    Get program by ID
// @access  Public
router.get("/:id", (req, res) => {
  const program = programs.find((p) => p.id === req.params.id);

  if (!program) {
    return res.status(404).json({
      success: false,
      message: "Program not found",
    });
  }

  res.status(200).json({
    success: true,
    program,
  });
});

export default router;
