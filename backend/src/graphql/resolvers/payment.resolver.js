import paymentService from '../../services/payment/payment.service.js';
import Transaction from '../../models/Transaction.js';
import VirtualAccount from '../../models/VirtualAccount.js';

export const paymentResolvers = {
  Query: {
    getTransaction: async (_, { id }, { user }) => {
      if (!user) throw new Error('Authentication required');
      
      const transaction = await Transaction.findOne({
        _id: id,
        userId: user.id
      });
      
      if (!transaction) throw new Error('Transaction not found');
      return transaction;
    },
    
    getTransactionHistory: async (_, { filters = {} }, { user }) => {
      if (!user) throw new Error('Authentication required');
      
      return await paymentService.getTransactionHistory(user.id, filters);
    },
    
    getVirtualAccounts: async (_, __, { user }) => {
      if (!user) throw new Error('Authentication required');
      
      return await paymentService.getUserVirtualAccounts(user.id);
    },
    
    getPaymentStatistics: async (_, __, { user }) => {
      if (!user) throw new Error('Authentication required');
      
      return await paymentService.getPaymentStatistics(user.id);
    },
    
    verifyPayment: async (_, { txnRef }, { user }) => {
      if (!user) throw new Error('Authentication required');
      
      // Verify the user owns this transaction
      const transaction = await Transaction.findOne({
        txnRef,
        userId: user.id
      });
      
      if (!transaction) throw new Error('Transaction not found');
      
      return await paymentService.verifyPayment(txnRef);
    },
    
    // Additional resolvers for type definitions
    myWallet: async (_, __, { user }) => {
      if (!user) throw new Error('Authentication required');
      // Implementation needed
    },
    
    myTransactions: async (_, { filter, pagination }, { user }) => {
      if (!user) throw new Error('Authentication required');
      return await paymentService.getTransactionHistory(user.id, filter);
    },
    
    initializePayment: async (_, { input }, { user }) => {
      if (!user) throw new Error('Authentication required');
      return await paymentService.createPayment({
        userId: user.id,
        ...input
      });
    }
  },
  
  Mutation: {
    createPayment: async (_, { input }, { user }) => {
      if (!user) throw new Error('Authentication required');
      
      return await paymentService.createPayment({
        userId: user.id,
        ...input
      });
    },
    
    createVirtualAccountPayment: async (_, { amount, metadata }, { user }) => {
      if (!user) throw new Error('Authentication required');
      
      return await paymentService.createPayment({
        userId: user.id,
        amount,
        paymentMethod: 'virtual_account',
        metadata
      });
    },
    
    createCardPayment: async (_, { amount, metadata }, { user }) => {
      if (!user) throw new Error('Authentication required');
      
      return await paymentService.createPayment({
        userId: user.id,
        amount,
        paymentMethod: 'card',
        metadata
      });
    },
    
    transferToBank: async (_, { input }, { user }) => {
      if (!user) throw new Error('Authentication required');
      
      return await paymentService.createPayment({
        userId: user.id,
        paymentMethod: 'bank_transfer',
        ...input
      });
    },
    
    refundPayment: async (_, { transactionId, reason }, { user }) => {
      if (!user) throw new Error('Authentication required');
      
      // Verify user owns the transaction
      const transaction = await Transaction.findOne({
        _id: transactionId,
        userId: user.id
      });
      
      if (!transaction) throw new Error('Transaction not found');
      
      return await paymentService.refundPayment(transactionId, reason);
    },
    
    // Additional mutation resolvers
    processPayment: async (_, { paymentId }, { user }) => {
      if (!user) throw new Error('Authentication required');
      // Implementation needed
    },
    
    requestWithdrawal: async (_, { input }, { user }) => {
      if (!user) throw new Error('Authentication required');
      // Implementation needed
    }
  }
};