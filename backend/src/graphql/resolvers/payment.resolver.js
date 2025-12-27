// import paymentService from '../../services/payment/payment.service.js';
// import zainpayService from '../../services/payment/zainpay.service.js';
// import webhookService from '../../services/payment/webhook.service.js';
// import Transaction from '../../models/Transaction.js';
// import VirtualAccount from '../../models/VirtualAccount.js';
// import Payment from '../../models/Payment.js';
// import User from '../../models/User.js';
// import { AuthenticationError, AuthorizationError, ValidationError } from '../../errors/index.js';

// export const paymentResolvers = {
//   // Custom scalars
//   JSON: {
//     __serialize: (value) => value,
//     __parseValue: (value) => value,
//     __parseLiteral: (ast) => ast.value
//   },

//   // Type resolvers
//   Payment: {
//     user: async (parent, _, { loaders }) => {
//       return await loaders.userLoader.load(parent.userId);
//     },
//     virtualAccount: async (parent) => {
//       if (!parent.metadata?.virtualAccountId) return null;
//       return await VirtualAccount.findById(parent.metadata.virtualAccountId);
//     },
//     subscription: async (parent) => {
//       if (!parent.metadata?.subscriptionId) return null;
//       const Subscription = (await import('../../models/Subscription.js')).default;
//       return await Subscription.findById(parent.metadata.subscriptionId);
//     },
//     // Add other field resolvers as needed
//   },

//   Transaction: {
//     user: async (parent, _, { loaders }) => {
//       return await loaders.userLoader.load(parent.userId);
//     },
//     payment: async (parent) => {
//       if (!parent.metadata?.paymentId) return null;
//       return await Payment.findById(parent.metadata.paymentId);
//     }
//   },

//   // Query resolvers
//   Query: {
//     // Current User Queries
//     myWallet: async (_, __, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       // Get or create wallet for user
//       const Wallet = (await import('../../models/Wallet.js')).default;
//       let wallet = await Wallet.findOne({ userId: user.id });
      
//       if (!wallet) {
//         wallet = await Wallet.create({
//           userId: user.id,
//           balance: 0,
//           currency: 'NGN',
//           lockedBalance: 0,
//           availableBalance: 0,
//           dailyLimit: 10000000, // ₦100,000
//           monthlyLimit: 300000000, // ₦3,000,000
//           perTransactionLimit: 5000000 // ₦50,000
//         });
//       }
      
//       return wallet;
//     },

//     myTransactions: async (_, { filter = {}, pagination = {} }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const { page = 1, limit = 20 } = pagination;
//       const skip = (page - 1) * limit;
      
//       const query = { userId: user.id };
      
//       // Apply filters
//       if (filter.direction) query.direction = filter.direction;
//       if (filter.startDate || filter.endDate) {
//         query.createdAt = {};
//         if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
//         if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
//       }
//       if (filter.minAmount) query.amount = { $gte: filter.minAmount };
//       if (filter.maxAmount) {
//         if (!query.amount) query.amount = {};
//         query.amount.$lte = filter.maxAmount;
//       }
//       if (filter.reference) query.reference = { $regex: filter.reference, $options: 'i' };

//       const [transactions, totalCount] = await Promise.all([
//         Transaction.find(query)
//           .sort({ createdAt: -1 })
//           .skip(skip)
//           .limit(limit)
//           .populate('userId', 'firstName lastName username email')
//           .exec(),
//         Transaction.countDocuments(query)
//       ]);

//       return {
//         edges: transactions.map(transaction => ({
//           node: transaction,
//           cursor: transaction._id.toString()
//         })),
//         pageInfo: {
//           hasNextPage: page * limit < totalCount,
//           hasPreviousPage: page > 1,
//           startCursor: transactions[0]?._id.toString() || null,
//           endCursor: transactions[transactions.length - 1]?._id.toString() || null
//         },
//         totalCount
//       };
//     },

//     myPayments: async (_, { filter = {}, pagination = {} }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const { page = 1, limit = 20 } = pagination;
//       const skip = (page - 1) * limit;
      
//       const query = { userId: user.id };
      
//       // Apply filters
//       if (filter.status) query.status = filter.status;
//       if (filter.paymentType) query.paymentType = filter.paymentType;
//       if (filter.paymentMethod) query.paymentMethod = filter.paymentMethod;
//       if (filter.startDate || filter.endDate) {
//         query.createdAt = {};
//         if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
//         if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
//       }
//       if (filter.minAmount) query.amount = { $gte: filter.minAmount };
//       if (filter.maxAmount) {
//         if (!query.amount) query.amount = {};
//         query.amount.$lte = filter.maxAmount;
//       }
//       if (filter.search) {
//         query.$or = [
//           { reference: { $regex: filter.search, $options: 'i' } },
//           { 'metadata.description': { $regex: filter.search, $options: 'i' } }
//         ];
//       }

//       const [payments, totalCount] = await Promise.all([
//         Payment.find(query)
//           .sort({ createdAt: -1 })
//           .skip(skip)
//           .limit(limit)
//           .populate('userId', 'firstName lastName username email')
//           .exec(),
//         Payment.countDocuments(query)
//       ]);

//       return {
//         edges: payments.map(payment => ({
//           node: payment,
//           cursor: payment._id.toString()
//         })),
//         pageInfo: {
//           hasNextPage: page * limit < totalCount,
//           hasPreviousPage: page > 1,
//           startCursor: payments[0]?._id.toString() || null,
//           endCursor: payments[payments.length - 1]?._id.toString() || null
//         },
//         totalCount
//       };
//     },

//     myWithdrawals: async (_, { status, pagination = {} }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const { page = 1, limit = 20 } = pagination;
//       const skip = (page - 1) * limit;
      
//       const query = { userId: user.id };
//       if (status) query.status = status;

//       const Withdrawal = (await import('../../models/Withdrawal.js')).default;
//       const withdrawals = await Withdrawal.find(query)
//         .sort({ requestedAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .populate('userId', 'firstName lastName username email');

//       return withdrawals;
//     },

//     myEscrows: async (_, { status, pagination = {} }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const { page = 1, limit = 20 } = pagination;
//       const skip = (page - 1) * limit;
      
//       const query = { 
//         $or: [{ buyerId: user.id }, { sellerId: user.id }]
//       };
//       if (status) query.status = status;

//       const Escrow = (await import('../../models/Escrow.js')).default;
//       const escrows = await Escrow.find(query)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .populate('buyer', 'firstName lastName username email')
//         .populate('seller', 'firstName lastName username email');

//       return escrows;
//     },

//     // Payment Flow
//     initializePayment: async (_, { input }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       return await paymentService.createPayment({
//         userId: user.id,
//         amount: input.amount,
//         currency: input.currency,
//         paymentType: input.paymentType,
//         paymentMethod: 'virtual_account', // Default
//         metadata: input.metadata || {},
//         reference: input.reference,
//         redirectUrl: input.redirectUrl,
//         callbackUrl: input.callbackUrl
//       });
//     },

//     verifyPayment: async (_, { reference }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const transaction = await Transaction.findOne({
//         txnRef: reference,
//         userId: user.id
//       });
      
//       if (!transaction) throw new ValidationError('Transaction not found or access denied');
      
//       return await paymentService.verifyPayment(reference);
//     },

//     // Escrow
//     escrowDetails: async (_, { escrowId }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const Escrow = (await import('../../models/Escrow.js')).default;
//       const escrow = await Escrow.findById(escrowId)
//         .populate('buyer', 'firstName lastName username email')
//         .populate('seller', 'firstName lastName username email')
//         .populate('marketplaceListing', 'title price')
//         .populate('job', 'title budget')
//         .populate('bounty', 'title reward');

//       if (!escrow) throw new ValidationError('Escrow not found');
      
//       // Check if user is involved in this escrow
//       if (escrow.buyer._id.toString() !== user.id && 
//           escrow.seller._id.toString() !== user.id) {
//         throw new AuthorizationError('You do not have access to this escrow');
//       }
      
//       return escrow;
//     },

//     escrowBalance: async (_, { escrowId }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const Escrow = (await import('../../models/Escrow.js')).default;
//       const escrow = await Escrow.findById(escrowId);
      
//       if (!escrow) throw new ValidationError('Escrow not found');
      
//       // Check if user is involved in this escrow
//       if (escrow.buyer.toString() !== user.id && 
//           escrow.seller.toString() !== user.id) {
//         throw new AuthorizationError('You do not have access to this escrow');
//       }
      
//       // Calculate current balance (total funded minus released)
//       const Payment = (await import('../../models/Payment.js')).default;
//       const funded = await Payment.aggregate([
//         { $match: { 'metadata.escrowId': escrowId, status: 'completed' } },
//         { $group: { _id: null, total: { $sum: '$amount' } } }
//       ]);
      
//       const released = await Payment.aggregate([
//         { $match: { 'metadata.escrowReleaseId': escrowId, status: 'completed' } },
//         { $group: { _id: null, total: { $sum: '$amount' } } }
//       ]);
      
//       const totalFunded = funded[0]?.total || 0;
//       const totalReleased = released[0]?.total || 0;
      
//       return totalFunded - totalReleased;
//     },

//     // Admin Queries
//     allPayments: async (_, { filter = {}, pagination = {} }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
//       if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
//         throw new AuthorizationError('Admin access required');
//       }
      
//       const { page = 1, limit = 20 } = pagination;
//       const skip = (page - 1) * limit;
      
//       const query = {};
      
//       // Apply filters
//       if (filter.status) query.status = filter.status;
//       if (filter.paymentType) query.paymentType = filter.paymentType;
//       if (filter.paymentMethod) query.paymentMethod = filter.paymentMethod;
//       if (filter.userId) query.userId = filter.userId;
//       if (filter.startDate || filter.endDate) {
//         query.createdAt = {};
//         if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
//         if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
//       }
//       if (filter.minAmount) query.amount = { $gte: filter.minAmount };
//       if (filter.maxAmount) {
//         if (!query.amount) query.amount = {};
//         query.amount.$lte = filter.maxAmount;
//       }
//       if (filter.search) {
//         query.$or = [
//           { reference: { $regex: filter.search, $options: 'i' } },
//           { 'metadata.description': { $regex: filter.search, $options: 'i' } },
//           { 'userId.email': { $regex: filter.search, $options: 'i' } }
//         ];
//       }

//       const [payments, totalCount] = await Promise.all([
//         Payment.find(query)
//           .sort({ createdAt: -1 })
//           .skip(skip)
//           .limit(limit)
//           .populate('userId', 'firstName lastName username email')
//           .exec(),
//         Payment.countDocuments(query)
//       ]);

//       return {
//         edges: payments.map(payment => ({
//           node: payment,
//           cursor: payment._id.toString()
//         })),
//         pageInfo: {
//           hasNextPage: page * limit < totalCount,
//           hasPreviousPage: page > 1,
//           startCursor: payments[0]?._id.toString() || null,
//           endCursor: payments[payments.length - 1]?._id.toString() || null
//         },
//         totalCount
//       };
//     },

//     paymentStats: async (_, { startDate, endDate, groupBy = 'DAY' }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
//       if (!['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_ADMIN'].includes(user.role)) {
//         throw new AuthorizationError('Admin access required');
//       }
      
//       return await paymentService.getPaymentStatistics(startDate, endDate, groupBy);
//     },

//     paymentGateway: async (_, { gatewayId }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
//       if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
//         throw new AuthorizationError('Admin access required');
//       }
      
//       const PaymentGateway = (await import('../../models/PaymentGateway.js')).default;
//       const gateway = await PaymentGateway.findById(gatewayId);
      
//       if (!gateway) throw new ValidationError('Payment gateway not found');
      
//       return gateway;
//     },

//     paymentGateways: async (_, { status }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
//       if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
//         throw new AuthorizationError('Admin access required');
//       }
      
//       const query = status ? { status } : {};
//       const PaymentGateway = (await import('../../models/PaymentGateway.js')).default;
//       return await PaymentGateway.find(query).sort({ createdAt: -1 });
//     },

//     webhookEvents: async (_, { gatewayId, status, pagination = {} }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
//       if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
//         throw new AuthorizationError('Admin access required');
//       }
      
//       const { page = 1, limit = 20 } = pagination;
//       const skip = (page - 1) * limit;
      
//       const query = {};
//       if (gatewayId) query.gateway = gatewayId;
//       if (status) query.status = status;

//       const WebhookEvent = (await import('../../models/WebhookEvent.js')).default;
//       const [events, totalCount] = await Promise.all([
//         WebhookEvent.find(query)
//           .sort({ receivedAt: -1 })
//           .skip(skip)
//           .limit(limit)
//           .populate('gateway')
//           .exec(),
//         WebhookEvent.countDocuments(query)
//       ]);

//       return {
//         edges: events.map(event => ({
//           node: event,
//           cursor: event._id.toString()
//         })),
//         pageInfo: {
//           hasNextPage: page * limit < totalCount,
//           hasPreviousPage: page > 1,
//           startCursor: events[0]?._id.toString() || null,
//           endCursor: events[events.length - 1]?._id.toString() || null
//         },
//         totalCount
//       };
//     }
//   },

//   // Mutation resolvers
//   Mutation: {
//     // Payment Processing
//     processPayment: async (_, { paymentId }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const payment = await Payment.findById(paymentId);
//       if (!payment) throw new ValidationError('Payment not found');
      
//       if (payment.userId.toString() !== user.id) {
//         throw new AuthorizationError('You do not own this payment');
//       }
      
//       if (payment.status !== 'pending') {
//         throw new ValidationError(`Payment already ${payment.status}`);
//       }
      
//       // Process based on payment method
//       switch (payment.paymentMethod) {
//         case 'virtual_account':
//           return await paymentService.verifyPayment(payment.gatewayRef);
//         case 'card':
//           // Trigger card payment processing
//           return await zainpayService.verifyCardPayment( payment.gatewayRef,
//             payment.userId.toString());
//         default:
//           throw new ValidationError(`Cannot process payment method: ${payment.paymentMethod}`);
//       }
//     },

//     retryPayment: async (_, { paymentId }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const payment = await Payment.findById(paymentId);
//       if (!payment) throw new ValidationError('Payment not found');
      
//       if (payment.userId.toString() !== user.id) {
//         throw new AuthorizationError('You do not own this payment');
//       }
      
//       if (payment.status !== 'failed') {
//         throw new ValidationError('Can only retry failed payments');
//       }
      
//       return await paymentService.retryPayment(paymentId);
//     },

//     // Refunds
//     refundPayment: async (_, { input }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const payment = await Payment.findById(input.paymentId);
//       if (!payment) throw new ValidationError('Payment not found');
      
//       // Check permissions (admin or payment owner)
//       if (payment.userId.toString() !== user.id && 
//           !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
//         throw new AuthorizationError('Permission denied');
//       }
      
//       return await paymentService.refundPayment(input);
//     },

//     cancelRefund: async (_, { refundId }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
//       if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
//         throw new AuthorizationError('Admin access required');
//       }
      
//       return await paymentService.cancelRefund(refundId);
//     },

//     // Withdrawals
//     requestWithdrawal: async (_, { input }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       // Check wallet balance
//       const Wallet = (await import('../../models/Wallet.js')).default;
//       const wallet = await Wallet.findOne({ userId: user.id });
      
//       if (!wallet || wallet.availableBalance < input.amount) {
//         throw new ValidationError('Insufficient balance');
//       }
      
//       // Validate bank details
//       const bankService = (await import('../services/payment/bank.service.js')).default;
//       const bankValidation = await bankService.validateBankDetails(
//         input.accountNumber,
//         input.bankCode
//       );
      
//       if (!bankValidation.valid) {
//         throw new ValidationError('Invalid bank details');
//       }
      
//       return await paymentService.requestWithdrawal({
//         userId: user.id,
//         ...input
//       });
//     },

//     cancelWithdrawal: async (_, { withdrawalId }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const Withdrawal = (await import('../../models/Withdrawal.js')).default;
//       const withdrawal = await Withdrawal.findById(withdrawalId);
      
//       if (!withdrawal) throw new ValidationError('Withdrawal not found');
      
//       if (withdrawal.userId.toString() !== user.id) {
//         throw new AuthorizationError('You do not own this withdrawal');
//       }
      
//       if (withdrawal.status !== 'pending') {
//         throw new ValidationError(`Cannot cancel withdrawal in ${withdrawal.status} status`);
//       }
      
//       withdrawal.status = 'cancelled';
//       withdrawal.cancelledAt = new Date();
//       await withdrawal.save();
      
//       return { success: true, message: 'Withdrawal cancelled successfully' };
//     },

//     // Escrow Management
//     createEscrow: async (_, { input }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       // Verify buyer is the current user
//       if (input.buyerId !== user.id) {
//         throw new AuthorizationError('You can only create escrow as the buyer');
//       }
      
//       return await paymentService.createEscrow(input);
//     },

//     fundEscrow: async (_, { escrowId, paymentMethodId }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const Escrow = (await import('../../models/Escrow.js')).default;
//       const escrow = await Escrow.findById(escrowId);
      
//       if (!escrow) throw new ValidationError('Escrow not found');
      
//       if (escrow.buyer.toString() !== user.id) {
//         throw new AuthorizationError('Only the buyer can fund this escrow');
//       }
      
//       if (escrow.status !== 'pending') {
//         throw new ValidationError(`Escrow already ${escrow.status}`);
//       }
      
//       return await paymentService.fundEscrow(escrowId, paymentMethodId);
//     },

//     releaseEscrow: async (_, { input }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const Escrow = (await import('../../models/Escrow.js')).default;
//       const escrow = await Escrow.findById(input.escrowId);
      
//       if (!escrow) throw new ValidationError('Escrow not found');
      
//       // Check if user is seller or has admin rights
//       const isSeller = escrow.seller.toString() === user.id;
//       const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
      
//       if (!isSeller && !isAdmin) {
//         throw new AuthorizationError('Only seller or admin can release escrow');
//       }
      
//       return await paymentService.releaseEscrow(input);
//     },

//     cancelEscrow: async (_, { escrowId, reason }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const Escrow = (await import('../../models/Escrow.js')).default;
//       const escrow = await Escrow.findById(escrowId);
      
//       if (!escrow) throw new ValidationError('Escrow not found');
      
//       // Only buyer or admin can cancel before funding
//       const isBuyer = escrow.buyer.toString() === user.id;
//       const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
      
//       if (!isBuyer && !isAdmin) {
//         throw new AuthorizationError('Permission denied');
//       }
      
//       return await paymentService.cancelEscrow(escrowId, reason);
//     },

//     // Disputes
//     openDispute: async (_, { escrowId, reason, description }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const Escrow = (await import('../../models/Escrow.js')).default;
//       const escrow = await Escrow.findById(escrowId);
      
//       if (!escrow) throw new ValidationError('Escrow not found');
      
//       // Check if user is involved in escrow
//       const isBuyer = escrow.buyer.toString() === user.id;
//       const isSeller = escrow.seller.toString() === user.id;
      
//       if (!isBuyer && !isSeller) {
//         throw new AuthorizationError('You are not involved in this escrow');
//       }
      
//       return await paymentService.openDispute({
//         escrowId,
//         initiatorId: user.id,
//         reason,
//         description
//       });
//     },

//     addDisputeEvidence: async (_, { disputeId, type, url, description }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       const Dispute = (await import('../../models/Dispute.js')).default;
//       const dispute = await Dispute.findById(disputeId)
//         .populate('escrow');
      
//       if (!dispute) throw new ValidationError('Dispute not found');
      
//       // Check if user is involved in the escrow
//       const escrow = dispute.escrow;
//       const isInvolved = escrow.buyer.toString() === user.id || 
//                          escrow.seller.toString() === user.id;
      
//       if (!isInvolved) {
//         throw new AuthorizationError('You are not involved in this dispute');
//       }
      
//       return await paymentService.addDisputeEvidence({
//         disputeId,
//         userId: user.id,
//         type,
//         url,
//         description
//       });
//     },

//     resolveDispute: async (_, { disputeId, resolution }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       // Only admins can resolve disputes
//       if (!['ADMIN', 'SUPER_ADMIN', 'SECURITY_ADMIN'].includes(user.role)) {
//         throw new AuthorizationError('Admin access required');
//       }
      
//       return await paymentService.resolveDispute({
//         disputeId,
//         resolverId: user.id,
//         resolution
//       });
//     },

//     // Wallet
//     transferFunds: async (_, { toUserId, amount, narration }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
      
//       if (user.id === toUserId) {
//         throw new ValidationError('Cannot transfer to yourself');
//       }
      
//       // Check if recipient exists
//       const recipient = await User.findById(toUserId);
//       if (!recipient) throw new ValidationError('Recipient not found');
      
//       return await paymentService.transferFunds({
//         fromUserId: user.id,
//         toUserId,
//         amount,
//         narration
//       });
//     },

//     // Admin
//     creditUserWallet: async (_, { userId, amount, reason }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
//       if (!['ADMIN', 'SUPER_ADMIN', 'SUBSCRIPTION_ADMIN'].includes(user.role)) {
//         throw new AuthorizationError('Admin access required');
//       }
      
//       return await paymentService.creditUserWallet({
//         adminId: user.id,
//         userId,
//         amount,
//         reason
//       });
//     },

//     debitUserWallet: async (_, { userId, amount, reason }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
//       if (!['ADMIN', 'SUPER_ADMIN', 'SUBSCRIPTION_ADMIN'].includes(user.role)) {
//         throw new AuthorizationError('Admin access required');
//       }
      
//       return await paymentService.debitUserWallet({
//         adminId: user.id,
//         userId,
//         amount,
//         reason
//       });
//     },

//     updatePaymentGateway: async (_, { gatewayId, input }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
//       if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
//         throw new AuthorizationError('Admin access required');
//       }
      
//       const PaymentGateway = (await import('../../models/PaymentGateway.js')).default;
//       const gateway = await PaymentGateway.findByIdAndUpdate(
//         gatewayId,
//         { ...input, updatedAt: new Date() },
//         { new: true }
//       );
      
//       if (!gateway) throw new ValidationError('Payment gateway not found');
      
//       return gateway;
//     },

//     togglePaymentGateway: async (_, { gatewayId, active }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
//       if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
//         throw new AuthorizationError('Admin access required');
//       }
      
//       const PaymentGateway = (await import('../../models/PaymentGateway.js')).default;
//       const gateway = await PaymentGateway.findById(gatewayId);
      
//       if (!gateway) throw new ValidationError('Payment gateway not found');
      
//       gateway.status = active ? 'ACTIVE' : 'INACTIVE';
//       gateway.updatedAt = new Date();
//       await gateway.save();
      
//       return gateway;
//     },

//     retryWebhook: async (_, { webhookId }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
//       if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
//         throw new AuthorizationError('Admin access required');
//       }
      
//       return await webhookService.retryWebhook(webhookId);
//     },

//     // Manual Override
//     manuallyCompletePayment: async (_, { paymentId, reference }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
//       if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
//         throw new AuthorizationError('Admin access required');
//       }
      
//       return await paymentService.manuallyCompletePayment(paymentId, reference);
//     },

//     manuallyFailPayment: async (_, { paymentId, reason }, { user }) => {
//       if (!user) throw new AuthenticationError('Authentication required');
//       if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
//         throw new AuthorizationError('Admin access required');
//       }
      
//       return await paymentService.manuallyFailPayment(paymentId, reason);
//     }
//   },

//   // Subscription resolvers
//   Subscription: {
//     paymentStatusChanged: {
//       subscribe: async (_, { paymentId }, { pubsub, user }) => {
//         if (!user) throw new AuthenticationError('Authentication required');
        
//         // Verify user has access to this payment
//         const payment = await Payment.findById(paymentId);
//         if (!payment) throw new ValidationError('Payment not found');
        
//         if (payment.userId.toString() !== user.id && 
//             !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
//           throw new AuthorizationError('Access denied');
//         }
        
//         return pubsub.asyncIterator(`PAYMENT_STATUS_CHANGED_${paymentId}`);
//       }
//     },

//     walletUpdated: {
//       subscribe: async (_, { userId }, { pubsub, user }) => {
//         if (!user) throw new AuthenticationError('Authentication required');
        
//         // Users can only subscribe to their own wallet updates
//         // Admins can subscribe to any wallet
//         if (userId !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
//           throw new AuthorizationError('Access denied');
//         }
        
//         return pubsub.asyncIterator(`WALLET_UPDATED_${userId}`);
//       }
//     },

//     escrowUpdated: {
//       subscribe: async (_, { escrowId }, { pubsub, user }) => {
//         if (!user) throw new AuthenticationError('Authentication required');
        
//         const Escrow = (await import('../../models/Escrow.js')).default;
//         const escrow = await Escrow.findById(escrowId);
        
//         if (!escrow) throw new ValidationError('Escrow not found');
        
//         // Check if user is involved in escrow
//         const isInvolved = escrow.buyer.toString() === user.id || 
//                            escrow.seller.toString() === user.id;
        
//         if (!isInvolved && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
//           throw new AuthorizationError('Access denied');
//         }
        
//         return pubsub.asyncIterator(`ESCROW_UPDATED_${escrowId}`);
//       }
//     },

//     newWebhookEvent: {
//       subscribe: async (_, { gatewayId }, { pubsub, user }) => {
//         if (!user) throw new AuthenticationError('Authentication required');
//         if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
//           throw new AuthorizationError('Admin access required');
//         }
        
//         return pubsub.asyncIterator(`NEW_WEBHOOK_EVENT_${gatewayId || 'ALL'}`);
//       }
//     }
//   }
// };

import paymentService from '../../services/payment/payment.service.js';
import zainpayService from '../../services/payment/zainpay.service.js';
import webhookService from '../../services/payment/webhook.service.js';
import Transaction from '../../models/Transaction.js';
import VirtualAccount from '../../models/VirtualAccount.js';
import Payment from '../../models/Payment.js';
import User from '../../models/User.js';
import { PAYMENT_STATUS } from '../../constants/paymentConstants.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../errors/index.js';

export const paymentResolvers = {
  // Custom scalars
  JSON: {
    __serialize: (value) => value,
    __parseValue: (value) => value,
    __parseLiteral: (ast) => ast.value
  },

  // Type resolvers
  Payment: {
    user: async (parent, _, { loaders }) => {
      return await loaders.userLoader.load(parent.userId);
    },
    virtualAccount: async (parent) => {
      if (!parent.metadata?.virtualAccountId) return null;
      return await VirtualAccount.findById(parent.metadata.virtualAccountId);
    },
    subscription: async (parent) => {
      if (!parent.metadata?.subscriptionId) return null;
      const Subscription = (await import('../../models/Subscription.js')).default;
      return await Subscription.findById(parent.metadata.subscriptionId);
    },
    // Add other field resolvers as needed
  },

  Transaction: {
    user: async (parent, _, { loaders }) => {
      return await loaders.userLoader.load(parent.userId);
    },
    payment: async (parent) => {
      if (!parent.metadata?.paymentId) return null;
      return await Payment.findById(parent.metadata.paymentId);
    }
  },

  // Query resolvers
  Query: {
    // Current User Queries
    myWallet: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      // Get or create wallet for user
      const Wallet = (await import('../../models/Wallet.js')).default;
      let wallet = await Wallet.findOne({ userId: user.id });
      
      if (!wallet) {
        wallet = await Wallet.create({
          userId: user.id,
          balance: 0,
          currency: 'NGN',
          lockedBalance: 0,
          availableBalance: 0,
          dailyLimit: 10000000, // ₦100,000
          monthlyLimit: 300000000, // ₦3,000,000
          perTransactionLimit: 5000000 // ₦50,000
        });
      }
      
      return wallet;
    },

    myTransactions: async (_, { filter = {}, pagination = {} }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;
      
      const query = { userId: user.id };
      
      // Apply filters
      if (filter.direction) query.direction = filter.direction;
      if (filter.startDate || filter.endDate) {
        query.createdAt = {};
        if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
        if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
      }
      if (filter.minAmount) query.amount = { $gte: filter.minAmount };
      if (filter.maxAmount) {
        if (!query.amount) query.amount = {};
        query.amount.$lte = filter.maxAmount;
      }
      if (filter.reference) query.reference = { $regex: filter.reference, $options: 'i' };

      const [transactions, totalCount] = await Promise.all([
        Transaction.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'firstName lastName username email')
          .exec(),
        Transaction.countDocuments(query)
      ]);

      return {
        edges: transactions.map(transaction => ({
          node: transaction,
          cursor: transaction._id.toString()
        })),
        pageInfo: {
          hasNextPage: page * limit < totalCount,
          hasPreviousPage: page > 1,
          startCursor: transactions[0]?._id.toString() || null,
          endCursor: transactions[transactions.length - 1]?._id.toString() || null
        },
        totalCount
      };
    },

    myPayments: async (_, { filter = {}, pagination = {} }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;
      
      const query = { userId: user.id };
      
      // Apply filters
      if (filter.status) query.status = filter.status;
      if (filter.paymentType) query.paymentType = filter.paymentType;
      if (filter.paymentMethod) query.paymentMethod = filter.paymentMethod;
      if (filter.startDate || filter.endDate) {
        query.createdAt = {};
        if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
        if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
      }
      if (filter.minAmount) query.amount = { $gte: filter.minAmount };
      if (filter.maxAmount) {
        if (!query.amount) query.amount = {};
        query.amount.$lte = filter.maxAmount;
      }
      if (filter.search) {
        query.$or = [
          { reference: { $regex: filter.search, $options: 'i' } },
          { 'metadata.description': { $regex: filter.search, $options: 'i' } }
        ];
      }

      const [payments, totalCount] = await Promise.all([
        Payment.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'firstName lastName username email')
          .exec(),
        Payment.countDocuments(query)
      ]);

      return {
        edges: payments.map(payment => ({
          node: payment,
          cursor: payment._id.toString()
        })),
        pageInfo: {
          hasNextPage: page * limit < totalCount,
          hasPreviousPage: page > 1,
          startCursor: payments[0]?._id.toString() || null,
          endCursor: payments[payments.length - 1]?._id.toString() || null
        },
        totalCount
      };
    },

    myWithdrawals: async (_, { status, pagination = {} }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;
      
      const query = { userId: user.id };
      if (status) query.status = status;

      const Withdrawal = (await import('../../models/Withdrawal.js')).default;
      const withdrawals = await Withdrawal.find(query)
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName username email');

      return withdrawals;
    },

    myEscrows: async (_, { status, pagination = {} }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;
      
      const query = { 
        $or: [{ buyerId: user.id }, { sellerId: user.id }]
      };
      if (status) query.status = status;

      const Escrow = (await import('../../models/Escrow.js')).default;
      const escrows = await Escrow.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('buyer', 'firstName lastName username email')
        .populate('seller', 'firstName lastName username email');

      return escrows;
    },

    // Payment Flow - REMOVED initializePayment and verifyPayment from Query (moved to Mutation)

    // Escrow
    escrowDetails: async (_, { escrowId }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      const Escrow = (await import('../../models/Escrow.js')).default;
      const escrow = await Escrow.findById(escrowId)
        .populate('buyer', 'firstName lastName username email')
        .populate('seller', 'firstName lastName username email')
        .populate('marketplaceListing', 'title price')
        .populate('job', 'title budget')
        .populate('bounty', 'title reward');

      if (!escrow) throw new ValidationError('Escrow not found');
      
      // Check if user is involved in this escrow
      if (escrow.buyer._id.toString() !== user.id && 
          escrow.seller._id.toString() !== user.id) {
        throw new AuthorizationError('You do not have access to this escrow');
      }
      
      return escrow;
    },

    escrowBalance: async (_, { escrowId }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      const Escrow = (await import('../../models/Escrow.js')).default;
      const escrow = await Escrow.findById(escrowId);
      
      if (!escrow) throw new ValidationError('Escrow not found');
      
      // Check if user is involved in this escrow
      if (escrow.buyer.toString() !== user.id && 
          escrow.seller.toString() !== user.id) {
        throw new AuthorizationError('You do not have access to this escrow');
      }
      
      // Calculate current balance (total funded minus released)
      const Payment = (await import('../../models/Payment.js')).default;
      const funded = await Payment.aggregate([
        { $match: { 'metadata.escrowId': escrowId, status: PAYMENT_STATUS.SUCCESS } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const released = await Payment.aggregate([
        { $match: { 'metadata.escrowReleaseId': escrowId, status: PAYMENT_STATUS.SUCCESS } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const totalFunded = funded[0]?.total || 0;
      const totalReleased = released[0]?.total || 0;
      
      return totalFunded - totalReleased;
    },

    // Admin Queries
    allPayments: async (_, { filter = {}, pagination = {} }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new AuthorizationError('Admin access required');
      }
      
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;
      
      const query = {};
      
      // Apply filters
      if (filter.status) query.status = filter.status;
      if (filter.paymentType) query.paymentType = filter.paymentType;
      if (filter.paymentMethod) query.paymentMethod = filter.paymentMethod;
      if (filter.userId) query.userId = filter.userId;
      if (filter.startDate || filter.endDate) {
        query.createdAt = {};
        if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
        if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
      }
      if (filter.minAmount) query.amount = { $gte: filter.minAmount };
      if (filter.maxAmount) {
        if (!query.amount) query.amount = {};
        query.amount.$lte = filter.maxAmount;
      }
      if (filter.search) {
        query.$or = [
          { reference: { $regex: filter.search, $options: 'i' } },
          { 'metadata.description': { $regex: filter.search, $options: 'i' } },
          { 'userId.email': { $regex: filter.search, $options: 'i' } }
        ];
      }

      const [payments, totalCount] = await Promise.all([
        Payment.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'firstName lastName username email')
          .exec(),
        Payment.countDocuments(query)
      ]);

      return {
        edges: payments.map(payment => ({
          node: payment,
          cursor: payment._id.toString()
        })),
        pageInfo: {
          hasNextPage: page * limit < totalCount,
          hasPreviousPage: page > 1,
          startCursor: payments[0]?._id.toString() || null,
          endCursor: payments[payments.length - 1]?._id.toString() || null
        },
        totalCount
      };
    },

    paymentStats: async (_, { startDate, endDate, groupBy = 'DAY' }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      if (!['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_ADMIN'].includes(user.role)) {
        throw new AuthorizationError('Admin access required');
      }
      
      return await paymentService.getPaymentStatistics(startDate, endDate, groupBy);
    },

    paymentGateway: async (_, { gatewayId }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new AuthorizationError('Admin access required');
      }
      
      const PaymentGateway = (await import('../../models/PaymentGateway.js')).default;
      const gateway = await PaymentGateway.findById(gatewayId);
      
      if (!gateway) throw new ValidationError('Payment gateway not found');
      
      return gateway;
    },

    paymentGateways: async (_, { status }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new AuthorizationError('Admin access required');
      }
      
      const query = status ? { status } : {};
      const PaymentGateway = (await import('../../models/PaymentGateway.js')).default;
      return await PaymentGateway.find(query).sort({ createdAt: -1 });
    },

    webhookEvents: async (_, { gatewayId, status, pagination = {} }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new AuthorizationError('Admin access required');
      }
      
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;
      
      const query = {};
      if (gatewayId) query.gateway = gatewayId;
      if (status) query.status = status;

      const WebhookEvent = (await import('../../models/WebhookEvent.js')).default;
      const [events, totalCount] = await Promise.all([
        WebhookEvent.find(query)
          .sort({ receivedAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('gateway')
          .exec(),
        WebhookEvent.countDocuments(query)
      ]);

      return {
        edges: events.map(event => ({
          node: event,
          cursor: event._id.toString()
        })),
        pageInfo: {
          hasNextPage: page * limit < totalCount,
          hasPreviousPage: page > 1,
          startCursor: events[0]?._id.toString() || null,
          endCursor: events[events.length - 1]?._id.toString() || null
        },
        totalCount
      };
    }
  },

  // Mutation resolvers
  Mutation: {
    // Payment Processing - UPDATED
    processPayment: async (_, { paymentId }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      const Payment = (await import('../../models/Payment.js')).default;
      const payment = await Payment.findById(paymentId);
      
      if (!payment) throw new ValidationError('Payment not found');
      
      if (payment.userId.toString() !== user.id) {
        throw new AuthorizationError('You do not own this payment');
      }
      
      if (payment.status !== PAYMENT_STATUS.PENDING) {
        throw new ValidationError(`Payment already ${payment.status}`);
      }
      
      // Use the orchestrator for verification
      return await paymentService.verifyPayment(payment.gatewayRef, user.id);
    },
    
    // Add idempotency to initializePayment
    initializePayment: async (_, { input }, { user, req }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      // Generate or use provided idempotency key
      const idempotencyKey = req.headers['x-idempotency-key'] || 
        `idemp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return await paymentService.createPayment({
        userId: user.id,
        amount: input.amount,
        currency: input.currency,
        paymentType: input.paymentType,
        paymentMethod: input.paymentMethod || 'virtual_account',
        metadata: input.metadata || {},
        reference: input.reference,
        redirectUrl: input.redirectUrl,
        callbackUrl: input.callbackUrl,
        idempotencyKey
      });
    },
    
    // Update verifyPayment to use orchestrator
    verifyPayment: async (_, { reference }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      return await paymentService.verifyPayment(reference, user.id);
    },

    retryPayment: async (_, { paymentId }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      const payment = await Payment.findById(paymentId);
      if (!payment) throw new ValidationError('Payment not found');
      
      if (payment.userId.toString() !== user.id) {
        throw new AuthorizationError('You do not own this payment');
      }
      
      if (payment.status !== PAYMENT_STATUS.FAILED) {
        throw new ValidationError('Can only retry failed payments');
      }
      
      return await paymentService.retryPayment(paymentId);
    },

    // Refunds
    refundPayment: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      const payment = await Payment.findById(input.paymentId);
      if (!payment) throw new ValidationError('Payment not found');
      
      // Check permissions (admin or payment owner)
      if (payment.userId.toString() !== user.id && 
          !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new AuthorizationError('Permission denied');
      }
      
      return await paymentService.refundPayment(input);
    },

    cancelRefund: async (_, { refundId }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new AuthorizationError('Admin access required');
      }
      
      return await paymentService.cancelRefund(refundId);
    },

    // Withdrawals
    requestWithdrawal: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      // Check wallet balance
      const Wallet = (await import('../../models/Wallet.js')).default;
      const wallet = await Wallet.findOne({ userId: user.id });
      
      if (!wallet || wallet.availableBalance < input.amount) {
        throw new ValidationError('Insufficient balance');
      }
      
      // Validate bank details
      const bankService = (await import('../services/payment/bank.service.js')).default;
      const bankValidation = await bankService.validateBankDetails(
        input.accountNumber,
        input.bankCode
      );
      
      if (!bankValidation.valid) {
        throw new ValidationError('Invalid bank details');
      }
      
      return await paymentService.requestWithdrawal({
        userId: user.id,
        ...input
      });
    },

    cancelWithdrawal: async (_, { withdrawalId }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      const Withdrawal = (await import('../../models/Withdrawal.js')).default;
      const withdrawal = await Withdrawal.findById(withdrawalId);
      
      if (!withdrawal) throw new ValidationError('Withdrawal not found');
      
      if (withdrawal.userId.toString() !== user.id) {
        throw new AuthorizationError('You do not own this withdrawal');
      }
      
      if (withdrawal.status !== 'pending') {
        throw new ValidationError(`Cannot cancel withdrawal in ${withdrawal.status} status`);
      }
      
      withdrawal.status = 'cancelled';
      withdrawal.cancelledAt = new Date();
      await withdrawal.save();
      
      return { success: true, message: 'Withdrawal cancelled successfully' };
    },

    // Escrow Management
    createEscrow: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      // Verify buyer is the current user
      if (input.buyerId !== user.id) {
        throw new AuthorizationError('You can only create escrow as the buyer');
      }
      
      return await paymentService.createEscrow(input);
    },

    fundEscrow: async (_, { escrowId, paymentMethodId }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      const Escrow = (await import('../../models/Escrow.js')).default;
      const escrow = await Escrow.findById(escrowId);
      
      if (!escrow) throw new ValidationError('Escrow not found');
      
      if (escrow.buyer.toString() !== user.id) {
        throw new AuthorizationError('Only the buyer can fund this escrow');
      }
      
      if (escrow.status !== 'pending') {
        throw new ValidationError(`Escrow already ${escrow.status}`);
      }
      
      return await paymentService.fundEscrow(escrowId, paymentMethodId);
    },

    releaseEscrow: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      const Escrow = (await import('../../models/Escrow.js')).default;
      const escrow = await Escrow.findById(input.escrowId);
      
      if (!escrow) throw new ValidationError('Escrow not found');
      
      // Check if user is seller or has admin rights
      const isSeller = escrow.seller.toString() === user.id;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
      
      if (!isSeller && !isAdmin) {
        throw new AuthorizationError('Only seller or admin can release escrow');
      }
      
      return await paymentService.releaseEscrow(input);
    },

    cancelEscrow: async (_, { escrowId, reason }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      const Escrow = (await import('../../models/Escrow.js')).default;
      const escrow = await Escrow.findById(escrowId);
      
      if (!escrow) throw new ValidationError('Escrow not found');
      
      // Only buyer or admin can cancel before funding
      const isBuyer = escrow.buyer.toString() === user.id;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
      
      if (!isBuyer && !isAdmin) {
        throw new AuthorizationError('Permission denied');
      }
      
      return await paymentService.cancelEscrow(escrowId, reason);
    },

    // Disputes
    openDispute: async (_, { escrowId, reason, description }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      const Escrow = (await import('../../models/Escrow.js')).default;
      const escrow = await Escrow.findById(escrowId);
      
      if (!escrow) throw new ValidationError('Escrow not found');
      
      // Check if user is involved in escrow
      const isBuyer = escrow.buyer.toString() === user.id;
      const isSeller = escrow.seller.toString() === user.id;
      
      if (!isBuyer && !isSeller) {
        throw new AuthorizationError('You are not involved in this escrow');
      }
      
      return await paymentService.openDispute({
        escrowId,
        initiatorId: user.id,
        reason,
        description
      });
    },

    addDisputeEvidence: async (_, { disputeId, type, url, description }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      const Dispute = (await import('../../models/Dispute.js')).default;
      const dispute = await Dispute.findById(disputeId)
        .populate('escrow');
      
      if (!dispute) throw new ValidationError('Dispute not found');
      
      // Check if user is involved in the escrow
      const escrow = dispute.escrow;
      const isInvolved = escrow.buyer.toString() === user.id || 
                         escrow.seller.toString() === user.id;
      
      if (!isInvolved) {
        throw new AuthorizationError('You are not involved in this dispute');
      }
      
      return await paymentService.addDisputeEvidence({
        disputeId,
        userId: user.id,
        type,
        url,
        description
      });
    },

    resolveDispute: async (_, { disputeId, resolution }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      // Only admins can resolve disputes
      if (!['ADMIN', 'SUPER_ADMIN', 'SECURITY_ADMIN'].includes(user.role)) {
        throw new AuthorizationError('Admin access required');
      }
      
      return await paymentService.resolveDispute({
        disputeId,
        resolverId: user.id,
        resolution
      });
    },

    // Wallet
    transferFunds: async (_, { toUserId, amount, narration }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      if (user.id === toUserId) {
        throw new ValidationError('Cannot transfer to yourself');
      }
      
      // Check if recipient exists
      const recipient = await User.findById(toUserId);
      if (!recipient) throw new ValidationError('Recipient not found');
      
      return await paymentService.transferFunds({
        fromUserId: user.id,
        toUserId,
        amount,
        narration
      });
    },

    // Admin
    creditUserWallet: async (_, { userId, amount, reason }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      if (!['ADMIN', 'SUPER_ADMIN', 'SUBSCRIPTION_ADMIN'].includes(user.role)) {
        throw new AuthorizationError('Admin access required');
      }
      
      return await paymentService.creditUserWallet({
        adminId: user.id,
        userId,
        amount,
        reason
      });
    },

    debitUserWallet: async (_, { userId, amount, reason }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      if (!['ADMIN', 'SUPER_ADMIN', 'SUBSCRIPTION_ADMIN'].includes(user.role)) {
        throw new AuthorizationError('Admin access required');
      }
      
      return await paymentService.debitUserWallet({
        adminId: user.id,
        userId,
        amount,
        reason
      });
    },

    updatePaymentGateway: async (_, { gatewayId, input }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new AuthorizationError('Admin access required');
      }
      
      const PaymentGateway = (await import('../../models/PaymentGateway.js')).default;
      const gateway = await PaymentGateway.findByIdAndUpdate(
        gatewayId,
        { ...input, updatedAt: new Date() },
        { new: true }
      );
      
      if (!gateway) throw new ValidationError('Payment gateway not found');
      
      return gateway;
    },

    togglePaymentGateway: async (_, { gatewayId, active }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new AuthorizationError('Admin access required');
      }
      
      const PaymentGateway = (await import('../../models/PaymentGateway.js')).default;
      const gateway = await PaymentGateway.findById(gatewayId);
      
      if (!gateway) throw new ValidationError('Payment gateway not found');
      
      gateway.status = active ? 'ACTIVE' : 'INACTIVE';
      gateway.updatedAt = new Date();
      await gateway.save();
      
      return gateway;
    },

    retryWebhook: async (_, { webhookId }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new AuthorizationError('Admin access required');
      }
      
      return await webhookService.retryWebhook(webhookId);
    },

    // Manual Override
    manuallyCompletePayment: async (_, { paymentId, reference }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new AuthorizationError('Admin access required');
      }
      
      return await paymentService.manuallyCompletePayment(paymentId, reference);
    },

    manuallyFailPayment: async (_, { paymentId, reason }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new AuthorizationError('Admin access required');
      }
      
      return await paymentService.manuallyFailPayment(paymentId, reason);
    }
  },

  // Subscription resolvers
  Subscription: {
    paymentStatusChanged: {
      subscribe: async (_, { paymentId }, { pubsub, user }) => {
        if (!user) throw new AuthenticationError('Authentication required');
        
        // Verify user has access to this payment
        const payment = await Payment.findById(paymentId);
        if (!payment) throw new ValidationError('Payment not found');
        
        if (payment.userId.toString() !== user.id && 
            !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
          throw new AuthorizationError('Access denied');
        }
        
        return pubsub.asyncIterator(`PAYMENT_STATUS_CHANGED_${paymentId}`);
      }
    },

    walletUpdated: {
      subscribe: async (_, { userId }, { pubsub, user }) => {
        if (!user) throw new AuthenticationError('Authentication required');
        
        // Users can only subscribe to their own wallet updates
        // Admins can subscribe to any wallet
        if (userId !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
          throw new AuthorizationError('Access denied');
        }
        
        return pubsub.asyncIterator(`WALLET_UPDATED_${userId}`);
      }
    },

    escrowUpdated: {
      subscribe: async (_, { escrowId }, { pubsub, user }) => {
        if (!user) throw new AuthenticationError('Authentication required');
        
        const Escrow = (await import('../../models/Escrow.js')).default;
        const escrow = await Escrow.findById(escrowId);
        
        if (!escrow) throw new ValidationError('Escrow not found');
        
        // Check if user is involved in escrow
        const isInvolved = escrow.buyer.toString() === user.id || 
                           escrow.seller.toString() === user.id;
        
        if (!isInvolved && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
          throw new AuthorizationError('Access denied');
        }
        
        return pubsub.asyncIterator(`ESCROW_UPDATED_${escrowId}`);
      }
    },

    newWebhookEvent: {
      subscribe: async (_, { gatewayId }, { pubsub, user }) => {
        if (!user) throw new AuthenticationError('Authentication required');
        if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
          throw new AuthorizationError('Admin access required');
        }
        
        return pubsub.asyncIterator(`NEW_WEBHOOK_EVENT_${gatewayId || 'ALL'}`);
      }
    }
  }
};