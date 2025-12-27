export class CurrencyHandler {
  static toKobo(amountInNaira) {
    return Math.round(parseFloat(amountInNaira) * 100);
  }
  
  static toNaira(amountInKobo) {
    return parseFloat((amountInKobo / 100).toFixed(2));
  }
  
  static formatForGateway(gateway, amount, currency) {
    if (currency === 'NGN') {
      switch(gateway) {
        case 'zainpay':
          return {
            amount: this.toKobo(amount),
            displayAmount: `${amount} NGN`
          };
        case 'paystack':
          return {
            amount: this.toKobo(amount),
            displayAmount: `${amount} NGN`
          };
        default:
          return { amount, displayAmount: `${amount} ${currency}` };
      }
    }
    return { amount, displayAmount: `${amount} ${currency}` };
  }
}

export default CurrencyHandler;