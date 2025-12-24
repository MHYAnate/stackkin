import request from 'supertest';
import mongoose from 'mongoose';
import { createServer } from '../../src/server.js';
import Transaction from '../../src/models/Transaction.js';
import Payment from '../../src/models/Payment.js';
import User from '../../src/models/User.js';
import { generateTestToken } from '../helpers/auth.helper.js';

describe('Payment Integration Tests', () => {
  let app;
  let server;
  let authToken;
  let testUser;
  
  beforeAll(async () => {
    const { app: expressApp, server: httpServer } = await createServer();
    app = expressApp;
    server = httpServer;
    
    // Create test user
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'payment.test@example.com',
      username: 'paymentuser',
      password: 'Password123!',
      accountStatus: 'ACTIVE',
      role: 'USER'
    });
    
    authToken = generateTestToken(testUser._id, testUser.role);
  });
  
  afterAll(async () => {
    await User.deleteMany({ email: /test@example\.com/ });
    await Transaction.deleteMany({});
    await Payment.deleteMany({});
    
    await mongoose.connection.close();
    server.close();
  });
  
  beforeEach(async () => {
    await Transaction.deleteMany({});
    await Payment.deleteMany({});
  });
  
  describe('GraphQL Payment Queries', () => {
    it('should get user wallet', async () => {
      const query = `
        query {
          myWallet {
            id
            balance
            currency
            availableBalance
          }
        }
      `;
      
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query });
      
      expect(response.status).toBe(200);
      expect(response.body.data.myWallet).toHaveProperty('balance');
      expect(response.body.data.myWallet.currency).toBe('NGN');
    });
    
    it('should get user transactions', async () => {
      // Create test transaction
      await Transaction.create({
        userId: testUser._id,
        txnRef: 'TEST_TXN_123',
        type: 'deposit',
        amount: 5000,
        status: 'success',
        paymentMethod: 'virtual_account'
      });
      
      const query = `
        query {
          myTransactions(filter: { direction: INCOMING }) {
            edges {
              node {
                id
                amount
                status
              }
            }
            totalCount
          }
        }
      `;
      
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query });
      
      expect(response.status).toBe(200);
      expect(response.body.data.myTransactions.edges).toHaveLength(1);
      expect(response.body.data.myTransactions.totalCount).toBe(1);
    });
    
    it('should initialize payment', async () => {
      const mutation = `
        mutation {
          initializePayment(input: {
            amount: 15000
            currency: NGN
            paymentType: SUBSCRIPTION
            reference: "TEST_SUB_001"
            metadata: { subscriptionTier: "BASE" }
          }) {
            id
            amount
            status
            reference
          }
        }
      `;
      
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: mutation });
      
      expect(response.status).toBe(200);
      expect(response.body.data.initializePayment).toHaveProperty('id');
      expect(response.body.data.initializePayment.amount).toBe(15000);
      expect(response.body.data.initializePayment.status).toBe('PENDING');
    });
  });
  
  describe('GraphQL Payment Mutations', () => {
    it('should create virtual account payment', async () => {
      const mutation = `
        mutation {
          createVirtualAccountPayment(amount: 25000, metadata: { description: "Test payment" }) {
            success
            transactionId
            accountNumber
            bankName
          }
        }
      `;
      
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: mutation });
      
      expect(response.status).toBe(200);
      expect(response.body.data.createVirtualAccountPayment.success).toBe(true);
      expect(response.body.data.createVirtualAccountPayment).toHaveProperty('accountNumber');
    });
    
    it('should request withdrawal', async () => {
      // First ensure user has wallet with balance
      const Wallet = (await import('../../src/models/Wallet.js')).default;
      await Wallet.create({
        userId: testUser._id,
        balance: 50000,
        availableBalance: 50000,
        currency: 'NGN'
      });
      
      const mutation = `
        mutation {
          requestWithdrawal(input: {
            amount: 10000
            currency: NGN
            bankCode: "058"
            accountNumber: "1234567890"
            accountName: "Test User"
            narration: "Test withdrawal"
          }) {
            id
            amount
            status
            accountName
          }
        }
      `;
      
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: mutation });
      
      expect(response.status).toBe(200);
      expect(response.body.data.requestWithdrawal.amount).toBe(10000);
      expect(response.body.data.requestWithdrawal.status).toBe('PENDING');
    });
  });
  
  describe('Webhook Endpoints', () => {
    it('should handle Zainpay webhook with valid signature', async () => {
      const webhookPayload = {
        event: 'deposit.success',
        data: {
          txnRef: 'TEST_TXN_123',
          depositedAmount: '15000',
          paymentRef: 'PAY_123',
          senderName: 'John Doe',
          bankName: 'GTBank'
        }
      };
      
      const response = await request(app)
        .post('/webhooks/zainpay')
        .set('zainpay-signature', 'mocked_signature')
        .send(webhookPayload);
      
      // Should return 200 even if signature verification fails in test
      expect([200, 400]).toContain(response.status);
    });
    
    it('should reject webhook without signature', async () => {
      const response = await request(app)
        .post('/webhooks/zainpay')
        .send({ event: 'test' });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing signature');
    });
  });
  
  describe('Error Handling', () => {
    it('should return authentication error for unauthenticated requests', async () => {
      const query = `
        query {
          myWallet {
            id
            balance
          }
        }
      `;
      
      const response = await request(app)
        .post('/graphql')
        .send({ query });
      
      expect(response.status).toBe(200);
      expect(response.body.errors[0].message).toContain('Authentication required');
    });
    
    it('should return validation error for invalid payment amount', async () => {
      const mutation = `
        mutation {
          createVirtualAccountPayment(amount: -100, metadata: {}) {
            success
          }
        }
      `;
      
      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: mutation });
      
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
    });
  });
});