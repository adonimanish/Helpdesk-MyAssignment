// Step-by-step server - add pieces gradually to find the issue

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";
import User from "./models/UserModel.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));

app.use(express.json());

const checkEnvironment = () => {
  console.log("Environment Check:");
  if (!process.env.JWT_SECRET) {
    console.log("Setting default JWT_SECRET for development");
    process.env.JWT_SECRET = "development-jwt-secret-key-change-in-production";
  }
};

const createDefaultUser = async () => {
  try {
    const existingUser = await User.findOne({ email: "test@example.com" });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const defaultUser = new User({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        role: "user"
      });
      await defaultUser.save();
      console.log("Default test user created: test@example.com / password123");
    }
  } catch (error) {
    console.error("Failed to create default user:", error.message);
  }
};

const startServer = async () => {
  try {
    checkEnvironment();
    
    console.log("Starting MongoDB Memory Server...");
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
      console.log("In-memory MongoDB connected");
    }

    await createDefaultUser();

    // STEP 1: Just root route - should work
    console.log("STEP 1: Adding root route...");
    app.get("/", (req, res) => {
      res.json({ message: "Server working", status: "OK" });
    });

    // STEP 2: Try to start server WITHOUT any other routes
    console.log("STEP 2: Starting server with just root route...");
    
    const PORT = process.env.PORT || 5000;
    
    const server = app.listen(PORT, () => {
      console.log(`SUCCESS: Server running on http://localhost:${PORT}`);
      console.log("Root route is working. Now let's add routes one by one...");
      
      // STEP 3: Add routes after server starts
      setTimeout(async () => {
        try {
          console.log("STEP 3: Adding auth routes...");
          const authRoutes = await import("./routes/auth.js");
          app.use("/api/auth", authRoutes.default);
          console.log("Auth routes added successfully");
          
          console.log("STEP 4: Adding users routes...");
          const userRoutes = await import("./routes/users.js");
          app.use("/api/users", userRoutes.default);
          console.log("Users routes added successfully");
          
          // Add more routes here if needed...
          console.log("All routes added successfully!");
          
        } catch (error) {
          console.error("Error adding routes:", error);
        }
      }, 1000);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error("Server error:", error);
    });

  } catch (err) {
    console.error("Could not start server:", err);
    process.exit(1);
  }
};

startServer();