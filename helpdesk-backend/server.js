import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";
import User from "./models/UserModel.js"; // Using renamed model

dotenv.config();
const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(
      "Request body:",
      { ...req.body, password: req.body.password ? "***" : undefined }
    );
  }
  next();
});

const checkEnvironment = () => {
  console.log("Environment Check:");
  console.log("NODE_ENV:", process.env.NODE_ENV || "not set");
  console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Missing");
  console.log("PORT:", process.env.PORT || "5000 (default)");

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
        role: "user",
      });
      await defaultUser.save();
      console.log("Default test user created:");
      console.log("   Email: test@example.com");
      console.log("   Password: password123");
    } else {
      console.log("Default test user already exists");
    }
  } catch (error) {
    console.error("Failed to create default user:", error.message);
  }
};

// ============ NEW SEED FUNCTIONS ============

const seedKBArticles = async () => {
  try {
    const Article = (await import("./models/Article.js")).default;
    
    // Check if articles already exist
    const existingArticles = await Article.countDocuments();
    if (existingArticles > 0) {
      console.log(`📚 KB articles already exist (${existingArticles} articles)`);
      return;
    }

    const articles = [
      {
        title: "How to track your shipment",
        body: "To track your shipment, use your tracking number on our tracking page. You can find your tracking number in the confirmation email. If you haven't received a tracking number, please wait 24 hours after placing your order. For urgent tracking needs, contact our support team.",
        tags: ["shipping", "tracking", "delivery", "package"],
        status: "published"
      },
      {
        title: "Shipping delays and issues",
        body: "If your package is delayed, please check the tracking status first. Common reasons for delays include weather conditions, high shipping volumes during holidays, or address verification issues. Most delays resolve within 2-3 business days. We apologize for any inconvenience.",
        tags: ["shipping", "delays", "issues", "delivery"],
        status: "published"
      },
      {
        title: "Lost package resolution",
        body: "If your package shows as delivered but you haven't received it, first check with neighbors and building management. Check around your delivery location including porches, garages, and bushes. If still not found, contact us within 48 hours for a replacement or refund.",
        tags: ["shipping", "lost", "package", "delivery"],
        status: "published"
      },
      {
        title: "International shipping information",
        body: "International shipments may take 7-21 business days depending on destination. Customs clearance can add additional delays. Track your international shipment using the provided tracking number. Additional customs fees may apply depending on your country.",
        tags: ["shipping", "international", "delivery", "customs"],
        status: "published"
      },
      {
        title: "Payment and billing issues",
        body: "For payment problems, verify your card details and billing address. Common issues include expired cards, insufficient funds, or mismatched billing addresses. You can update your payment method in your account settings. Contact your bank if issues persist.",
        tags: ["billing", "payment", "credit card", "invoice"],
        status: "published"
      },
      {
        title: "Refund policy and process",
        body: "Refunds are processed within 5-7 business days after approval. The refund will be credited to your original payment method. You'll receive an email confirmation once the refund is initiated. Please allow 3-5 business days for it to appear on your statement.",
        tags: ["billing", "refund", "money", "payment"],
        status: "published"
      },
      {
        title: "Understanding your invoice",
        body: "Your invoice includes itemized charges, taxes, and any applicable discounts. You can download invoices from your account dashboard. For invoice corrections or questions about charges, contact our billing department within 30 days.",
        tags: ["billing", "invoice", "charges", "payment"],
        status: "published"
      },
      {
        title: "Technical issues and errors",
        body: "If you're experiencing technical problems, try clearing your browser cache and cookies first. Make sure you're using a supported browser (Chrome, Firefox, Safari, Edge). Disable browser extensions that might interfere. If the problem persists, note the error message and contact support.",
        tags: ["tech", "errors", "bugs", "browser"],
        status: "published"
      },
      {
        title: "Login and password help",
        body: "If you can't log in, click 'Forgot Password' to reset it. Make sure you're using the correct email address. Check that Caps Lock is off. If you're still having issues, your account may be locked for security reasons - contact support to unlock it.",
        tags: ["tech", "login", "password", "account"],
        status: "published"
      },
      {
        title: "Server error 500 troubleshooting",
        body: "Error 500 indicates a server-side issue. This could be due to database connection problems, code errors, or server overload. Try refreshing the page after a few minutes. Clear your browser cache. If the error persists, our team has been notified and is working on it.",
        tags: ["tech", "error", "500", "server", "bug"],
        status: "published"
      },
      {
        title: "App crashes and freezing",
        body: "If the app crashes or freezes, try force closing and reopening it. Check for app updates in your app store. Ensure you have enough storage space on your device. Restart your device if problems continue. Reinstall the app as a last resort.",
        tags: ["tech", "crash", "app", "mobile", "bug"],
        status: "published"
      }
    ];

    await Article.insertMany(articles);
    console.log(`✅ Created ${articles.length} KB articles`);
  } catch (error) {
    console.error("Failed to seed KB articles:", error.message);
  }
};

const seedAdditionalUsers = async () => {
  try {
    // Create admin user
    const adminExists = await User.findOne({ email: "admin@example.com" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const adminUser = new User({
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
      });
      await adminUser.save();
      console.log("✅ Admin user created: admin@example.com / admin123");
    } else {
      console.log("Admin user already exists");
    }

    // Create agent user
    const agentExists = await User.findOne({ email: "agent@example.com" });
    if (!agentExists) {
      const hashedPassword = await bcrypt.hash("agent123", 10);
      const agentUser = new User({
        name: "Support Agent",
        email: "agent@example.com",
        password: hashedPassword,
        role: "agent",
      });
      await agentUser.save();
      console.log("✅ Agent user created: agent@example.com / agent123");
    } else {
      console.log("Agent user already exists");
    }

    // Create regular user
    const userExists = await User.findOne({ email: "user@example.com" });
    if (!userExists) {
      const hashedPassword = await bcrypt.hash("user123", 10);
      const regularUser = new User({
        name: "Regular User",
        email: "user@example.com",
        password: hashedPassword,
        role: "user",
      });
      await regularUser.save();
      console.log("✅ Regular user created: user@example.com / user123");
    } else {
      console.log("Regular user already exists");
    }
  } catch (error) {
    console.error("Failed to create additional users:", error.message);
  }
};

const seedConfig = async () => {
  try {
    const Config = (await import("./models/Config.js")).default;
    
    const existingConfig = await Config.findOne();
    if (!existingConfig) {
      const config = new Config({
        autoCloseEnabled: true,
        confidenceThreshold: 0.8,
        slaHours: 24,
        maxTicketsPerUser: 10,
        aiProviderSettings: {
          provider: 'stub',
          model: 'keyword-matcher-v1',
          temperature: 0.7,
          maxTokens: 500
        },
        categoryThresholds: {
          billing: 0.8,
          tech: 0.75,
          shipping: 0.8,
          other: 0.9
        }
      });
      await config.save();
      console.log("✅ Default configuration created");
    } else {
      console.log("⚙️  Configuration already exists");
    }
  } catch (error) {
    console.error("Failed to seed config:", error.message);
  }
};

// ============ END OF SEED FUNCTIONS ============

const loadRoutes = async () => {
  try {
    console.log("Loading API routes...");

    // Root route
    app.get("/", (req, res) => {
      res.json({
        message: "Helpdesk API running with in-memory DB",
        status: "OK",
        endpoints: {
          auth: "/api/auth/login | /api/auth/register",
          tickets: "/api/tickets",
          users: "/api/users",
          kb: "/api/kb",
          agentSuggestions: "/api/agent-suggestions",
          audit: "/api/audit",
          config: "/api/config",
        },
      });
    });

    const authRoutes = await import("./routes/auth.js");
    app.use("/api/auth", authRoutes.default);
    console.log("✅ Auth routes loaded");

    const userRoutes = await import("./routes/users.js");
    app.use("/api/users", userRoutes.default);
    console.log("✅ Users routes loaded");

    const kbRoutes = await import("./routes/kb.js");
    app.use("/api/kb", kbRoutes.default);
    console.log("✅ KB routes loaded");

    const ticketRoutes = await import("./routes/tickets.js");
    app.use("/api/tickets", ticketRoutes.default);
    console.log("✅ Tickets routes loaded");

    const agentSuggestionsRoutes = await import("./routes/agentSuggestions.js");
    app.use("/api/agent-suggestions", agentSuggestionsRoutes.default);
    console.log("✅ Agent Suggestions routes loaded");

    const auditLogsRoutes = await import("./routes/auditLog.js");
    app.use("/api/audit", auditLogsRoutes.default);
    console.log("✅ Audit Logs routes loaded");

    const configRoutes = await import("./routes/config.js");
    app.use("/api/config", configRoutes.default);
    console.log("✅ Config routes loaded");

    console.log("🚀 All API routes loaded successfully");

    // 404 handler - MUST BE AFTER ALL ROUTES
    app.use("*", (req, res) => {
      console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
      res.status(404).json({
        error: "Route not found",
        method: req.method,
        url: req.originalUrl,
        availableRoutes: [
          "/api/auth",
          "/api/users",
          "/api/tickets",
          "/api/kb",
          "/api/agent-suggestions",
          "/api/audit",
          "/api/config",
        ],
      });
    });

    // Error handler - MUST BE LAST
    app.use((err, req, res, next) => {
      console.error("Server Error:", err);
      res.status(500).json({
        error: "Internal Server Error",
        message: err.message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      });
    });

  } catch (error) {
    console.error("❌ Error loading routes:", error);
    throw error;
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
      console.log("✅ In-memory MongoDB connected");
      console.log("MongoDB URI:", mongoUri);
    }

    // Seed all data
    console.log("\n📝 Starting database seeding...");
    await createDefaultUser();
    await seedKBArticles();
    await seedAdditionalUsers();
    await seedConfig();
    console.log("✅ Database seeding complete!\n");

    // CRITICAL: Load routes BEFORE starting server
    await loadRoutes();

    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}`);
      console.log(`\n📧 Test Accounts:`);
      console.log(`   Admin: admin@example.com / admin123`);
      console.log(`   Agent: agent@example.com / agent123`);
      console.log(`   User: user@example.com / user123`);
      console.log(`   Test: test@example.com / password123`);
      console.log(`\n🔑 Test Login: POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   Body: {"email": "test@example.com", "password": "password123"}`);
      console.log(`\n🎯 Ready to receive requests!`);
    });

    server.on("error", (error) => {
      console.error("❌ Server startup error:", error);
    });

  } catch (err) {
    console.error("❌ Could not start server:", err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  try {
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error closing database:", error);
  }
  process.exit(0);
});

startServer();
