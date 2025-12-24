import { jest } from '@jest/globals';
import paymentService from '../../../src/services/payment/payment.service.js';
import zainpayService from '../../../src/services/payment/zainpay.service.js';
import Transaction from '../../../src/models/Transaction.js';
import Payment from '../../../src/models/Payment.js';
import User from '../../../src/models/User.js';
import VirtualAccount from '../../../src/models/VirtualAccount.js';

// Mock dependencies
jest.mock('../../../src/models/Transaction.js');
jest.mock('../../../src/models/Payment.js');
jest.mock('../../../src/models/User.js');
jest.mock('../../../src/models/VirtualAccount.js');
jest.mock('../../../src/services/payment/zainpay.service.js');

describe('Payment Service', () => {
  let mockUser;
  let mockTransaction;
  let mockPayment;
  let mockVirtualAccount;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+2348000000000',
      save: jest.fn()
    };
    
    mockTransaction = {
      _id: 'txn123',
      userId: 'user123',
      txnRef: 'DVA_1234567890_abcd',
      amount: 1500000,
      status: 'pending',
      gateway: 'zainpay',
      paymentMethod: 'virtual_account',
      save: jest.fn(),
      toObject: () => ({})
    };
    
    mockPayment = {
      _id: 'payment123',
      userId: 'user123',
      amount: 1500000,
      status: 'pending',
      gateway: 'zainpay',
      paymentMethod: 'virtual_account',
      gatewayRef: 'DVA_1234567890_abcd',
      save: jest.fn()
    };
    
    mockVirtualAccount = {
      _id: 'va123',
      userId: 'user123',
      accountNumber: '1234567890',
      accountName: 'Stackkin Checkout',
      bankName: 'GTBank',
      txnRef: 'DVA_1234567890_abcd',
      amount: 15000,
      status: 'pending',
      save: jest.fn()
    };
    
    User.findById.mockResolvedValue(mockUser);
    Transaction.findOne.mockResolvedValue(mockTransaction);
    Payment.findOne.mockResolvedValue(mockPayment);
    VirtualAccount.findOne.mockResolvedValue(mockVirtualAccount);
    VirtualAccount.create.mockResolvedValue(mockVirtualAccount);
    Transaction.create.mockResolvedValue(mockTransaction);
    Payment.create.mockResolvedValue(mockPayment);
  });

  describe('createPayment', () => {
    it('should create a virtual account payment successfully', async () => {
      const paymentData = {
        userId: 'user123',
        amount: 15000,
        paymentMethod: 'virtual_account',
        metadata: { orderId: 'order123' }
      };
      
      const mockZainpayResult = {
        success: true,
        accountNumber: '1234567890',
        accountName: 'Stackkin Checkout',
        bankName: 'GTBank',
        txnRef: 'DVA_1234567890_abcd',
        amount: 15000,
        expiresAt: new Date(Date.now() + 1800000)
      };
      
      zainpayService.createDynamicVirtualAccount.mockResolvedValue(mockZainpayResult);
      
      const result = await paymentService.createPayment(paymentData);
      
      expect(result.success).toBe(true);
      expect(result.accountNumber).toBe('1234567890');
      expect(zainpayService.createDynamicVirtualAccount).toHaveBeenCalledWith({
        userId: 'user123',
        amount: 15000,
        email: 'test@example.com',
        metadata: { orderId: 'order123' }
      });
    });
    
    it('should throw error for invalid user', async () => {
      User.findById.mockResolvedValue(null);
      
      const paymentData = {
        userId: 'invalidUser',
        amount: 15000,
        paymentMethod: 'virtual_account'
      };
      
      await expect(paymentService.createPayment(paymentData))
        .rejects.toThrow('User not found');
    });
    
    it('should throw error for unsupported gateway', async () => {
      const paymentData = {
        userId: 'user123',
        amount: 15000,
        gateway: 'unsupported',
        paymentMethod: 'virtual_account'
      };
      
      await expect(paymentService.createPayment(paymentData))
        .rejects.toThrow('Unsupported gateway');
    });
  });
  
  describe('verifyPayment', () => {
    it('should verify virtual account payment successfully', async () => {
      const mockVerificationResult = {
        txnRef: 'DVA_1234567890_abcd',
        status: 'success',
        isSuccessful: true,
        amount: 15000
      };
      
      zainpayService.checkDynamicVirtualAccountStatus.mockResolvedValue(mockVerificationResult);
      
      const result = await paymentService.verifyPayment('DVA_1234567890_abcd');
      
      expect(result.isSuccessful).toBe(true);
      expect(zainpayService.checkDynamicVirtualAccountStatus).toHaveBeenCalledWith(
        'DVA_1234567890_abcd',
        'user123'
      );
      expect(mockTransaction.save).toHaveBeenCalled();
      expect(mockVirtualAccount.save).toHaveBeenCalled();
    });
    
    it('should throw error for non-existent transaction', async () => {
      Transaction.findOne.mockResolvedValue(null);
      
      await expect(paymentService.verifyPayment('invalidRef'))
        .rejects.toThrow('Transaction not found');
    });
  });
  
  describe('processPremiumUpgrade', () => {
    it('should process premium upgrade for eligible user', async () => {
      const mockSolution = {
        _id: 'solution123',
        user: 'user123',
        title: 'Test Solution',
        isPremium: false,
        save: jest.fn()
      };
      
      const mockSubscription = {
        tier: 'MID_TIER',
        isActive: true
      };
      
      const Solution = (await import('../../../src/models/Solution.js')).default;
      const subscriptionService = (await import('../../../src/services/subscription/subscription.service.js')).default;
      
      Solution.findById.mockResolvedValue(mockSolution);
      subscriptionService.getUserActiveSubscription.mockResolvedValue(mockSubscription);
      
      const result = await paymentService.processPremiumUpgrade(
        'solution123',
        'user123',
        'zainpay'
      );
      
      expect(result.requiresPayment).toBe(true);
      expect(result.paymentMethod).toBe('bank_transfer');
    });
    
    it('should throw error for non-existent solution', async () => {
      const Solution = (await import('../../../src/models/Solution.js')).default;
      Solution.findById.mockResolvedValue(null);
      
      await expect(paymentService.processPremiumUpgrade('invalid', 'user123'))
        .rejects.toThrow('Solution not found');
    });
    
    it('should throw error for already premium solution', async () => {
      const mockSolution = {
        _id: 'solution123',
        user: 'user123',
        isPremium: true
      };
      
      const Solution = (await import('../../../src/models/Solution.js')).default;
      Solution.findById.mockResolvedValue(mockSolution);
      
      await expect(paymentService.processPremiumUpgrade('solution123', 'user123'))
        .rejects.toThrow('Solution is already premium');
    });
  });
  
  describe('getPaymentStatistics', () => {
    it('should return payment statistics', async () => {
      const mockAggregateResult = [
        {
          _id: null,
          totalPayments: 100,
          successfulPayments: 85,
          failedPayments: 15,
          totalVolume: 5000000,
          averageTransactionValue: 50000,
          platformRevenue: 125000,
          gatewayRevenue: 75000
        }
      ];
      
      Transaction.aggregate.mockResolvedValue(mockAggregateResult);
      
      const result = await paymentService.getPaymentStatistics();
      
      expect(result.totalPayments).toBe(100);
      expect(result.successfulPayments).toBe(85);
      expect(result.conversionRate).toBe(85);
      expect(Transaction.aggregate).toHaveBeenCalled();
    });
  });
  
  describe('handleZainpayWebhook', () => {
    it('should handle deposit success webhook', async () => {
      const mockPayload = {
        event: 'deposit.success',
        data: {
          txnRef: 'DVA_1234567890_abcd',
          depositedAmount: '15000',
          paymentRef: 'pay123',
          senderName: 'John Doe',
          bankName: 'GTBank'
        }
      };
      
      const mockSignature = 'valid_signature';
      
      zainpayService.verifyWebhookSignature.mockReturnValue(true);
      zainpayService.processWebhookEvent.mockResolvedValue({ processed: true });
      
      const result = await paymentService.handleZainpayWebhook(mockPayload, mockSignature);
      
      expect(result.processed).toBe(true);
      expect(result.event).toBe('deposit.success');
      expect(zainpayService.verifyWebhookSignature).toHaveBeenCalledWith(
        mockPayload,
        mockSignature
      );
    });
    
    it('should throw error for invalid signature', async () => {
      const mockPayload = { event: 'deposit.success', data: {} };
      const mockSignature = 'invalid_signature';
      
      zainpayService.verifyWebhookSignature.mockReturnValue(false);
      
      await expect(paymentService.handleZainpayWebhook(mockPayload, mockSignature))
        .rejects.toThrow('Invalid webhook signature');
    });
  });
  
  describe('getTransactionHistory', () => {
    it('should return transaction history with filters', async () => {
      const mockTransactions = [
        { _id: 'txn1', amount: 10000, status: 'success' },
        { _id: 'txn2', amount: 20000, status: 'pending' }
      ];
      
      Transaction.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockTransactions)
      });
      
      Transaction.countDocuments.mockResolvedValue(2);
      
      const filters = {
        status: 'success',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        minAmount: 5000,
        maxAmount: 30000
      };
      
      const result = await paymentService.getTransactionHistory('user123', filters);
      
      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(Transaction.find).toHaveBeenCalled();
      expect(Transaction.countDocuments).toHaveBeenCalled();
    });
  });
  
  describe('refundPayment', () => {
    it('should refund a successful payment', async () => {
      const mockTransactionRefund = {
        _id: 'refund123',
        userId: 'user123',
        txnRef: 'REFUND_1234567890',
        amount: 15000,
        status: 'pending',
        save: jest.fn()
      };
      
      mockTransaction.status = 'success';
      Transaction.findOne.mockResolvedValue(null); // No existing refund
      Transaction.create.mockResolvedValue(mockTransactionRefund);
      
      const result = await paymentService.refundPayment('txn123', 'Customer requested refund');
      
      expect(result.userId).toBe('user123');
      expect(result.type).toBe('refund');
      expect(mockTransaction.status).toBe('refunded');
      expect(mockTransaction.save).toHaveBeenCalled();
    });
    
    it('should throw error for non-successful payment', async () => {
      mockTransaction.status = 'pending';
      
      await expect(paymentService.refundPayment('txn123', 'Refund'))
        .rejects.toThrow('Only successful transactions can be refunded');
    });
    
    it('should throw error for already refunded transaction', async () => {
      mockTransaction.status = 'success';
      Transaction.findOne.mockResolvedValue({ _id: 'existingRefund' });
      
      await expect(paymentService.refundPayment('txn123', 'Refund'))
        .rejects.toThrow('Transaction already refunded');
    });
  });
});