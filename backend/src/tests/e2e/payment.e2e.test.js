import puppeteer from 'puppeteer';
import mongoose from 'mongoose';
import { createServer } from '../../src/server.js';
import User from '../../src/models/User.js';
import Transaction from '../../src/models/Transaction.js';

describe('Payment E2E Tests', () => {
  let app;
  let server;
  let browser;
  let page;
  let testUser;
  let authToken;
  let baseUrl = 'http://localhost:4000';
  
  beforeAll(async () => {
    // Start server
    const { app: expressApp, server: httpServer } = await createServer();
    app = expressApp;
    server = httpServer;
    
    // Create test user
    testUser = await User.create({
      firstName: 'E2E',
      lastName: 'Test',
      email: 'e2e.payment@example.com',
      username: 'e2epayment',
      password: 'Password123!',
      accountStatus: 'ACTIVE',
      role: 'USER'
    });
    
    // Generate token
    const jwt = (await import('jsonwebtoken')).default;
    authToken = jwt.sign(
      { userId: testUser._id, role: testUser.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Set authentication token in localStorage
    await page.goto(`${baseUrl}/graphql`);
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, authToken);
  }, 30000);
  
  afterAll(async () => {
    await browser.close();
    
    await User.deleteMany({ email: /e2e\.payment@example\.com/ });
    await Transaction.deleteMany({});
    
    await mongoose.connection.close();
    server.close();
  });
  
  describe('Payment Flow', () => {
    it('should complete virtual account payment flow', async () => {
      // Navigate to payment page
      await page.goto(`${baseUrl}/payments/new`);
      
      // Fill payment form
      await page.type('input[name="amount"]', '15000');
      await page.select('select[name="paymentType"]', 'SUBSCRIPTION');
      await page.type('textarea[name="description"]', 'E2E Test Payment');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for payment initialization
      await page.waitForSelector('.payment-details', { timeout: 5000 });
      
      // Verify payment details are displayed
      const paymentDetails = await page.$eval('.payment-details', el => el.textContent);
      expect(paymentDetails).toContain('Account Number');
      expect(paymentDetails).toContain('Bank Name');
      expect(paymentDetails).toContain('Amount');
      
      // Verify transaction was created
      const transaction = await Transaction.findOne({ userId: testUser._id });
      expect(transaction).toBeTruthy();
      expect(transaction.amount).toBe(15000);
      expect(transaction.status).toBe('pending');
    }, 15000);
    
    it('should display payment history', async () => {
      // Create test transaction
      await Transaction.create({
        userId: testUser._id,
        txnRef: 'E2E_TXN_001',
        type: 'deposit',
        amount: 25000,
        status: 'success',
        paymentMethod: 'virtual_account',
        description: 'E2E Test Transaction'
      });
      
      // Navigate to payment history
      await page.goto(`${baseUrl}/payments/history`);
      
      // Wait for transactions to load
      await page.waitForSelector('.transaction-item', { timeout: 5000 });
      
      // Verify transaction is displayed
      const transactions = await page.$$eval('.transaction-item', items => 
        items.map(item => item.textContent)
      );
      
      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0]).toContain('₦250');
    }, 10000);
    
    it('should handle payment verification', async () => {
      // Create pending transaction
      const transaction = await Transaction.create({
        userId: testUser._id,
        txnRef: 'E2E_VERIFY_001',
        type: 'deposit',
        amount: 10000,
        status: 'pending',
        paymentMethod: 'virtual_account'
      });
      
      // Navigate to verification page
      await page.goto(`${baseUrl}/payments/verify/${transaction.txnRef}`);
      
      // Click verify button
      await page.click('button.verify-payment');
      
      // Wait for verification result
      await page.waitForSelector('.verification-result', { timeout: 10000 });
      
      // Check result
      const result = await page.$eval('.verification-result', el => el.textContent);
      expect(result).toMatch(/verified|pending|failed/i);
    }, 15000);
  });
  
  describe('Error Scenarios', () => {
    it('should show error for invalid payment amount', async () => {
      await page.goto(`${baseUrl}/payments/new`);
      
      // Enter invalid amount
      await page.type('input[name="amount"]', '0');
      await page.click('button[type="submit"]');
      
      // Check for error message
      await page.waitForSelector('.error-message', { timeout: 5000 });
      const error = await page.$eval('.error-message', el => el.textContent);
      expect(error).toContain('amount');
    });
    
    it('should show authentication error for protected routes', async () => {
      // Clear authentication
      await page.evaluate(() => {
        localStorage.removeItem('authToken');
      });
      
      await page.goto(`${baseUrl}/payments/history`);
      
      // Should redirect to login or show auth error
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/login|auth|error/i);
    });
  });
});