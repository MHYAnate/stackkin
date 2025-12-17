import * as authServices from './auth/index.js';
import * as userServices from './user/index.js';
import * as solutionServices from './solution/index.js';
import * as jobServices from './job/index.js';
import * as marketplaceServices from './marketplace/index.js';
import * as chatServices from './chat/index.js';
import * as squadServices from './squad/index.js';
import * as subscriptionServices from './subscription/index.js';
import * as paymentServices from './payment/index.js';
import * as notificationServices from './notification/index.js';
import * as advertisementServices from './advertisement/index.js';
import * as analyticsServices from './analytics/index.js';
import * as gamificationServices from './gamification/index.js';
import * as adminServices from './admin/index.js';
import * as fileServices from './file/index.js';
import * as cacheServices from './cache/index.js';
import * as searchServices from './search/index.js';
import { 
  analyticsService, 
  metricsService, 
  reportingService 
} from './analytics/index.js';

export {
  authServices,
  userServices,
  solutionServices,
  jobServices,
  marketplaceServices,
  chatServices,
  squadServices,
  subscriptionServices,
  paymentServices,
  notificationServices,
  advertisementServices,
  analyticsServices,
  gamificationServices,
  adminServices,
  fileServices,
  cacheServices,
  searchServices,
  analyticsService,
  metricsService,
  reportingService
};

export default {
  auth: authServices,
  user: userServices,
  solution: solutionServices,
  job: jobServices,
  marketplace: marketplaceServices,
  chat: chatServices,
  squad: squadServices,
  subscription: subscriptionServices,
  payment: paymentServices,
  notification: notificationServices,
  advertisement: advertisementServices,
  analytics: analyticsServices,
  gamification: gamificationServices,
  admin: adminServices,
  file: fileServices,
  cache: cacheServices,
  search: searchServices
};