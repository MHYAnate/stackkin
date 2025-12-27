export class PaymentGatewayInterface {
  constructor(config) {
    this.config = config;
    this.name = 'abstract';
  }

  async initializePayment(paymentData) {
    throw new Error('Method not implemented');
  }

  async verifyPayment(reference, userId = null) {
    throw new Error('Method not implemented');
  }

  async refundPayment(data) {
    throw new Error('Method not implemented');
  }

  async transferFunds(data) {
    throw new Error('Method not implemented');
  }

  async validateWebhook(signature, payload) {
    throw new Error('Method not implemented');
  }

  async getTransactionStatus(reference) {
    throw new Error('Method not implemented');
  }

  async checkAccountBalance(accountNumber) {
    throw new Error('Method not implemented');
  }

  getName() {
    return this.name;
  }
}