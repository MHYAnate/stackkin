export { default as paymentService } from './payment.service.js';
export { default as zainpayService } from './zainpay.service.js';
export { default as webhookService } from './webhook.service.js';
export { default as virtualAccountService } from './virtualAccount.service.js';
export { default as transferService } from './transfer.service.js';

// Optional: Export a unified payment service that uses all sub-services
export class PaymentServiceFacade {
  constructor() {
    this.services = {
      main: paymentService,
      zainpay: zainpayService,
      webhook: webhookService,
      virtualAccount: virtualAccountService,
      transfer: transferService
    };
  }

  async processPayment(paymentData) {
    return this.services.main.createPayment(paymentData);
  }

  async createVirtualAccount(userId, accountData) {
    return this.services.virtualAccount.createVirtualAccount(userId, accountData);
  }

  async initiateTransfer(transferData) {
    return this.services.transfer.initiateTransfer(transferData);
  }

  async verifyPayment(txnRef) {
    return this.services.main.verifyPayment(txnRef);
  }

  async handleWebhook(provider, event, payload, signature) {
    return this.services.webhook.handleWebhook(provider, event, payload, signature);
  }
}

export const paymentFacade = new PaymentServiceFacade();