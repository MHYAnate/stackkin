import { paymentResolvers } from '../resolvers/payment.resolver.js';
import { chatResolvers } from '../resolvers/chat.resolver.js';
import { notificationResolvers } from '../resolvers/notification.resolver.js';
import { activityResolvers } from '../resolvers/activity.resolver.js';

export const subscriptionResolvers = {
  Subscription: {
    ...paymentResolvers.Subscription,
    ...chatResolvers.Subscription,
    ...notificationResolvers.Subscription,
    ...activityResolvers.Subscription
  }
};

export default subscriptionResolvers;