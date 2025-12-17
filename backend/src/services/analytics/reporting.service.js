import Report from '../../models/Report.js';
import ReportRun from '../../models/ReportRun.js';
import { pubsub, EVENTS } from '../../socket/events/events.js';
import analyticsService from './analytics.service.js';
import metricsService from './metrics.service.js';
import { Redis } from 'ioredis';
import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';
import ExcelJS from 'exceljs';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const redis = new Redis(process.env.REDIS_URL);

class ReportingService {
  constructor() {
    this.reportQueue = 'reports';
    this.setupQueueProcessor();
  }

  // ==========================================
  // REPORT MANAGEMENT
  // ==========================================

  async getUserReports(userId) {
    try {
      return await Report.find({
        $or: [
          { createdBy: userId },
          { 'accessControl.userId': userId },
          { isPublic: true }
        ]
      })
        .populate('createdBy', 'name email avatar')
        .sort({ updatedAt: -1 });
    } catch (error) {
      console.error('Error getting user reports:', error);
      throw new Error(`Failed to get user reports: ${error.message}`);
    }
  }

  async getReportById(reportId) {
    try {
      const report = await Report.findById(reportId)
        .populate('createdBy', 'name email avatar')
        .populate('accessControl.userId', 'name email avatar');

      if (!report) {
        throw new Error('Report not found');
      }

      return report;
    } catch (error) {
      console.error('Error getting report:', error);
      throw new Error(`Failed to get report: ${error.message}`);
    }
  }

  async checkReportAccess(reportId, userId, role) {
    try {
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        return true;
      }

      const report = await Report.findById(reportId);
      if (!report) return false;

      // Check if user is creator
      if (report.createdBy.toString() === userId) {
        return true;
      }

      // Check if report is public
      if (report.isPublic) {
        return true;
      }

      // Check access control list
      const hasAccess = report.accessControl?.some(
        access => access.userId.toString() === userId
      );
      
      return !!hasAccess;
    } catch (error) {
      console.error('Error checking report access:', error);
      return false;
    }
  }

  async createReport(data) {
    try {
      const report = new Report({
        ...data,
        status: 'ACTIVE'
      });

      await report.save();
      await report.populate('createdBy', 'name email avatar');

      return report;
    } catch (error) {
      console.error('Error creating report:', error);
      throw new Error(`Failed to create report: ${error.message}`);
    }
  }

  async updateReport(reportId, input) {
    try {
      const report = await Report.findByIdAndUpdate(
        reportId,
        { ...input, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
        .populate('createdBy', 'name email avatar')
        .populate('accessControl.userId', 'name email avatar');

      if (!report) {
        throw new Error('Report not found');
      }

      return report;
    } catch (error) {
      console.error('Error updating report:', error);
      throw new Error(`Failed to update report: ${error.message}`);
    }
  }

  async deleteReport(reportId) {
    try {
      // Delete all report runs first
      await ReportRun.deleteMany({ report: reportId });
      
      // Delete report
      const result = await Report.findByIdAndDelete(reportId);
      
      return result !== null;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw new Error(`Failed to delete report: ${error.message}`);
    }
  }

  // ==========================================
  // REPORT EXECUTION
  // ==========================================

  async runReport(reportId, userId) {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Create report run
      const reportRun = new ReportRun({
        report: reportId,
        status: 'PENDING',
        triggeredBy: userId,
        triggeredByType: 'USER',
        startedAt: new Date(),
        metrics: {
          totalRecords: 0,
          processingTime: 0,
          memoryUsage: 0,
          queryDuration: 0
        }
      });

      await reportRun.save();

      // Queue the report execution
      await this.queueReportExecution(reportRun._id);

      // Update report last run
      report.lastRun = new Date();
      await report.save();

      return reportRun;
    } catch (error) {
      console.error('Error running report:', error);
      throw new Error(`Failed to run report: ${error.message}`);
    }
  }

  async queueReportExecution(reportRunId) {
    try {
      await redis.rpush(this.reportQueue, reportRunId.toString());
      console.log(`Report run ${reportRunId} queued for execution`);
    } catch (error) {
      console.error('Error queuing report execution:', error);
    }
  }

  async setupQueueProcessor() {
    // Process report queue
    setInterval(async () => {
      try {
        const reportRunId = await redis.lpop(this.reportQueue);
        if (reportRunId) {
          await this.executeReportRun(reportRunId);
        }
      } catch (error) {
        console.error('Error processing report queue:', error);
      }
    }, 1000); // Check every second
  }

  async executeReportRun(reportRunId) {
    let reportRun;
    
    try {
      reportRun = await ReportRun.findById(reportRunId)
        .populate('report');
      
      if (!reportRun) {
        console.error(`Report run ${reportRunId} not found`);
        return;
      }

      // Update status to running
      reportRun.status = 'RUNNING';
      await reportRun.save();

      const startTime = Date.now();
      
      // Execute the report query
      const reportData = await analyticsService.getAnalytics(
        reportRun.report.query,
        { id: reportRun.triggeredBy }
      );

      const queryDuration = Date.now() - startTime;

      // Generate report file based on format
      let generatedFile = null;
      let fileUrl = null;
      let fileSize = 0;

      if (reportRun.report.format !== 'DASHBOARD') {
        const { filename, filePath, size } = await this.generateReportFile(
          reportData,
          reportRun.report.format,
          reportRun.report.name
        );
        
        generatedFile = filename;
        fileSize = size;
        
        // In production, upload to cloud storage and get URL
        // For now, use local file path
        fileUrl = `/reports/${filename}`;
      }

      // Send report to recipients if delivery method is not DASHBOARD
      let sentTo = [];
      if (reportRun.report.deliveryMethod !== 'DASHBOARD' && reportRun.report.recipients?.length > 0) {
        sentTo = await this.deliverReport(
          reportRun.report,
          reportData,
          generatedFile,
          fileUrl
        );
      }

      // Update report run with results
      const completedAt = new Date();
      const duration = completedAt - reportRun.startedAt;

      reportRun.status = 'COMPLETED';
      reportRun.completedAt = completedAt;
      reportRun.duration = duration;
      reportRun.result = reportData;
      reportRun.generatedFile = generatedFile;
      reportRun.fileUrl = fileUrl;
      reportRun.fileSize = fileSize;
      reportRun.sentTo = sentTo;
      reportRun.metrics = {
        totalRecords: this.countRecords(reportData),
        processingTime: duration,
        memoryUsage: process.memoryUsage().heapUsed,
        queryDuration
      };

      await reportRun.save();

      // Publish completion event
      pubsub.publish(EVENTS.REPORT_COMPLETED, {
        reportCompleted: reportRun.toObject()
      });

      console.log(`Report run ${reportRunId} completed in ${duration}ms`);

    } catch (error) {
      console.error(`Error executing report run ${reportRunId}:`, error);
      
      if (reportRun) {
        reportRun.status = 'FAILED';
        reportRun.error = error.message;
        reportRun.completedAt = new Date();
        reportRun.duration = Date.now() - reportRun.startedAt.getTime();
        await reportRun.save();
      }
    }
  }

  async getReportResult(reportId, runId) {
    try {
      let reportRun;
      
      if (runId) {
        reportRun = await ReportRun.findOne({
          _id: runId,
          report: reportId
        });
      } else {
        // Get latest successful run
        reportRun = await ReportRun.findOne({
          report: reportId,
          status: 'COMPLETED'
        }).sort({ completedAt: -1 });
      }

      if (!reportRun) {
        throw new Error('Report result not found');
      }

      return reportRun.result;
    } catch (error) {
      console.error('Error getting report result:', error);
      throw new Error(`Failed to get report result: ${error.message}`);
    }
  }

  async getLastReportResult(reportId) {
    try {
      const reportRun = await ReportRun.findOne({
        report: reportId,
        status: 'COMPLETED'
      })
        .sort({ completedAt: -1 })
        .limit(1);

      return reportRun?.result || null;
    } catch (error) {
      console.error('Error getting last report result:', error);
      return null;
    }
  }

  async getReportHistory(reportId) {
    try {
      return await ReportRun.find({ report: reportId })
        .sort({ startedAt: -1 })
        .limit(50);
    } catch (error) {
      console.error('Error getting report history:', error);
      throw new Error(`Failed to get report history: ${error.message}`);
    }
  }

  // ==========================================
  // SCHEDULING
  // ==========================================

  async scheduleReport(reportId, schedule) {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      report.schedule = {
        ...schedule,
        nextRun: this.calculateNextRun(schedule)
      };

      await report.save();

      // Schedule the report execution
      await this.scheduleReportExecution(reportId, schedule);

      return report;
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw new Error(`Failed to schedule report: ${error.message}`);
    }
  }

  async unscheduleReport(reportId) {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      report.schedule = undefined;
      await report.save();

      // Remove from schedule
      await this.unscheduleReportExecution(reportId);

      return report;
    } catch (error) {
      console.error('Error unscheduling report:', error);
      throw new Error(`Failed to unschedule report: ${error.message}`);
    }
  }

  calculateNextRun(schedule) {
    if (!schedule) return null;

    const now = new Date();
    const nextRun = new Date(now);

    switch (schedule.frequency) {
      case 'HOURLY':
        nextRun.setHours(nextRun.getHours() + 1);
        nextRun.setMinutes(schedule.minute || 0, 0, 0);
        break;
      case 'DAILY':
        nextRun.setDate(nextRun.getDate() + 1);
        nextRun.setHours(schedule.hour || 0, schedule.minute || 0, 0, 0);
        break;
      case 'WEEKLY':
        nextRun.setDate(nextRun.getDate() + 7);
        nextRun.setHours(schedule.hour || 0, schedule.minute || 0, 0, 0);
        // Adjust to specific day of week if provided
        if (schedule.dayOfWeek) {
          const targetDay = this.getDayOfWeekNumber(schedule.dayOfWeek);
          const currentDay = nextRun.getDay();
          const daysToAdd = (targetDay - currentDay + 7) % 7;
          nextRun.setDate(nextRun.getDate() + daysToAdd);
        }
        break;
      case 'MONTHLY':
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(schedule.dayOfMonth || 1);
        nextRun.setHours(schedule.hour || 0, schedule.minute || 0, 0, 0);
        break;
      case 'QUARTERLY':
        nextRun.setMonth(nextRun.getMonth() + 3);
        nextRun.setDate(schedule.dayOfMonth || 1);
        nextRun.setHours(schedule.hour || 0, schedule.minute || 0, 0, 0);
        break;
      case 'YEARLY':
        nextRun.setFullYear(nextRun.getFullYear() + 1);
        nextRun.setMonth(0);
        nextRun.setDate(schedule.dayOfMonth || 1);
        nextRun.setHours(schedule.hour || 0, schedule.minute || 0, 0, 0);
        break;
    }

    // Apply timezone offset if provided
    if (schedule.timezone && schedule.timezone !== 'UTC') {
      // In production, use a proper timezone library like moment-timezone
      // For now, handle UTC offsets
      const offsetMatch = schedule.timezone.match(/UTC([+-]\d+)/);
      if (offsetMatch) {
        const offsetHours = parseInt(offsetMatch[1]);
        nextRun.setHours(nextRun.getHours() + offsetHours);
      }
    }

    return nextRun;
  }

  getDayOfWeekNumber(day) {
    const days = {
      'SUNDAY': 0,
      'MONDAY': 1,
      'TUESDAY': 2,
      'WEDNESDAY': 3,
      'THURSDAY': 4,
      'FRIDAY': 5,
      'SATURDAY': 6
    };
    return days[day.toUpperCase()] || 0;
  }

  async scheduleReportExecution(reportId, schedule) {
    try {
      // In production, use a proper job scheduler like Bull or Agenda
      // For now, use Redis with setTimeout
      
      const nextRun = this.calculateNextRun(schedule);
      if (!nextRun) return;

      const delay = nextRun.getTime() - Date.now();
      
      if (delay > 0) {
        setTimeout(async () => {
          try {
            // Create report run for scheduled execution
            const reportRun = new ReportRun({
              report: reportId,
              status: 'PENDING',
              triggeredByType: 'SCHEDULE',
              startedAt: new Date()
            });

            await reportRun.save();
            await this.queueReportExecution(reportRun._id);

            // Update report schedule for next run
            const report = await Report.findById(reportId);
            if (report?.schedule) {
              report.schedule.lastRun = new Date();
              report.schedule.nextRun = this.calculateNextRun(report.schedule);
              await report.save();

              // Schedule next execution
              await this.scheduleReportExecution(reportId, report.schedule);
            }
          } catch (error) {
            console.error('Error executing scheduled report:', error);
          }
        }, delay);
      }
    } catch (error) {
      console.error('Error scheduling report execution:', error);
    }
  }

  async unscheduleReportExecution(reportId) {
    // In production, cancel the scheduled job
    // For now, just log
    console.log(`Unscheduled report ${reportId}`);
  }

  // ==========================================
  // REPORT GENERATION
  // ==========================================

  async generateReportFile(data, format, reportName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${reportName.replace(/\s+/g, '-')}-${timestamp}.${format.toLowerCase()}`;
    const filePath = path.join(__dirname, '../../../tmp/reports', filename);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let size = 0;

    switch (format) {
      case 'CSV':
        size = await this.generateCSV(data, filePath);
        break;
      case 'JSON':
        size = await this.generateJSON(data, filePath);
        break;
      case 'EXCEL':
        size = await this.generateExcel(data, filePath, reportName);
        break;
      case 'PDF':
        size = await this.generatePDF(data, filePath, reportName);
        break;
      case 'HTML':
        size = await this.generateHTML(data, filePath, reportName);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return { filename, filePath, size };
  }

  async generateCSV(data, filePath) {
    try {
      // Create CSV writer
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'metric', title: 'Metric' },
          { id: 'value', title: 'Value' },
          { id: 'change', title: 'Change' },
          { id: 'changePercentage', title: 'Change %' }
        ]
      });

      // Prepare data
      const records = data.metrics.map(metric => ({
        metric: metric.name,
        value: metric.value,
        change: metric.change || 0,
        changePercentage: metric.changePercentage || 0
      }));

      // Add summary metrics
      if (data.summary) {
        Object.entries(data.summary).forEach(([key, value]) => {
          records.push({
            metric: key.replace(/([A-Z])/g, ' $1').trim(),
            value,
            change: 0,
            changePercentage: 0
          });
        });
      }

      await csvWriter.writeRecords(records);

      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      console.error('Error generating CSV:', error);
      throw error;
    }
  }

  async generateJSON(data, filePath) {
    try {
      const jsonData = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, jsonData);
      return Buffer.byteLength(jsonData, 'utf8');
    } catch (error) {
      console.error('Error generating JSON:', error);
      throw error;
    }
  }

  async generateExcel(data, filePath, reportName) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Stackkin Analytics';
      workbook.created = new Date();
      
      // Summary sheet
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.addRow([reportName]);
      summarySheet.addRow(['Generated', new Date().toISOString()]);
      summarySheet.addRow(['Period', data.period]);
      summarySheet.addRow(['Start Date', data.startDate]);
      summarySheet.addRow(['End Date', data.endDate]);
      summarySheet.addRow([]);

      // Summary metrics
      if (data.summary) {
        summarySheet.addRow(['Summary Metrics']);
        Object.entries(data.summary).forEach(([key, value]) => {
          summarySheet.addRow([
            key.replace(/([A-Z])/g, ' $1').trim(),
            value
          ]);
        });
      }

      // Metrics sheet
      const metricsSheet = workbook.addWorksheet('Metrics');
      metricsSheet.addRow(['Metric', 'Value', 'Previous Value', 'Change', 'Change %', 'Trend']);
      
      data.metrics.forEach(metric => {
        metricsSheet.addRow([
          metric.name,
          metric.value,
          metric.previousValue || 0,
          metric.change || 0,
          metric.changePercentage || 0,
          metric.trend
        ]);
      });

      // Trends sheet
      if (data.trends) {
        const trendsSheet = workbook.addWorksheet('Trends');
        trendsSheet.addRow(['Trend Analysis']);
        trendsSheet.addRow(['Overall Trend', data.trends.overallTrend]);
        trendsSheet.addRow(['Confidence', data.trends.confidence]);
        
        if (data.trends.insights?.length > 0) {
          trendsSheet.addRow([]);
          trendsSheet.addRow(['Insights']);
          data.trends.insights.forEach(insight => {
            trendsSheet.addRow([insight.title, insight.description]);
          });
        }
      }

      // Recommendations sheet
      if (data.recommendations?.length > 0) {
        const recSheet = workbook.addWorksheet('Recommendations');
        recSheet.addRow(['Priority', 'Title', 'Description', 'Actions']);
        
        data.recommendations.forEach(rec => {
          recSheet.addRow([
            rec.priority,
            rec.title,
            rec.description,
            rec.actions.join('; ')
          ]);
        });
      }

      // Save workbook
      await workbook.xlsx.writeFile(filePath);
      
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      console.error('Error generating Excel:', error);
      throw error;
    }
  }

  async generatePDF(data, filePath, reportName) {
    try {
      // In production, use puppeteer to generate PDF from HTML
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Generate HTML content
      const htmlContent = this.generatePDFHTML(data, reportName);
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      });
      
      await browser.close();
      
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  generatePDFHTML(data, reportName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${reportName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #333; margin: 0; }
          .header .subtitle { color: #666; font-size: 14px; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #444; border-bottom: 2px solid #4CAF50; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .metric-value { font-weight: bold; }
          .positive { color: green; }
          .negative { color: red; }
          .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportName}</h1>
          <div class="subtitle">
            Generated: ${new Date().toLocaleString()} | 
            Period: ${data.period} | 
            Date Range: ${data.startDate.toLocaleDateString()} - ${data.endDate.toLocaleDateString()}
          </div>
        </div>
        
        ${this.generateSummaryHTML(data)}
        ${this.generateMetricsHTML(data)}
        ${this.generateTrendsHTML(data)}
        ${this.generateRecommendationsHTML(data)}
        
        <div class="footer">
          <p>Generated by Stackkin Analytics</p>
          <p>Report ID: ${Date.now()}</p>
        </div>
      </body>
      </html>
    `;
  }

  generateSummaryHTML(data) {
    if (!data.summary) return '';
    
    return `
      <div class="section">
        <h2>Summary</h2>
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          ${Object.entries(data.summary).map(([key, value]) => `
            <tr>
              <td>${key.replace(/([A-Z])/g, ' $1').trim()}</td>
              <td class="metric-value">${typeof value === 'number' ? value.toLocaleString() : value}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  generateMetricsHTML(data) {
    if (!data.metrics?.length) return '';
    
    return `
      <div class="section">
        <h2>Key Metrics</h2>
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Previous</th>
            <th>Change</th>
            <th>Change %</th>
            <th>Trend</th>
          </tr>
          ${data.metrics.map(metric => `
            <tr>
              <td>${metric.name}</td>
              <td class="metric-value">${metric.value.toLocaleString()}</td>
              <td>${metric.previousValue?.toLocaleString() || '-'}</td>
              <td class="${metric.change > 0 ? 'positive' : metric.change < 0 ? 'negative' : ''}">
                ${metric.change?.toLocaleString() || '-'}
              </td>
              <td class="${metric.changePercentage > 0 ? 'positive' : metric.changePercentage < 0 ? 'negative' : ''}">
                ${metric.changePercentage ? metric.changePercentage.toFixed(2) + '%' : '-'}
              </td>
              <td>${metric.trend}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  generateTrendsHTML(data) {
    if (!data.trends) return '';
    
    return `
      <div class="section">
        <h2>Trend Analysis</h2>
        <p><strong>Overall Trend:</strong> ${data.trends.overallTrend}</p>
        <p><strong>Confidence:</strong> ${(data.trends.confidence * 100).toFixed(1)}%</p>
        
        ${data.trends.insights?.length ? `
          <h3>Insights</h3>
          <ul>
            ${data.trends.insights.map(insight => `
              <li><strong>${insight.title}:</strong> ${insight.description}</li>
            `).join('')}
          </ul>
        ` : ''}
      </div>
    `;
  }

  generateRecommendationsHTML(data) {
    if (!data.recommendations?.length) return '';
    
    return `
      <div class="section">
        <h2>Recommendations</h2>
        <table>
          <tr>
            <th>Priority</th>
            <th>Title</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
          ${data.recommendations.map(rec => `
            <tr>
              <td>${rec.priority}</td>
              <td>${rec.title}</td>
              <td>${rec.description}</td>
              <td>${rec.actions.join('<br>')}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  async generateHTML(data, filePath, reportName) {
    try {
      const htmlContent = this.generatePDFHTML(data, reportName);
      fs.writeFileSync(filePath, htmlContent);
      return Buffer.byteLength(htmlContent, 'utf8');
    } catch (error) {
      console.error('Error generating HTML:', error);
      throw error;
    }
  }

  // ==========================================
  // REPORT DELIVERY
  // ==========================================

  async deliverReport(report, data, generatedFile, fileUrl) {
    const sentTo = [];
    
    switch (report.deliveryMethod) {
      case 'EMAIL':
        sentTo.push(...await this.deliverViaEmail(report, data, generatedFile));
        break;
      case 'SLACK':
        sentTo.push(...await this.deliverViaSlack(report, data));
        break;
      case 'TEAMS':
        sentTo.push(...await this.deliverViaTeams(report, data));
        break;
      case 'WEBHOOK':
        sentTo.push(...await this.deliverViaWebhook(report, data));
        break;
      case 'API':
        // API delivery means the report is available via API
        // Nothing to deliver immediately
        break;
    }
    
    return sentTo;
  }

  async deliverViaEmail(report, data, generatedFile) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const sentTo = [];
      
      for (const recipient of report.recipients) {
        const mailOptions = {
          from: `"Stackkin Analytics" <${process.env.EMAIL_FROM}>`,
          to: recipient,
          subject: `Analytics Report: ${report.name}`,
          html: this.generateEmailHTML(report, data),
          attachments: generatedFile ? [{
            filename: generatedFile,
            path: path.join(__dirname, '../../../tmp/reports', generatedFile)
          }] : []
        };

        await transporter.sendMail(mailOptions);
        sentTo.push(recipient);
        
        console.log(`Report sent to ${recipient}`);
      }
      
      return sentTo;
    } catch (error) {
      console.error('Error delivering via email:', error);
      return [];
    }
  }

  generateEmailHTML(report, data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .metric { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; }
          .metric-value { font-size: 24px; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${report.name}</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="content">
            <h2>Report Summary</h2>
            <p><strong>Period:</strong> ${data.period}</p>
            <p><strong>Date Range:</strong> ${data.startDate.toLocaleDateString()} - ${data.endDate.toLocaleDateString()}</p>
            
            <h3>Key Metrics</h3>
            ${data.metrics.slice(0, 5).map(metric => `
              <div class="metric">
                <h4>${metric.name}</h4>
                <div class="metric-value">${metric.value.toLocaleString()}</div>
                ${metric.changePercentage ? `
                  <p>Change: ${metric.changePercentage > 0 ? '+' : ''}${metric.changePercentage.toFixed(2)}%</p>
                ` : ''}
              </div>
            `).join('')}
            
            ${data.metrics.length > 5 ? `
              <p>... and ${data.metrics.length - 5} more metrics</p>
            ` : ''}
            
            <p>
              <a href="${process.env.APP_URL}/reports/${report._id}" 
                 style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Full Report
              </a>
            </p>
          </div>
          
          <div class="footer">
            <p>This report was generated by Stackkin Analytics.</p>
            <p>To unsubscribe from these reports, update your notification settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async deliverViaSlack(report, data) {
    try {
      // In production, use Slack Web API
      console.log(`Would deliver to Slack: ${report.recipients.join(', ')}`);
      return report.recipients;
    } catch (error) {
      console.error('Error delivering via Slack:', error);
      return [];
    }
  }

  async deliverViaTeams(report, data) {
    try {
      // In production, use Microsoft Teams Webhook API
      console.log(`Would deliver to Teams: ${report.recipients.join(', ')}`);
      return report.recipients;
    } catch (error) {
      console.error('Error delivering via Teams:', error);
      return [];
    }
  }

  async deliverViaWebhook(report, data) {
    try {
      // In production, make HTTP POST requests to webhook URLs
      console.log(`Would deliver via Webhook: ${report.recipients.join(', ')}`);
      return report.recipients;
    } catch (error) {
      console.error('Error delivering via Webhook:', error);
      return [];
    }
  }

  // ==========================================
  // ADMIN FUNCTIONS
  // ==========================================

  async getAllReports(filters = {}, pagination = {}) {
    try {
      const { userId, status, page = 1, limit = 50 } = filters;
      
      const query = {};
      if (userId) query.createdBy = userId;
      if (status) query.status = status;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: 'createdBy',
        lean: true
      };
      
      const result = await Report.paginate(query, options);
      
      return {
        edges: result.docs.map(doc => ({
          node: doc,
          cursor: doc._id.toString()
        })),
        pageInfo: {
          hasNextPage: result.hasNextPage,
          hasPreviousPage: result.hasPrevPage,
          startCursor: result.docs[0]?._id.toString(),
          endCursor: result.docs[result.docs.length - 1]?._id.toString(),
        },
        totalCount: result.totalDocs
      };
    } catch (error) {
      console.error('Error getting all reports:', error);
      throw new Error(`Failed to get all reports: ${error.message}`);
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  countRecords(data) {
    let count = 0;
    
    if (data.metrics) count += data.metrics.length;
    if (data.summary) count += Object.keys(data.summary).length;
    if (data.recommendations) count += data.recommendations.length;
    if (data.trends?.insights) count += data.trends.insights.length;
    
    return count;
  }
}

export default new ReportingService();