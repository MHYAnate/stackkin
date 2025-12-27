import { PaymentGatewayInterface } from './PaymentGatewayInterface.js';
import axios from 'axios';
import crypto from 'crypto';
import { PaymentError, ValidationError } from '../../../errors/index.js';
import logger from '../../../config/logger.js';
import CurrencyHandler from '../../../utils/currencyHandler.js';

export class ZainpayGateway extends PaymentGatewayInterface {
  constructor(config) {
    super(config);
    this.name = 'zainpay';
    this.baseUrl = config.sandbox 
      ? 'https://sandbox-api.zainpay.ng' 
      : 'https://api.zainpay.ng';
    
    this.publicKey = config.publicKey;
    this.secretKey = config.secretKey;
    this.zainboxCode = config.zainboxCode;
    this.webhookSecret = config.webhookSecret;
    this.callbackUrl = config.callbackUrl;

    this.axios = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.publicKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async initializePayment(paymentData) {
    try {
      const { userId, amount, currency, paymentMethod, metadata } = paymentData;
      
      if (paymentMethod === 'virtual_account') {
        return await this.createDynamicVirtualAccount({
          userId,
          amount,
          email: metadata.email,
          duration: metadata.duration || 1800,
          metadata
        });
      } else if (paymentMethod === 'card') {
        return await this.initializeCardPayment({
          userId,
          amount,
          email: metadata.email,
          phone: metadata.phone,
          metadata
        });
      } else {
        throw new ValidationError(`Unsupported payment method: ${paymentMethod}`);
      }
    } catch (error) {
      logger.error('Initialize payment error:', error);
      throw new PaymentError(`Failed to initialize payment: ${error.message}`, 'GATEWAY_ERROR');
    }
  }

  async createDynamicVirtualAccount(data) {
    const { userId, amount, email, duration = 1800, metadata = {} } = data;
    
    const amountInKobo = CurrencyHandler.toKobo(amount);
    const txnRef = `DVA_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    const requestData = {
      bankType: 'gtBank',
      amount: amountInKobo.toString(),
      zainboxCode: this.zainboxCode,
      txnRef,
      duration: duration.toString(),
      accountName: 'Zainpay Checkout',
      callBackUrl: `${this.callbackUrl}/dva-callback`,
      email,
      metadata: JSON.stringify(metadata)
    };
    
    const response = await this.axios.post(
      '/virtual-account/dynamic/create/request',
      requestData
    );
    
    if (!response.data || response.data.responseCode !== '00') {
      throw new PaymentError(
        `Failed to create DVA: ${response.data?.responseMessage || 'Unknown error'}`,
        response.data?.responseCode
      );
    }
    
    return {
      success: true,
      gateway: 'zainpay',
      reference: txnRef,
      accountNumber: response.data.accountNumber,
      accountName: response.data.accountName,
      bankName: response.data.bankName,
      amount,
      amountInKobo,
      expiresAt: new Date(Date.now() + duration * 1000),
      rawResponse: response.data
    };
  }

  async initializeCardPayment(data) {
    const { userId, amount, email, phone, metadata = {} } = data;
    
    const txnRef = `CARD_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    const requestData = {
      amount: amount.toFixed(2),
      txnRef,
      zainboxCode: this.zainboxCode,
      emailAddress: email,
      mobileNumber: phone || '',
      callBackUrl: `${this.callbackUrl}/card-callback`,
      allowRecurringPayment: false,
      logoUrl: `${process.env.CLIENT_URL}/logo.png`,
      metadata: JSON.stringify(metadata)
    };
    
    const response = await this.axios.post(
      '/zainbox/card/initialize/payment',
      requestData
    );
    
    if (!response.data || !response.data.data) {
      throw new PaymentError(
        `Failed to initialize card payment: ${response.data?.responseMessage || 'Unknown error'}`,
        response.data?.responseCode
      );
    }
    
    return {
      success: true,
      gateway: 'zainpay',
      reference: txnRef,
      redirectUrl: response.data.data,
      amount,
      rawResponse: response.data
    };
  }

  async verifyPayment(reference, userId = null) {
    try {
      // Check if it's a card payment or DVA
      if (reference.startsWith('CARD_')) {
        return await this.verifyCardPayment(reference, userId);
      } else if (reference.startsWith('DVA_')) {
        return await this.verifyDynamicVirtualAccount(reference, userId);
      } else if (reference.startsWith('TRF_')) {
        return await this.verifyTransfer(reference, userId);
      } else {
        // Try to determine type from database
        return await this.getTransactionStatus(reference, userId);
      }
    } catch (error) {
      logger.error('Verify payment error:', error);
      throw new PaymentError(`Failed to verify payment: ${error.message}`, 'VERIFICATION_ERROR');
    }
  }

  async verifyCardPayment(txnRef, userId = null) {
    const response = await this.axios.get(
      `/virtual-account/wallet/deposit/verify/${txnRef}`
    );
    
    if (!response.data) {
      throw new PaymentError('Invalid response from Zainpay', 'INVALID_RESPONSE');
    }
    
    const status = response.data.status || 'pending';
    const isSuccessful = status === 'success';
    
    return {
      reference: txnRef,
      status,
      isSuccessful,
      amount: response.data.amount ? parseFloat(response.data.amount) : 0,
      depositedAmount: response.data.depositedAmount ? parseFloat(response.data.depositedAmount) : 0,
      transactionDate: response.data.transactionDate,
      cardToken: response.data.cardToken,
      rawResponse: response.data
    };
  }

  async verifyDynamicVirtualAccount(txnRef, userId = null) {
    const response = await this.axios.get(
      `/virtual-account/dynamic/deposit/status/${txnRef}`
    );
    
    if (!response.data) {
      throw new PaymentError('Invalid response from Zainpay', 'INVALID_RESPONSE');
    }
    
    const status = response.data.status || 'pending';
    const isSuccessful = status === 'success';
    
    return {
      reference: txnRef,
      status,
      isSuccessful,
      amount: response.data.amount ? CurrencyHandler.toNaira(response.data.amount) : 0,
      depositedAmount: response.data.depositedAmount ? CurrencyHandler.toNaira(response.data.depositedAmount) : 0,
      transactionDate: response.data.transactionDate,
      senderName: response.data.senderName,
      bankName: response.data.bankName,
      rawResponse: response.data
    };
  }

  async transferFunds(data) {
    const { userId, amount, accountNumber, bankCode, accountName, narration, metadata = {} } = data;
    
    const amountInKobo = CurrencyHandler.toKobo(amount);
    const txnRef = `TRF_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    const sourceAccount = await this.getSourceAccount(userId);
    
    const requestData = {
      amount: amountInKobo.toString(),
      txnRef,
      sourceAccountNumber: sourceAccount,
      beneficiaryAccountNumber: accountNumber,
      beneficiaryBankCode: bankCode,
      beneficiaryAccountName: accountName,
      narration: narration || 'Payment from Stackkin',
      zainboxCode: this.zainboxCode
    };
    
    const response = await this.axios.post('/bank/transfer/v2', requestData);
    
    if (!response.data || response.data.responseCode !== '00') {
      throw new PaymentError(
        `Failed to process transfer: ${response.data?.responseMessage || 'Unknown error'}`,
        response.data?.responseCode
      );
    }
    
    return {
      success: true,
      reference: txnRef,
      amount,
      amountInKobo,
      transactionId: response.data.transactionId,
      gatewayReference: response.data.reference,
      message: response.data.responseMessage,
      status: response.data.status || 'pending',
      rawResponse: response.data
    };
  }

  async validateWebhook(signature, payload) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Webhook signature validation error:', error);
      return false;
    }
  }

  async getTransactionStatus(reference, userId = null) {
    // Try different endpoints based on reference pattern
    try {
      if (reference.startsWith('DVA_')) {
        const response = await this.axios.get(
          `/virtual-account/dynamic/deposit/status/${reference}`
        );
        return response.data;
      } else if (reference.startsWith('CARD_') || reference.startsWith('TRF_')) {
        const response = await this.axios.get(
          `/virtual-account/wallet/deposit/verify/${reference}`
        );
        return response.data;
      } else {
        const response = await this.axios.get(
          `/virtual-account/wallet/transaction/verify/${reference}`
        );
        return response.data;
      }
    } catch (error) {
      logger.error('Get transaction status error:', error);
      throw new PaymentError(`Failed to get transaction status: ${error.message}`, 'STATUS_CHECK_ERROR');
    }
  }

  async checkAccountBalance(accountNumber) {
    const response = await this.axios.get(
      `/virtual-account/wallet/balance/${accountNumber}`
    );
    
    if (!response.data || response.data.code !== '00') {
      throw new PaymentError(
        `Failed to check balance: ${response.data?.description || 'Unknown error'}`,
        response.data?.code
      );
    }
    
    return {
      accountNumber: response.data.data.accountNumber,
      accountName: response.data.data.accountName,
      balance: CurrencyHandler.toNaira(response.data.data.balanceAmount),
      balanceInKobo: response.data.data.balanceAmount,
      transactionDate: response.data.data.transactionDate
    };
  }

  async refundPayment(data) {
    // Note: Zainpay doesn't have a direct refund API
    // We'll create a reverse transfer
    const { paymentId, amount, reason, metadata = {} } = data;
    
    // Get original payment details from database
    // This would be implemented with actual database lookup
    const originalPayment = {}; // Fetch from DB
    
    return await this.transferFunds({
      userId: originalPayment.userId,
      amount,
      accountNumber: originalPayment.senderAccountNumber,
      bankCode: originalPayment.bankCode,
      accountName: originalPayment.senderName,
      narration: `Refund: ${reason}`,
      metadata: { ...metadata, refundFor: paymentId }
    });
  }

  async getSourceAccount(userId = null) {
    const defaultAccount = process.env.ZAINPAY_SOURCE_ACCOUNT;
    
    if (defaultAccount) {
      return defaultAccount;
    }
    
    // Fallback logic
    throw new PaymentError('Source account not configured', 'CONFIGURATION_ERROR');
  }
}