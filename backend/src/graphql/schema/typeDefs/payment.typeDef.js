// import { gql } from 'apollo-server-express';

// export const paymentTypeDef = gql`
//   # ==========================================
//   # ENUMS
//   # ==========================================

//   enum PaymentStatus {
//     PENDING
//     PROCESSING
//     SUCCESSFUL
//     FAILED
//     CANCELLED
//     REFUNDED
//     PARTIALLY_REFUNDED
//     DISPUTED
//   }

//   enum PaymentMethod {
//     CARD
//     BANK_TRANSFER
//     VIRTUAL_ACCOUNT
//     WALLET
//     ESCROW
//     SUBSCRIPTION
//     FREE
//   }

//   enum PaymentType {
//     SUBSCRIPTION
//     JOB_POSTING
//     MARKETPLACE_SLOT
//     SOLUTION_UPGRADE
//     BOUNTY
//     ESCROW_DEPOSIT
//     ESCROW_RELEASE
//     WITHDRAWAL
//     REFUND
//     ADMIN_CREDIT
//     OTHER
//   }

//   enum Currency {
//     NGN
//     USD
//     GBP
//     EUR
//   }

//   enum EscrowStatus {
//     PENDING
//     FUNDED
//     IN_DISPUTE
//     RELEASED_TO_BUYER
//     RELEASED_TO_SELLER
//     REFUNDED
//     CANCELLED
//   }

//   enum TransactionDirection {
//     INCOMING
//     OUTGOING
//   }

//   enum WithdrawalStatus {
//     PENDING
//     PROCESSING
//     COMPLETED
//     FAILED
//     CANCELLED
//   }

//   # ==========================================
//   # INPUT TYPES
//   # ==========================================

//   input InitializePaymentInput {
//     amount: Int!
//     currency: Currency!
//     paymentType: PaymentType!
//     reference: String!
//     metadata: JSON
//     redirectUrl: String
//     callbackUrl: String
//   }

//   input VerifyPaymentInput {
//     paymentId: ID!
//     transactionReference: String
//   }

//   input CreateEscrowInput {
//     amount: Int!
//     currency: Currency!
//     buyerId: ID!
//     sellerId: ID!
//     marketplaceListingId: ID
//     jobId: ID
//     bountyId: ID
//     description: String!
//     terms: String!
//     releaseConditions: JSON!
//     metadata: JSON
//   }

//   input ReleaseEscrowInput {
//     escrowId: ID!
//     releaseTo: ReleaseTo!
//     amount: Int!
//     reason: String
//     metadata: JSON
//   }

//   input RefundPaymentInput {
//     paymentId: ID!
//     amount: Int!
//     reason: String!
//     metadata: JSON
//   }

//   input WithdrawalRequestInput {
//     amount: Int!
//     currency: Currency!
//     bankCode: String!
//     accountNumber: String!
//     accountName: String!
//     narration: String
//   }

//   input PaymentFilterInput {
//     status: PaymentStatus
//     paymentType: PaymentType
//     paymentMethod: PaymentMethod
//     userId: ID
//     startDate: DateTime
//     endDate: DateTime
//     minAmount: Int
//     maxAmount: Int
//     search: String
//   }

//   input TransactionFilterInput {
//     direction: TransactionDirection
//     startDate: DateTime
//     endDate: DateTime
//     minAmount: Int
//     maxAmount: Int
//     reference: String
//   }

//   enum ReleaseTo {
//     BUYER
//     SELLER
//     BOTH
//   }

//   # ==========================================
//   # TYPES
//   # ==========================================

//   type Payment {
//     id: ID!
//     user: User!
//     amount: Int!
//     currency: Currency!
//     status: PaymentStatus!
//     paymentMethod: PaymentMethod!
//     paymentType: PaymentType!
    
//     # Transaction Details
//     reference: String!
//     externalReference: String
//     gatewayResponse: JSON
//     metadata: JSON
    
//     # Related Entities
//     subscription: Subscription
//     job: Job
//     marketplaceListing: MarketplaceListing
//     solution: Solution
//     bounty: Bounty
//     escrow: Escrow
//     invoice: Invoice
    
//     # Dates
//     initiatedAt: DateTime!
//     processedAt: DateTime
//     completedAt: DateTime
//     refundedAt: DateTime
    
//     # Fees
//     gatewayFee: Int!
//     platformFee: Int!
//     totalFee: Int!
//     netAmount: Int!
    
//     # Card Details (if applicable)
//     cardLastFour: String
//     cardBrand: String
//     cardCountry: String
    
//     # Virtual Account (if applicable)
//     virtualAccount: VirtualAccountDetails
    
//     # Timestamps
//     createdAt: DateTime!
//     updatedAt: DateTime!
//   }

//   type VirtualAccountDetails {
//     accountNumber: String!
//     accountName: String!
//     bankName: String!
//     bankCode: String!
//     expiresAt: DateTime
//   }

//   type Escrow {
//     id: ID!
//     amount: Int!
//     currency: Currency!
//     status: EscrowStatus!
    
//     # Parties
//     buyer: User!
//     seller: User!
//     marketplaceListing: MarketplaceListing
//     job: Job
//     bounty: Bounty
    
//     # Terms
//     description: String!
//     terms: String!
//     releaseConditions: JSON!
    
//     # Payments
//     payments: [Payment!]!
//     releasedPayments: [Payment!]!
    
//     # Dispute
//     inDispute: Boolean!
//     dispute: Dispute
    
//     # Dates
//     createdAt: DateTime!
//     fundedAt: DateTime
//     releasedAt: DateTime
//     cancelledAt: DateTime
//     expiresAt: DateTime
    
//     # Metadata
//     metadata: JSON
//   }

//   type Transaction {
//     id: ID!
//     user: User!
//     amount: Int!
//     currency: Currency!
//     direction: TransactionDirection!
//     type: TransactionType!
    
//     # Details
//     reference: String!
//     narration: String!
//     balanceBefore: Int!
//     balanceAfter: Int!
    
//     # Related Entities
//     payment: Payment
//     escrow: Escrow
//     withdrawal: Withdrawal
    
//     # Metadata
//     metadata: JSON
//     ipAddress: String
//     userAgent: String
    
//     # Timestamps
//     createdAt: DateTime!
//   }

//   enum TransactionType {
//     DEPOSIT
//     WITHDRAWAL
//     PAYMENT
//     REFUND
//     ESCROW_HOLD
//     ESCROW_RELEASE
//     COMMISSION
//     BONUS
//     CHARGEBACK
//   }

//   type Wallet {
//     id: ID!
//     user: User!
//     balance: Int!
//     currency: Currency!
//     lockedBalance: Int!
//     availableBalance: Int!
    
//     # Limits
//     dailyLimit: Int!
//     monthlyLimit: Int!
//     perTransactionLimit: Int!
    
//     # Stats
//     totalDeposits: Int!
//     totalWithdrawals: Int!
//     totalTransactions: Int!
    
//     # Virtual Account
//     virtualAccount: VirtualAccountDetails
    
//     # Timestamps
//     createdAt: DateTime!
//     updatedAt: DateTime!
//   }

//   type Withdrawal {
//     id: ID!
//     user: User!
//     amount: Int!
//     currency: Currency!
//     status: WithdrawalStatus!
    
//     # Bank Details
//     bankCode: String!
//     accountNumber: String!
//     accountName: String!
//     bankName: String!
    
//     # Processing
//     reference: String!
//     externalReference: String
//     gatewayResponse: JSON
//     failureReason: String
    
//     # Fees
//     processingFee: Int!
//     netAmount: Int!
    
//     # Dates
//     requestedAt: DateTime!
//     processedAt: DateTime
//     completedAt: DateTime
//     cancelledAt: DateTime
    
//     # Metadata
//     narration: String
//     metadata: JSON
    
//     # Timestamps
//     createdAt: DateTime!
//     updatedAt: DateTime!
//   }

//   type Dispute {
//     id: ID!
//     escrow: Escrow!
//     initiator: User!
//     reason: String!
//     description: String!
    
//     # Status
//     status: DisputeStatus!
//     resolution: DisputeResolution
    
//     # Evidence
//     evidence: [DisputeEvidence!]!
    
//     # Resolution
//     resolvedBy: User
//     resolutionAmount: Int
//     resolutionSplit: JSON
    
//     # Dates
//     createdAt: DateTime!
//     updatedAt: DateTime!
//     resolvedAt: DateTime
//   }

//   enum DisputeStatus {
//     OPEN
//     UNDER_REVIEW
//     RESOLVED
//     CANCELLED
//   }

//   type DisputeResolution {
//     winner: User
//     amountToBuyer: Int
//     amountToSeller: Int
//     notes: String
//     evidenceUsed: [String!]
//   }

//   type DisputeEvidence {
//     id: ID!
//     user: User!
//     type: DisputeEvidenceType!
//     url: String!
//     description: String
//     uploadedAt: DateTime!
//   }

//   enum DisputeEvidenceType {
//     IMAGE
//     DOCUMENT
//     VIDEO
//     AUDIO
//     CHAT_LOG
//     CONTRACT
//     OTHER
//   }

//   type PaymentStats {
//     totalPayments: Int!
//     successfulPayments: Int!
//     failedPayments: Int!
//     totalVolume: Int!
//     averageTransactionValue: Float!
//     conversionRate: Float!
    
//     # By Type
//     byType: [PaymentTypeStats!]!
    
//     # By Method
//     byMethod: [PaymentMethodStats!]!
    
//     # Revenue
//     platformRevenue: Int!
//     gatewayRevenue: Int!
//     netRevenue: Int!
    
//     # Time-based
//     today: DailyStats!
//     thisWeek: WeeklyStats!
//     thisMonth: MonthlyStats!
//   }

//   type PaymentTypeStats {
//     type: PaymentType!
//     count: Int!
//     volume: Int!
//     percentage: Float!
//   }

//   type PaymentMethodStats {
//     method: PaymentMethod!
//     count: Int!
//     volume: Int!
//     percentage: Float!
//     successRate: Float!
//   }

//   type DailyStats {
//     date: DateTime!
//     count: Int!
//     volume: Int!
//     successful: Int!
//     failed: Int!
//   }

//   type WeeklyStats {
//     week: Int!
//     year: Int!
//     count: Int!
//     volume: Int!
//     successful: Int!
//     failed: Int!
//   }

//   type MonthlyStats {
//     month: Int!
//     year: Int!
//     count: Int!
//     volume: Int!
//     successful: Int!
//     failed: Int!
//   }

//   type PaymentGateway {
//     id: ID!
//     name: String!
//     type: GatewayType!
//     status: GatewayStatus!
    
//     # Configuration
//     credentials: JSON!
//     webhookUrl: String!
//     callbackUrl: String!
    
//     # Capabilities
//     supportedMethods: [PaymentMethod!]!
//     supportedCurrencies: [Currency!]!
    
//     # Performance
//     successRate: Float!
//     averageResponseTime: Int!
//     uptime: Float!
    
//     # Limits
//     minAmount: Int!
//     maxAmount: Int!
//     dailyLimit: Int!
    
//     # Metadata
//     metadata: JSON
//     lastChecked: DateTime!
    
//     # Timestamps
//     createdAt: DateTime!
//     updatedAt: DateTime!
//   }

//   enum GatewayType {
//     ZAINPAY
//     PAYSTACK
//     FLUTTERWAVE
//     STRIPE
//     PAYPAL
//     CUSTOM
//   }

//   enum GatewayStatus {
//     ACTIVE
//     INACTIVE
//     MAINTENANCE
//     SUSPENDED
//   }

//   type WebhookEvent {
//     id: ID!
//     gateway: PaymentGateway!
//     eventType: WebhookEventType!
//     payload: JSON!
//     signature: String!
//     status: WebhookStatus!
    
//     # Processing
//     attempts: Int!
//     lastAttemptAt: DateTime
//     response: JSON
    
//     # Metadata
//     ipAddress: String
//     userAgent: String
    
//     # Timestamps
//     receivedAt: DateTime!
//     processedAt: DateTime
//   }

//   enum WebhookEventType {
//     PAYMENT_SUCCESS
//     PAYMENT_FAILED
//     TRANSFER_SUCCESS
//     TRANSFER_FAILED
//     DISPUTE_OPENED
//     DISPUTE_CLOSED
//     SUBSCRIPTION_CREATED
//     SUBSCRIPTION_CANCELLED
//     REFUND_PROCESSED
//     CHARGEBACK
//   }

//   enum WebhookStatus {
//     PENDING
//     PROCESSING
//     PROCESSED
//     FAILED
//     RETRYING
//   }

//   # ==========================================
//   # QUERIES
//   # ==========================================

//   extend type Query {
//     # Current User
//     myWallet: Wallet!
//     myTransactions(
//       filter: TransactionFilterInput
//       pagination: PaginationInput
//     ): TransactionConnection!
    
//     myPayments(
//       filter: PaymentFilterInput
//       pagination: PaginationInput
//     ): PaymentConnection!
    
//     myWithdrawals(
//       status: WithdrawalStatus
//       pagination: PaginationInput
//     ): [Withdrawal!]!
    
//     myEscrows(
//       status: EscrowStatus
//       pagination: PaginationInput
//     ): [Escrow!]!
    
//     # Payment Flow
//     initializePayment(input: InitializePaymentInput!): Payment!
//     verifyPayment(reference: String!): Payment!
    
//     # Escrow
//     escrowDetails(escrowId: ID!): Escrow!
//     escrowBalance(escrowId: ID!): Int!
    
//     # Admin
//     allPayments(
//       filter: PaymentFilterInput
//       pagination: PaginationInput
//     ): PaymentConnection!
    
//     paymentStats(
//       startDate: DateTime
//       endDate: DateTime
//       groupBy: StatsGroupBy
//     ): PaymentStats!
    
//     paymentGateway(gatewayId: ID!): PaymentGateway!
//     paymentGateways(status: GatewayStatus): [PaymentGateway!]!
    
//     webhookEvents(
//       gatewayId: ID
//       status: WebhookStatus
//       pagination: PaginationInput
//     ): WebhookEventConnection!
//   }

//   type PaymentConnection {
//     edges: [PaymentEdge!]!
//     pageInfo: PageInfo!
//     totalCount: Int!
//   }

//   type PaymentEdge {
//     node: Payment!
//     cursor: String!
//   }

//   type TransactionConnection {
//     edges: [TransactionEdge!]!
//     pageInfo: PageInfo!
//     totalCount: Int!
//   }

//   type TransactionEdge {
//     node: Transaction!
//     cursor: String!
//   }

//   type WebhookEventConnection {
//     edges: [WebhookEventEdge!]!
//     pageInfo: PageInfo!
//     totalCount: Int!
//   }

//   type WebhookEventEdge {
//     node: WebhookEvent!
//     cursor: String!
//   }

//   enum StatsGroupBy {
//     DAY
//     WEEK
//     MONTH
//     YEAR
//     TYPE
//     METHOD
//   }

//   # ==========================================
//   # MUTATIONS
//   # ==========================================

//   extend type Mutation {
//     # Payment Processing
//     processPayment(paymentId: ID!): Payment!
//     retryPayment(paymentId: ID!): Payment!
    
//     # Refunds
//     refundPayment(input: RefundPaymentInput!): Payment!
//     cancelRefund(refundId: ID!): MessageResponse!
    
//     # Withdrawals
//     requestWithdrawal(input: WithdrawalRequestInput!): Withdrawal!
//     cancelWithdrawal(withdrawalId: ID!): MessageResponse!
    
//     # Escrow Management
//     createEscrow(input: CreateEscrowInput!): Escrow!
//     fundEscrow(escrowId: ID!, paymentMethodId: String!): Escrow!
//     releaseEscrow(input: ReleaseEscrowInput!): Escrow!
//     cancelEscrow(escrowId: ID!, reason: String!): Escrow!
    
//     # Disputes
//     openDispute(escrowId: ID!, reason: String!, description: String!): Dispute!
//     addDisputeEvidence(disputeId: ID!, type: DisputeEvidenceType!, url: String!, description: String): DisputeEvidence!
//     resolveDispute(disputeId: ID!, resolution: JSON!): Dispute!
    
//     # Wallet
//     transferFunds(toUserId: ID!, amount: Int!, narration: String!): Transaction!
    
//     # Admin
//     creditUserWallet(userId: ID!, amount: Int!, reason: String!): Wallet!
//     debitUserWallet(userId: ID!, amount: Int!, reason: String!): Wallet!
    
//     updatePaymentGateway(gatewayId: ID!, input: GatewayUpdateInput!): PaymentGateway!
//     togglePaymentGateway(gatewayId: ID!, active: Boolean!): PaymentGateway!
    
//     retryWebhook(webhookId: ID!): WebhookEvent!
    
//     # Manual Override
//     manuallyCompletePayment(paymentId: ID!, reference: String!): Payment!
//     manuallyFailPayment(paymentId: ID!, reason: String!): Payment!
//   }

//   input GatewayUpdateInput {
//     name: String
//     credentials: JSON
//     webhookUrl: String
//     callbackUrl: String
//     status: GatewayStatus
//     metadata: JSON
//   }
// `;

// export default paymentTypeDef;


import { gql } from 'apollo-server-express';

export const paymentTypeDef = gql`
  # ==========================================
  # ENUMS (updated to match constants)
  # ==========================================

  enum PaymentStatus {
    PENDING
    PROCESSING
    SUCCESSFUL
    FAILED
    CANCELLED
    REFUNDED
    PARTIALLY_REFUNDED
    DISPUTED
  }

  enum PaymentMethod {
    CARD
    BANK_TRANSFER
    VIRTUAL_ACCOUNT
    WALLET
    ESCROW
    SUBSCRIPTION
    FREE
  }

  enum PaymentType {
    SUBSCRIPTION
    JOB_POSTING
    MARKETPLACE_SLOT
    SOLUTION_UPGRADE
    BOUNTY
    ESCROW_DEPOSIT
    ESCROW_RELEASE
    WITHDRAWAL
    REFUND
    ADMIN_CREDIT
    OTHER
  }

  enum Currency {
    NGN
    USD
    GBP
    EUR
  }

  enum EscrowStatus {
    PENDING
    FUNDED
    IN_DISPUTE
    RELEASED_TO_BUYER
    RELEASED_TO_SELLER
    REFUNDED
    CANCELLED
  }

  enum TransactionDirection {
    INCOMING
    OUTGOING
  }

  enum TransactionType {
    DEPOSIT
    WITHDRAWAL
    PAYMENT
    REFUND
    ESCROW_HOLD
    ESCROW_RELEASE
    COMMISSION
    BONUS
    CHARGEBACK
  }

  enum WithdrawalStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
  }

  enum DisputeStatus {
    OPEN
    UNDER_REVIEW
    RESOLVED
    CANCELLED
  }

  enum DisputeEvidenceType {
    IMAGE
    DOCUMENT
    VIDEO
    AUDIO
    CHAT_LOG
    CONTRACT
    OTHER
  }

  enum GatewayType {
    ZAINPAY
    PAYSTACK
    FLUTTERWAVE
    STRIPE
    PAYPAL
    CUSTOM
  }

  enum GatewayStatus {
    ACTIVE
    INACTIVE
    MAINTENANCE
    SUSPENDED
  }

  enum WebhookEventType {
    PAYMENT_SUCCESS
    PAYMENT_FAILED
    TRANSFER_SUCCESS
    TRANSFER_FAILED
    DISPUTE_OPENED
    DISPUTE_CLOSED
    SUBSCRIPTION_CREATED
    SUBSCRIPTION_CANCELLED
    REFUND_PROCESSED
    CHARGEBACK
  }

  enum WebhookStatus {
    PENDING
    PROCESSING
    PROCESSED
    FAILED
    RETRYING
  }

  enum ReleaseTo {
    BUYER
    SELLER
    BOTH
  }

  enum StatsGroupBy {
    DAY
    WEEK
    MONTH
    YEAR
    TYPE
    METHOD
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input InitializePaymentInput {
    amount: Int!
    currency: Currency!
    paymentType: PaymentType!
    paymentMethod: PaymentMethod
    gateway: GatewayType
    reference: String
    metadata: JSON
    redirectUrl: String
    callbackUrl: String
  }

  input ProcessPaymentInput {
    paymentId: ID!
    verificationCode: String
  }

  input VerifyPaymentInput {
    reference: String!
    paymentId: ID
  }

  input CreateEscrowInput {
    amount: Int!
    currency: Currency!
    buyerId: ID!
    sellerId: ID!
    marketplaceListingId: ID
    jobId: ID
    bountyId: ID
    description: String!
    terms: String!
    releaseConditions: JSON!
    expiresInDays: Int
    metadata: JSON
  }

  input ReleaseEscrowInput {
    escrowId: ID!
    releaseTo: ReleaseTo!
    amount: Int!
    reason: String
    metadata: JSON
  }

  input RefundPaymentInput {
    paymentId: ID!
    amount: Int!
    reason: String!
    metadata: JSON
  }

  input WithdrawalRequestInput {
    amount: Int!
    currency: Currency!
    bankCode: String!
    accountNumber: String!
    accountName: String!
    narration: String
    metadata: JSON
  }

  input PaymentFilterInput {
    status: PaymentStatus
    paymentType: PaymentType
    paymentMethod: PaymentMethod
    userId: ID
    startDate: DateTime
    endDate: DateTime
    minAmount: Int
    maxAmount: Int
    search: String
  }

  input TransactionFilterInput {
    type: TransactionType
    direction: TransactionDirection
    startDate: DateTime
    endDate: DateTime
    minAmount: Int
    maxAmount: Int
    reference: String
  }

  input GatewayUpdateInput {
    name: String
    credentials: JSON
    webhookUrl: String
    callbackUrl: String
    status: GatewayStatus
    metadata: JSON
  }

  # ==========================================
  # TYPES
  # ==========================================

  type Payment {
    id: ID!
    user: User!
    amount: Int!
    currency: Currency!
    status: PaymentStatus!
    paymentMethod: PaymentMethod!
    paymentType: PaymentType!
    gateway: GatewayType!
    
    # Transaction Details
    reference: String!
    externalReference: String
    gatewayResponse: JSON
    metadata: JSON
    
    # Related Entities
    subscription: Subscription
    job: Job
    marketplaceListing: MarketplaceListing
    solution: Solution
    bounty: Bounty
    escrow: Escrow
    invoice: Invoice
    virtualAccount: VirtualAccountDetails
    transaction: Transaction
    
    # Dates
    initiatedAt: DateTime!
    processedAt: DateTime
    completedAt: DateTime
    refundedAt: DateTime
    expiresAt: DateTime
    
    # Fees
    gatewayFee: Int!
    platformFee: Int!
    totalFee: Int!
    netAmount: Int!
    
    # Card Details (if applicable)
    cardLastFour: String
    cardBrand: String
    cardCountry: String
    
    # URLs
    redirectUrl: String
    callbackUrl: String
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type VirtualAccountDetails {
    accountNumber: String!
    accountName: String!
    bankName: String!
    bankCode: String!
    expiresAt: DateTime
  }

  type Escrow {
    id: ID!
    amount: Int!
    currency: Currency!
    status: EscrowStatus!
    
    # Parties
    buyer: User!
    seller: User!
    marketplaceListing: MarketplaceListing
    job: Job
    bounty: Bounty
    
    # Terms
    description: String!
    terms: String!
    releaseConditions: JSON!
    
    # Payments
    payments: [Payment!]!
    releasedPayments: [Payment!]!
    
    # Dispute
    inDispute: Boolean!
    dispute: Dispute
    
    # Dates
    createdAt: DateTime!
    fundedAt: DateTime
    releasedAt: DateTime
    cancelledAt: DateTime
    expiresAt: DateTime
    
    # Metadata
    metadata: JSON
  }

  type Transaction {
    id: ID!
    user: User!
    amount: Int!
    currency: Currency!
    direction: TransactionDirection!
    type: TransactionType!
    status: String!
    
    # Details
    reference: String!
    narration: String!
    balanceBefore: Int!
    balanceAfter: Int!
    
    # Related Entities
    payment: Payment
    escrow: Escrow
    withdrawal: Withdrawal
    
    # Metadata
    metadata: JSON
    ipAddress: String
    userAgent: String
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime
  }

  type Wallet {
    id: ID!
    user: User!
    balance: Int!
    currency: Currency!
    lockedBalance: Int!
    availableBalance: Int!
    
    # Limits
    dailyLimit: Int!
    monthlyLimit: Int!
    perTransactionLimit: Int!
    
    # Stats
    totalDeposits: Int!
    totalWithdrawals: Int!
    totalTransactions: Int!
    
    # Virtual Account
    virtualAccount: VirtualAccountDetails
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Withdrawal {
    id: ID!
    user: User!
    amount: Int!
    currency: Currency!
    status: WithdrawalStatus!
    
    # Bank Details
    bankCode: String!
    accountNumber: String!
    accountName: String!
    bankName: String!
    
    # Processing
    reference: String!
    externalReference: String
    gatewayResponse: JSON
    failureReason: String
    
    # Fees
    processingFee: Int!
    netAmount: Int!
    
    # Dates
    requestedAt: DateTime!
    processedAt: DateTime
    completedAt: DateTime
    cancelledAt: DateTime
    
    # Metadata
    narration: String
    metadata: JSON
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Dispute {
    id: ID!
    escrow: Escrow!
    initiator: User!
    reason: String!
    description: String!
    
    # Status
    status: DisputeStatus!
    resolution: DisputeResolution
    
    # Evidence
    evidence: [DisputeEvidence!]!
    
    # Resolution
    resolvedBy: User
    resolutionAmount: Int
    resolutionSplit: JSON
    
    # Dates
    createdAt: DateTime!
    updatedAt: DateTime!
    resolvedAt: DateTime
  }

  type DisputeResolution {
    winner: User
    amountToBuyer: Int
    amountToSeller: Int
    notes: String
    evidenceUsed: [String!]
  }

  type DisputeEvidence {
    id: ID!
    user: User!
    type: DisputeEvidenceType!
    url: String!
    description: String
    uploadedAt: DateTime!
  }

  type PaymentStats {
    totalPayments: Int!
    successfulPayments: Int!
    failedPayments: Int!
    totalVolume: Int!
    averageTransactionValue: Float!
    conversionRate: Float!
    
    # By Type
    byType: [PaymentTypeStats!]!
    
    # By Method
    byMethod: [PaymentMethodStats!]!
    
    # Revenue
    platformRevenue: Int!
    gatewayRevenue: Int!
    netRevenue: Int!
    
    # Time-based
    today: DailyStats!
    thisWeek: WeeklyStats!
    thisMonth: MonthlyStats!
  }

  type PaymentTypeStats {
    type: PaymentType!
    count: Int!
    volume: Int!
    percentage: Float!
  }

  type PaymentMethodStats {
    method: PaymentMethod!
    count: Int!
    volume: Int!
    percentage: Float!
    successRate: Float!
  }

  type DailyStats {
    date: DateTime!
    count: Int!
    volume: Int!
    successful: Int!
    failed: Int!
  }

  type WeeklyStats {
    week: Int!
    year: Int!
    count: Int!
    volume: Int!
    successful: Int!
    failed: Int!
  }

  type MonthlyStats {
    month: Int!
    year: Int!
    count: Int!
    volume: Int!
    successful: Int!
    failed: Int!
  }

  type PaymentGateway {
    id: ID!
    name: String!
    type: GatewayType!
    status: GatewayStatus!
    
    # Configuration
    credentials: JSON!
    webhookUrl: String!
    callbackUrl: String!
    
    # Capabilities
    supportedMethods: [PaymentMethod!]!
    supportedCurrencies: [Currency!]!
    
    # Performance
    successRate: Float!
    averageResponseTime: Int!
    uptime: Float!
    
    # Limits
    minAmount: Int!
    maxAmount: Int!
    dailyLimit: Int!
    
    # Metadata
    metadata: JSON
    lastChecked: DateTime!
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type WebhookEvent {
    id: ID!
    gateway: PaymentGateway!
    eventType: WebhookEventType!
    payload: JSON!
    signature: String!
    status: WebhookStatus!
    
    # Processing
    attempts: Int!
    lastAttemptAt: DateTime
    response: JSON
    
    # Metadata
    ipAddress: String
    userAgent: String
    
    # Timestamps
    receivedAt: DateTime!
    processedAt: DateTime
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Current User
    myWallet: Wallet!
    myTransactions(
      filter: TransactionFilterInput
      pagination: PaginationInput
    ): TransactionConnection!
    
    myPayments(
      filter: PaymentFilterInput
      pagination: PaginationInput
    ): PaymentConnection!
    
    myWithdrawals(
      status: WithdrawalStatus
      pagination: PaginationInput
    ): [Withdrawal!]!
    
    myEscrows(
      status: EscrowStatus
      pagination: PaginationInput
    ): [Escrow!]!
    
    # Payment Flow
    paymentDetails(paymentId: ID!): Payment!
    transactionDetails(reference: String!): Transaction!
    
    # Escrow
    escrowDetails(escrowId: ID!): Escrow!
    escrowBalance(escrowId: ID!): Int!
    
    # Admin
    allPayments(
      filter: PaymentFilterInput
      pagination: PaginationInput
    ): PaymentConnection!
    
    paymentStats(
      startDate: DateTime
      endDate: DateTime
      groupBy: StatsGroupBy
    ): PaymentStats!
    
    paymentGateway(gatewayId: ID!): PaymentGateway!
    paymentGateways(status: GatewayStatus): [PaymentGateway!]!
    
    webhookEvents(
      gatewayId: ID
      status: WebhookStatus
      pagination: PaginationInput
    ): WebhookEventConnection!
  }

  type PaymentConnection {
    edges: [PaymentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PaymentEdge {
    node: Payment!
    cursor: String!
  }

  type TransactionConnection {
    edges: [TransactionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TransactionEdge {
    node: Transaction!
    cursor: String!
  }

  type WebhookEventConnection {
    edges: [WebhookEventEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type WebhookEventEdge {
    node: WebhookEvent!
    cursor: String!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Payment Processing
    initializePayment(input: InitializePaymentInput!): Payment!
    processPayment(input: ProcessPaymentInput!): Payment!
    verifyPayment(input: VerifyPaymentInput!): Payment!
    retryPayment(paymentId: ID!): Payment!
    
    # Refunds
    refundPayment(input: RefundPaymentInput!): Payment!
    cancelRefund(refundId: ID!): MessageResponse!
    
    # Withdrawals
    requestWithdrawal(input: WithdrawalRequestInput!): Withdrawal!
    cancelWithdrawal(withdrawalId: ID!): MessageResponse!
    
    # Escrow Management
    createEscrow(input: CreateEscrowInput!): Escrow!
    fundEscrow(escrowId: ID!, paymentMethodId: String!): Escrow!
    releaseEscrow(input: ReleaseEscrowInput!): Escrow!
    cancelEscrow(escrowId: ID!, reason: String!): Escrow!
    
    # Disputes
    openDispute(escrowId: ID!, reason: String!, description: String!): Dispute!
    addDisputeEvidence(disputeId: ID!, type: DisputeEvidenceType!, url: String!, description: String): DisputeEvidence!
    resolveDispute(disputeId: ID!, resolution: JSON!): Dispute!
    
    # Wallet
    transferFunds(toUserId: ID!, amount: Int!, narration: String!): Transaction!
    
    # Admin
    creditUserWallet(userId: ID!, amount: Int!, reason: String!): Wallet!
    debitUserWallet(userId: ID!, amount: Int!, reason: String!): Wallet!
    
    updatePaymentGateway(gatewayId: ID!, input: GatewayUpdateInput!): PaymentGateway!
    togglePaymentGateway(gatewayId: ID!, active: Boolean!): PaymentGateway!
    
    retryWebhook(webhookId: ID!): WebhookEvent!
    
    # Manual Override
    manuallyCompletePayment(paymentId: ID!, reference: String!): Payment!
    manuallyFailPayment(paymentId: ID!, reason: String!): Payment!
  }
`;

export default paymentTypeDef;