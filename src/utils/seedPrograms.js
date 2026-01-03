import mongoose from "mongoose";
import dotenv from "dotenv";
import Program from "../models/Program.js";

dotenv.config();

const programData = [
  {
    id: "healthcare",
    title: "Healthcare Initiatives",
    description: "Improving healthcare access in rural communities",
    order: 1,
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
    order: 2,
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
    order: 3,
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
    order: 4,
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

const seedPrograms = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Clear existing programs
    await Program.deleteMany({});
    console.log("🗑️  Cleared existing programs");

    // Insert program data
    await Program.insertMany(programData);
    console.log("✅ Programs seeded successfully!");
    console.log(`📊 Inserted ${programData.length} programs`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding programs:", error.message);
    process.exit(1);
  }
};

seedPrograms();
