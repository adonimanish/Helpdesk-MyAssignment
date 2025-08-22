// seed.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Article from './models/Article.js';
import User from './models/UserModel.js';
import Config from './models/Config.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedKBArticles = [
  {
    title: "How to track your shipment",
    body: "To track your shipment, use your tracking number on our tracking page. You can find your tracking number in the confirmation email. If you haven't received a tracking number, please wait 24 hours after placing your order.",
    tags: ["shipping", "tracking", "delivery"],
    status: "published"
  },
  {
    title: "Shipping delays and issues",
    body: "If your package is delayed, please check the tracking status first. Common reasons for delays include weather conditions, high shipping volumes during holidays, or address verification issues. Most delays resolve within 2-3 business days.",
    tags: ["shipping", "delays", "issues"],
    status: "published"
  },
  {
    title: "Lost package resolution",
    body: "If your package shows as delivered but you haven't received it, first check with neighbors and building management. If still not found, contact us within 48 hours for a replacement or refund.",
    tags: ["shipping", "lost", "package"],
    status: "published"
  },
  {
    title: "Payment and billing issues",
    body: "For payment problems, verify your card details and billing address. Common issues include expired cards, insufficient funds, or mismatched billing addresses. You can update your payment method in your account settings.",
    tags: ["billing", "payment", "credit card"],
    status: "published"
  },
  {
    title: "Refund policy and process",
    body: "Refunds are processed within 5-7 business days after approval. The refund will be credited to your original payment method. You'll receive an email confirmation once the refund is initiated.",
    tags: ["billing", "refund", "money"],
    status: "published"
  },
  {
    title: "Technical issues and errors",
    body: "If you're experiencing technical problems, try clearing your browser cache and cookies first. Make sure you're using a supported browser (Chrome, Firefox, Safari, Edge). If the problem persists, note the error message and contact support.",
    tags: ["tech", "errors", "bugs"],
    status: "published"
  },
  {
    title: "Login and password help",
    body: "If you can't log in, click 'Forgot Password' to reset it. Make sure you're using the correct email address. If you're still having issues, your account may be locked for security reasons - contact support to unlock it.",
    tags: ["tech", "login", "password"],
    status: "published"
  }
];

const seedUsers = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123",
    role: "admin"
  },
  {
    name: "Support Agent",
    email: "agent@example.com",
    password: "agent123",
    role: "agent"
  },
  {
    name: "Test User",
    email: "user@example.com",
    password: "user123",
    role: "user"
  }
];

const seedConfig = {
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
};

async function seedDatabase() {
  try {
    // Start MongoDB Memory Server
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    console.log("Starting MongoDB Memory Server...");
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to in-memory MongoDB');
    console.log('MongoDB URI:', mongoUri);

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Article.deleteMany({});
    await User.deleteMany({});
    await Config.deleteMany({});

    // Seed KB Articles
    console.log('📚 Seeding KB articles...');
    const articles = await Article.insertMany(seedKBArticles);
    console.log(`✅ Created ${articles.length} KB articles`);

    // Seed Users
    console.log('👤 Seeding users...');
    for (const userData of seedUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      console.log(`✅ Created ${userData.role}: ${userData.email} (password: ${userData.password})`);
    }

    // Seed Config
    console.log('⚙️  Seeding configuration...');
    const config = new Config(seedConfig);
    await config.save();
    console.log('✅ Created default configuration');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Test credentials:');
    console.log('   Admin: admin@example.com / admin123');
    console.log('   Agent: agent@example.com / agent123');
    console.log('   User: user@example.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();

