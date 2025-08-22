// Save this as debug-server.js and run it to find the problematic route

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
  console.log("🔧 Environment Check:");
  if (!process.env.JWT_SECRET) {
    console.log("⚠️  Setting default JWT_SECRET for development");
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
      console.log("✅ Default test user created");
    }
  } catch (error) {
    console.error("❌ Failed to create default user:", error.message);
  }
};

const testRoute = async (routeName, routePath, importPath) => {
  try {
    console.log(`\n🧪 Testing ${routeName} route...`);
    const routeModule = await import(importPath);
    app.use(routePath, routeModule.default);
    console.log(`✅ ${routeName} route loaded successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${routeName} route failed:`, error.message);
    return false;
  }
};

const startServer = async () => {
  try {
    checkEnvironment();
    
    console.log("🚀 Starting MongoDB Memory Server...");
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);
    console.log("✅ In-memory MongoDB connected");

    await createDefaultUser();

    app.get("/", (req, res) => {
      res.json({ message: "Debug server running", status: "OK" });
    });
    
    console.log("\n🔍 Testing routes one by one...");
    
    // Test each route individually
    const routes = [
      { name: "Auth", path: "/api/auth", import: "./routes/auth.js" },
      { name: "Users", path: "/api/users", import: "./routes/users.js" },
      { name: "KB", path: "/api/kb", import: "./routes/kb.js" },
      { name: "Tickets", path: "/api/tickets", import: "./routes/tickets.js" },
      { name: "Agent Suggestions", path: "/api/agent-suggestions", import: "./routes/agentSuggestions.js" },
      { name: "Audit Logs", path: "/api/audit", import: "./routes/auditLog.js" },
      { name: "Config", path: "/api/config", import: "./routes/config.js" }
    ];

    let problematicRoute = null;
    
    for (const route of routes) {
      const success = await testRoute(route.name, route.path, route.import);
      if (!success) {
        problematicRoute = route.name;
        console.log(`\n💥 FOUND THE PROBLEM: ${route.name} route in ${route.import}`);
        break;
      }
      // Small delay to make output readable
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!problematicRoute) {
      console.log("\n🎉 All routes loaded successfully! Starting server...");
      
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`\n✅ Debug server running on http://localhost:${PORT}`);
        console.log("All routes are working fine!");
      });
    } else {
      console.log(`\n🛑 Server not started due to problematic route: ${problematicRoute}`);
      console.log(`Fix the route file and try again.`);
    }

  } catch (err) {
    console.error("💥 Could not start debug server:", err);
    process.exit(1);
  }
};

startServer();