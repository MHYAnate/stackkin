import mongoose from 'mongoose';
import Advertisement from '../../models/Advertisement.js';
import Campaign from '../../models/Campaign.js';
import Advertiser from '../../models/Advertiser.js';
import AdSlot from '../../models/AdSlot.js';
import User from '../../models/User.js';
import { faker } from '@faker-js/faker';

const seedAdvertisementData = async () => {
  console.log('Seeding advertisement data...');

  // Create test advertiser users
  const advertiserUsers = [];
  for (let i = 0; i < 5; i++) {
    const user = new User({
      username: `advertiser${i + 1}`,
      email: `advertiser${i + 1}@example.com`,
      password: 'password123',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      roles: ['USER', 'ADVERTISER'],
      isVerified: true
    });
    await user.save();
    advertiserUsers.push(user);
  }

  // Create advertisers
  const advertisers = [];
  for (let i = 0; i < 5; i++) {
    const advertiser = new Advertiser({
      userId: advertiserUsers[i]._id,
      companyName: faker.company.name(),
      companyLogo: faker.image.url(),
      website: faker.internet.url(),
      contactEmail: advertiserUsers[i].email,
      contactPhone: faker.phone.number(),
      verified: true,
      verificationStatus: 'VERIFIED',
      walletBalance: faker.number.int({ min: 1000000, max: 5000000 }), // 10,000 - 50,000 NGN in kobo
      billingSettings: {
        paymentMethod: 'CARD',
        billingAddress: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          country: faker.location.country(),
          postalCode: faker.location.zipCode()
        },
        invoiceFrequency: 'MONTHLY',
        autoRecharge: true,
        rechargeThreshold: 500000 // 5,000 NGN in kobo
      }
    });
    await advertiser.save();
    advertisers.push(advertiser);
  }

  // Create ad slots
  const adSlots = [
    {
      name: 'Homepage Top Banner',
      description: 'Top banner on homepage',
      type: 'BANNER',
      format: 'IMAGE',
      position: 'TOP',
      width: 728,
      height: 90,
      basePrice: 5000, // 50 NGN in kobo
      pricingModel: 'AUCTION',
      allowedTargeting: ['DEMOGRAPHIC', 'GEOGRAPHIC', 'BEHAVIORAL'],
      active: true,
      createdBy: advertiserUsers[0]._id
    },
    {
      name: 'Sidebar Ad',
      description: 'Right sidebar advertisement',
      type: 'BANNER',
      format: 'IMAGE',
      position: 'SIDEBAR_RIGHT',
      width: 300,
      height: 250,
      basePrice: 3000, // 30 NGN in kobo
      pricingModel: 'FIXED',
      allowedTargeting: ['DEMOGRAPHIC', 'CONTEXTUAL'],
      active: true,
      createdBy: advertiserUsers[0]._id
    },
    {
      name: 'Solution Page Interstitial',
      description: 'Full-screen interstitial on solution pages',
      type: 'INTERSTITIAL',
      format: 'IMAGE',
      position: 'POPUP',
      width: 600,
      height: 400,
      basePrice: 10000, // 100 NGN in kobo
      pricingModel: 'HYBRID',
      allowedTargeting: ['BEHAVIORAL', 'CONTEXTUAL', 'RETARGETING'],
      active: true,
      createdBy: advertiserUsers[0]._id
    }
  ];

  const savedAdSlots = [];
  for (const slotData of adSlots) {
    const slot = new AdSlot(slotData);
    await slot.save();
    savedAdSlots.push(slot);
  }

  // Create campaigns
  const campaigns = [];
  const now = new Date();
  
  for (let i = 0; i < 10; i++) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - faker.number.int({ min: 0, max: 30 }));
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + faker.number.int({ min: 7, max: 90 }));
    
    const campaign = new Campaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      advertiserId: advertiserUsers[i % 5]._id,
      status: faker.helpers.arrayElement(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']),
      budgetType: faker.helpers.arrayElement(['DAILY', 'TOTAL']),
      totalBudget: faker.number.int({ min: 100000, max: 1000000 }), // 1,000 - 10,000 NGN in kobo
      dailyBudget: faker.number.int({ min: 10000, max: 100000 }),
      goalType: faker.helpers.arrayElement(['IMPRESSIONS', 'CLICKS', 'CONVERSIONS']),
      goalValue: faker.number.int({ min: 1000, max: 100000 }),
      targeting: {
        countries: ['NG', 'US', 'GB', 'KE', 'GH'],
        subscriptionTiers: ['FREE', 'BASE', 'MID', 'TOP'],
        categories: ['web-development', 'mobile-apps', 'ai-ml'],
        minRating: faker.number.float({ min: 3.5, max: 5, precision: 0.1 }),
        isVerified: faker.datatype.boolean()
      },
      startDate,
      endDate,
      tags: [faker.word.adjective(), faker.word.noun()],
      spentAmount: faker.number.int({ min: 0, max: 500000 })
    });
    
    await campaign.save();
    campaigns.push(campaign);
  }

  // Create advertisements
  const adTypes = ['BANNER', 'INTERSTITIAL', 'NATIVE', 'VIDEO'];
  const adFormats = ['IMAGE', 'VIDEO', 'HTML', 'TEXT'];
  const biddingTypes = ['CPC', 'CPM', 'CPA'];
  
  for (let i = 0; i < 50; i++) {
    const campaign = faker.helpers.arrayElement(campaigns);
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);
    
    const ad = new Advertisement({
      campaignId: campaign._id,
      name: faker.commerce.productName(),
      type: faker.helpers.arrayElement(adTypes),
      format: faker.helpers.arrayElement(adFormats),
      status: faker.helpers.arrayElement(['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'PAUSED']),
      title: faker.company.catchPhrase(),
      description: faker.lorem.sentence(),
      imageUrl: faker.image.url(),
      callToAction: faker.helpers.arrayElement(['Learn More', 'Sign Up', 'Get Started', 'Buy Now']),
      destinationUrl: faker.internet.url(),
      targeting: {
        demographics: {
          ageRanges: faker.helpers.arrayElements(['AGE_18_24', 'AGE_25_34', 'AGE_35_44']),
          gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
          languages: ['en']
        },
        geography: {
          countries: ['NG', 'US', 'GB']
        },
        device: {
          deviceTypes: faker.helpers.arrayElements(['DESKTOP', 'MOBILE', 'TABLET']),
          browsers: ['Chrome', 'Firefox', 'Safari']
        }
      },
      startDate,
      endDate,
      biddingType: faker.helpers.arrayElement(biddingTypes),
      bidAmount: faker.number.int({ min: 10, max: 1000 }),
      dailyBudget: faker.number.int({ min: 1000, max: 50000 }),
      totalBudget: faker.number.int({ min: 5000, max: 200000 }),
      spentAmount: faker.number.int({ min: 0, max: 50000 }),
      approved: faker.datatype.boolean(),
      tags: [faker.word.adjective(), faker.word.noun()],
      createdBy: campaign.advertiserId,
      performance: {
        impressions: faker.number.int({ min: 0, max: 10000 }),
        clicks: faker.number.int({ min: 0, max: 500 }),
        conversions: faker.number.int({ min: 0, max: 50 }),
        views: faker.number.int({ min: 0, max: 8000 }),
        engagements: faker.number.int({ min: 0, max: 200 }),
        qualityScore: faker.number.float({ min: 1, max: 10, precision: 0.1 }),
        relevanceScore: faker.number.float({ min: 1, max: 10, precision: 0.1 })
      }
    });
    
    await ad.save();
  }

  console.log('Advertisement data seeded successfully!');
  console.log(`Created: ${advertiserUsers.length} advertiser users`);
  console.log(`Created: ${advertisers.length} advertisers`);
  console.log(`Created: ${savedAdSlots.length} ad slots`);
  console.log(`Created: ${campaigns.length} campaigns`);
  console.log(`Created: 50 advertisements`);
};

export default seedAdvertisementData;