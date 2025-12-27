import { ZainpayGateway } from './ZainpayGateway.js';
// import { PaystackGateway } from './PaystackGateway.js';
// import { FlutterwaveGateway } from './FlutterwaveGateway.js';

export class PaymentGatewayFactory {
  static create(gatewayName, config = {}) {
    const gatewayConfig = {
      sandbox: process.env.NODE_ENV !== 'production',
      callbackUrl: process.env.API_URL + '/webhooks',
      ...config
    };

    switch(gatewayName.toLowerCase()) {
      case 'zainpay':
        gatewayConfig.publicKey = process.env.ZAINPAY_PUBLIC_KEY;
        gatewayConfig.secretKey = process.env.ZAINPAY_SECRET_KEY;
        gatewayConfig.zainboxCode = process.env.ZAINPAY_ZAINBOX_CODE;
        gatewayConfig.webhookSecret = process.env.ZAINPAY_WEBHOOK_SECRET;
        return new ZainpayGateway(gatewayConfig);
      
      // case 'paystack':
      //   gatewayConfig.publicKey = process.env.PAYSTACK_PUBLIC_KEY;
      //   gatewayConfig.secretKey = process.env.PAYSTACK_SECRET_KEY;
      //   return new PaystackGateway(gatewayConfig);
      
      // case 'flutterwave':
      //   gatewayConfig.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
      //   gatewayConfig.secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
      //   return new FlutterwaveGateway(gatewayConfig);
      
      default:
        throw new Error(`Unsupported payment gateway: ${gatewayName}`);
    }
  }

  static getAvailableGateways() {
    const gateways = ['zainpay']; // Add others as implemented
    
    return gateways.map(gateway => ({
      name: gateway,
      displayName: gateway.charAt(0).toUpperCase() + gateway.slice(1),
      supportedMethods: gateway === 'zainpay' 
        ? ['virtual_account', 'card', 'bank_transfer']
        : [],
      supportedCurrencies: ['NGN'],
      status: 'available'
    }));
  }
}

export default PaymentGatewayFactory;