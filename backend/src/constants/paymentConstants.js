export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  EXPIRED: 'expired',
  PARTIALLY_REFUNDED: 'partially_refunded',
  DISPUTED: 'disputed'
};

export const TRANSACTION_TYPE = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  TRANSFER: 'transfer',
  CARD_PAYMENT: 'card_payment',
  PAYMENT: 'payment',
  REFUND: 'refund',
  ESCROW_HOLD: 'escrow_hold',
  ESCROW_RELEASE: 'escrow_release',
  COMMISSION: 'commission',
  BONUS: 'bonus',
  CHARGEBACK: 'chargeback'
};

export const PAYMENT_METHOD = {
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  VIRTUAL_ACCOUNT: 'virtual_account',
  WALLET: 'wallet',
  ESCROW: 'escrow',
  SUBSCRIPTION: 'subscription',
  FREE: 'free'
};

export const PAYMENT_TYPE = {
  SUBSCRIPTION: 'subscription',
  JOB_POSTING: 'job_posting',
  MARKETPLACE_SLOT: 'marketplace_slot',
  SOLUTION_UPGRADE: 'solution_upgrade',
  BOUNTY: 'bounty',
  ESCROW_DEPOSIT: 'escrow_deposit',
  ESCROW_RELEASE: 'escrow_release',
  WITHDRAWAL: 'withdrawal',
  REFUND: 'refund',
  ADMIN_CREDIT: 'admin_credit',
  OTHER: 'other'
};

export const CURRENCY = {
  NGN: 'NGN',
  USD: 'USD',
  GBP: 'GBP',
  EUR: 'EUR'
};

export const ESCROW_STATUS = {
  PENDING: 'pending',
  FUNDED: 'funded',
  IN_DISPUTE: 'in_dispute',
  RELEASED_TO_BUYER: 'released_to_buyer',
  RELEASED_TO_SELLER: 'released_to_seller',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
};

export const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

export const DISPUTE_STATUS = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled'
};

export const DISPUTE_EVIDENCE_TYPE = {
  IMAGE: 'image',
  DOCUMENT: 'document',
  VIDEO: 'video',
  AUDIO: 'audio',
  CHAT_LOG: 'chat_log',
  CONTRACT: 'contract',
  OTHER: 'other'
};