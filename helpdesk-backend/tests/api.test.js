// tests/api.test.js
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import User from '../models/UserModel.js';

describe('Helpdesk API Tests', () => {
  let mongoServer;
  let app;
  let testUser;

  beforeAll(async () => {
    // Setup test app
    app = express();
    app.use(express.json());
    
    // Start test database
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test user
    const hashedPassword = await bcrypt.hash('testpass', 10);
    testUser = new User({
      name: 'Test User',
      email: 'test@test.com',
      password: hashedPassword,
      role: 'user'
    });
    await testUser.save();

    // Setup routes
    const authRoutes = await import('../routes/auth.js');
    app.use('/api/auth', authRoutes.default);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  test('should login with correct credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'testpass'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  test('should reject wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'wrongpass'
      });

    expect(response.status).toBe(401);
  });
});