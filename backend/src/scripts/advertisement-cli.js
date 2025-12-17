#!/usr/bin/env node

import { program } from 'commander';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import advertisementService from '../services/advertisement/advertisement.service.js';
import campaignService from '../services/advertisement/campaign.service.js';
import advertisementJob from '../jobs/advertisement.job.js';

dotenv.config();

program
  .name('advertisement-cli')
  .description('CLI tool for advertisement management')
  .version('1.0.0');

program
  .command('stats')
  .description('Get advertisement statistics')
  .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
  .option('--end-date <date>', 'End date (YYYY-MM-DD)')
  .action(async (options) => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      
      const stats = await advertisementService.getAdStats({
        startDate: options.startDate,
        endDate: options.endDate
      });
      
      console.log('Advertisement Statistics:');
      console.log('=======================');
      console.log(`Total Ads: ${stats.totalAds}`);
      console.log(`Active Ads: ${stats.activeAds}`);
      console.log(`Pending Ads: ${stats.pendingAds}`);
      console.log(`Total Campaigns: ${stats.totalCampaigns}`);
      console.log(`Active Campaigns: ${stats.activeCampaigns}`);
      console.log(`Total Spent: ${stats.totalSpent} kobo (${(stats.totalSpent / 100).toFixed(2)} NGN)`);
      console.log(`Fill Rate: ${stats.fillRate.toFixed(2)}%`);
      console.log(`Average CTR: ${stats.averageCtr.toFixed(2)}%`);
      console.log(`Average CPM: ${stats.averageCpm.toFixed(2)} kobo`);
      
      console.log('\nBy Ad Type:');
      stats.byAdType.forEach(typeStat => {
        console.log(`  ${typeStat.type}: ${typeStat.count} ads, ${typeStat.impressions} impressions`);
      });
      
      console.log('\nBy Campaign Status:');
      stats.byCampaignStatus.forEach(statusStat => {
        console.log(`  ${statusStat.status}: ${statusStat.count} campaigns, ${statusStat.spent} kobo spent`);
      });
      
      await mongoose.disconnect();
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('recalculate-stats')
  .description('Recalculate all advertisement statistics')
  .action(async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      
      console.log('Starting recalculation of all advertisement stats...');
      await advertisementJob.recalculateAllStats();
      
      console.log('Recalculation complete!');
      await mongoose.disconnect();
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('cleanup-impressions <days>')
  .description('Clean up old impressions older than specified days')
  .action(async (days) => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      
      console.log(`Cleaning up impressions older than ${days} days...`);
      await advertisementJob.cleanupOldImpressions(parseInt(days));
      
      console.log('Cleanup complete!');
      await mongoose.disconnect();
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('check-budgets')
  .description('Check and send budget alerts for all campaigns')
  .action(async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      
      console.log('Checking campaign budgets...');
      await advertisementJob.checkBudgetAlerts();
      
      console.log('Budget check complete!');
      await mongoose.disconnect();
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('generate-report <type>')
  .description('Generate report (daily, weekly, monthly)')
  .action(async (type) => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      
      switch (type) {
        case 'daily':
          console.log('Generating daily report...');
          await advertisementJob.generateDailyReports();
          break;
        case 'weekly':
          console.log('Generating weekly report...');
          await advertisementJob.generateWeeklyAnalytics();
          break;
        default:
          console.error('Invalid report type. Use: daily, weekly');
          process.exit(1);
      }
      
      console.log('Report generated!');
      await mongoose.disconnect();
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);