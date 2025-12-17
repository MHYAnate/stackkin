import validator from 'validator';
import { ValidationError } from '../errors/index.js';

export const validateAdvertisementInput = (data) => {
  const errors = {};

  // Required fields
  if (!data.name || !validator.isLength(data.name, { min: 2, max: 200 })) {
    errors.name = 'Name must be between 2 and 200 characters';
  }

  if (!data.campaignId || !validator.isMongoId(data.campaignId.toString())) {
    errors.campaignId = 'Valid campaign ID is required';
  }

  if (!data.type || !['BANNER', 'INTERSTITIAL', 'NATIVE', 'VIDEO', 'CAROUSEL', 'POPUP', 'SIDEBAR', 'IN_FEED'].includes(data.type)) {
    errors.type = 'Valid ad type is required';
  }

  if (!data.format || !['IMAGE', 'VIDEO', 'HTML', 'TEXT', 'RICH_MEDIA'].includes(data.format)) {
    errors.format = 'Valid ad format is required';
  }

  // Creative content
  if (!data.title || !validator.isLength(data.title, { min: 2, max: 100 })) {
    errors.title = 'Title must be between 2 and 100 characters';
  }

  if (!data.description || !validator.isLength(data.description, { min: 10, max: 500 })) {
    errors.description = 'Description must be between 10 and 500 characters';
  }

  if (!data.callToAction || !validator.isLength(data.callToAction, { min: 2, max: 50 })) {
    errors.callToAction = 'Call to action must be between 2 and 50 characters';
  }

  if (!data.destinationUrl || !validator.isURL(data.destinationUrl)) {
    errors.destinationUrl = 'Valid destination URL is required';
  }

  // Bidding & Budget
  if (!data.biddingType || !['CPC', 'CPM', 'CPA', 'CPE', 'FIXED'].includes(data.biddingType)) {
    errors.biddingType = 'Valid bidding type is required';
  }

  if (!data.bidAmount || !validator.isInt(data.bidAmount.toString(), { min: 1 })) {
    errors.bidAmount = 'Valid bid amount is required (minimum 1)';
  }

  if (data.dailyBudget && !validator.isInt(data.dailyBudget.toString(), { min: 1 })) {
    errors.dailyBudget = 'Daily budget must be a positive number';
  }

  if (data.totalBudget && !validator.isInt(data.totalBudget.toString(), { min: 1 })) {
    errors.totalBudget = 'Total budget must be a positive number';
  }

  // Dates
  if (!data.startDate || !validator.isISO8601(data.startDate.toString())) {
    errors.startDate = 'Valid start date is required';
  }

  if (!data.endDate || !validator.isISO8601(data.endDate.toString())) {
    errors.endDate = 'Valid end date is required';
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    
    if (end <= start) {
      errors.endDate = 'End date must be after start date';
    }
    
    if (start < new Date()) {
      errors.startDate = 'Start date cannot be in the past';
    }
  }

  // Targeting validation
  if (data.targeting) {
    const targetingErrors = validateTargetingInput(data.targeting);
    if (Object.keys(targetingErrors).length > 0) {
      errors.targeting = targetingErrors;
    }
  }

  // Schedule validation
  if (data.schedule) {
    const scheduleErrors = validateScheduleInput(data.schedule);
    if (Object.keys(scheduleErrors).length > 0) {
      errors.schedule = scheduleErrors;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateAdUpdateInput = (data) => {
  const errors = {};

  if (data.name && !validator.isLength(data.name, { min: 2, max: 200 })) {
    errors.name = 'Name must be between 2 and 200 characters';
  }

  if (data.title && !validator.isLength(data.title, { min: 2, max: 100 })) {
    errors.title = 'Title must be between 2 and 100 characters';
  }

  if (data.description && !validator.isLength(data.description, { min: 10, max: 500 })) {
    errors.description = 'Description must be between 10 and 500 characters';
  }

  if (data.callToAction && !validator.isLength(data.callToAction, { min: 2, max: 50 })) {
    errors.callToAction = 'Call to action must be between 2 and 50 characters';
  }

  if (data.destinationUrl && !validator.isURL(data.destinationUrl)) {
    errors.destinationUrl = 'Valid destination URL is required';
  }

  if (data.biddingType && !['CPC', 'CPM', 'CPA', 'CPE', 'FIXED'].includes(data.biddingType)) {
    errors.biddingType = 'Valid bidding type is required';
  }

  if (data.bidAmount && !validator.isInt(data.bidAmount.toString(), { min: 1 })) {
    errors.bidAmount = 'Valid bid amount is required (minimum 1)';
  }

  if (data.dailyBudget !== undefined && !validator.isInt(data.dailyBudget.toString(), { min: 0 })) {
    errors.dailyBudget = 'Daily budget must be a non-negative number';
  }

  if (data.totalBudget !== undefined && !validator.isInt(data.totalBudget.toString(), { min: 0 })) {
    errors.totalBudget = 'Total budget must be a non-negative number';
  }

  if (data.imageUrl && !validator.isURL(data.imageUrl)) {
    errors.imageUrl = 'Valid image URL is required';
  }

  if (data.videoUrl && !validator.isURL(data.videoUrl)) {
    errors.videoUrl = 'Valid video URL is required';
  }

  // Targeting validation
  if (data.targeting) {
    const targetingErrors = validateTargetingInput(data.targeting);
    if (Object.keys(targetingErrors).length > 0) {
      errors.targeting = targetingErrors;
    }
  }

  // Schedule validation
  if (data.schedule) {
    const scheduleErrors = validateScheduleInput(data.schedule);
    if (Object.keys(scheduleErrors).length > 0) {
      errors.schedule = scheduleErrors;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateTargetingInput = (targeting) => {
  const errors = {};

  if (targeting.demographics) {
    if (targeting.demographics.ageRanges) {
      const validAgeRanges = ['UNDER_18', 'AGE_18_24', 'AGE_25_34', 'AGE_35_44', 'AGE_45_54', 'AGE_55_PLUS'];
      targeting.demographics.ageRanges.forEach((range, index) => {
        if (!validAgeRanges.includes(range)) {
          errors[`demographics.ageRanges.${index}`] = `Invalid age range: ${range}`;
        }
      });
    }

    if (targeting.demographics.gender && !['MALE', 'FEMALE', 'OTHER', 'ALL'].includes(targeting.demographics.gender)) {
      errors['demographics.gender'] = 'Invalid gender value';
    }

    if (targeting.demographics.educationLevels) {
      const validEducationLevels = ['HIGH_SCHOOL', 'SOME_COLLEGE', 'BACHELORS', 'MASTERS', 'DOCTORATE'];
      targeting.demographics.educationLevels.forEach((level, index) => {
        if (!validEducationLevels.includes(level)) {
          errors[`demographics.educationLevels.${index}`] = `Invalid education level: ${level}`;
        }
      });
    }

    if (targeting.demographics.incomeRanges) {
      const validIncomeRanges = ['UNDER_20K', 'AGE_20K_40K', 'AGE_40K_60K', 'AGE_60K_80K', 'AGE_80K_100K', 'OVER_100K'];
      targeting.demographics.incomeRanges.forEach((range, index) => {
        if (!validIncomeRanges.includes(range)) {
          errors[`demographics.incomeRanges.${index}`] = `Invalid income range: ${range}`;
        }
      });
    }
  }

  if (targeting.geography) {
    if (targeting.geography.countries) {
      targeting.geography.countries.forEach((country, index) => {
        if (!validator.isLength(country, { min: 2, max: 100 })) {
          errors[`geography.countries.${index}`] = 'Country name must be between 2 and 100 characters';
        }
      });
    }

    if (targeting.geography.radius) {
      if (!validator.isFloat(targeting.geography.radius.latitude.toString(), { min: -90, max: 90 })) {
        errors['geography.radius.latitude'] = 'Latitude must be between -90 and 90';
      }
      
      if (!validator.isFloat(targeting.geography.radius.longitude.toString(), { min: -180, max: 180 })) {
        errors['geography.radius.longitude'] = 'Longitude must be between -180 and 180';
      }
      
      if (!validator.isInt(targeting.geography.radius.radiusKm.toString(), { min: 1, max: 1000 })) {
        errors['geography.radius.radiusKm'] = 'Radius must be between 1 and 1000 km';
      }
    }
  }

  if (targeting.device) {
    if (targeting.device.deviceTypes) {
      const validDeviceTypes = ['DESKTOP', 'MOBILE', 'TABLET', 'ALL'];
      targeting.device.deviceTypes.forEach((type, index) => {
        if (!validDeviceTypes.includes(type)) {
          errors[`device.deviceTypes.${index}`] = `Invalid device type: ${type}`;
        }
      });
    }

    if (targeting.device.screenSizes) {
      const validScreenSizes = ['MOBILE_SMALL', 'MOBILE_LARGE', 'TABLET', 'DESKTOP_SMALL', 'DESKTOP_LARGE'];
      targeting.device.screenSizes.forEach((size, index) => {
        if (!validScreenSizes.includes(size)) {
          errors[`device.screenSizes.${index}`] = `Invalid screen size: ${size}`;
        }
      });
    }

    if (targeting.device.connectionTypes) {
      const validConnectionTypes = ['WIFI', 'MOBILE_4G', 'MOBILE_3G', 'MOBILE_2G', 'ETHERNET'];
      targeting.device.connectionTypes.forEach((type, index) => {
        if (!validConnectionTypes.includes(type)) {
          errors[`device.connectionTypes.${index}`] = `Invalid connection type: ${type}`;
        }
      });
    }
  }

  return errors;
};

export const validateScheduleInput = (schedule) => {
  const errors = {};

  if (!schedule.startTime || !validator.matches(schedule.startTime, /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
    errors.startTime = 'Valid start time in HH:MM format is required';
  }

  if (!schedule.endTime || !validator.matches(schedule.endTime, /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
    errors.endTime = 'Valid end time in HH:MM format is required';
  }

  if (schedule.startTime && schedule.endTime) {
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    
    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;
    
    if (endTotal <= startTotal) {
      errors.endTime = 'End time must be after start time';
    }
  }

  if (!schedule.days || !Array.isArray(schedule.days) || schedule.days.length === 0) {
    errors.days = 'At least one day must be selected';
  } else {
    const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    schedule.days.forEach((day, index) => {
      if (!validDays.includes(day)) {
        errors[`days.${index}`] = `Invalid day: ${day}`;
      }
    });
  }

  if (!schedule.timezone || !validator.isLength(schedule.timezone, { min: 1, max: 50 })) {
    errors.timezone = 'Valid timezone is required';
  }

  return errors;
};

export const validateCampaignTargetingInput = (targeting) => {
  const errors = {};

  if (targeting.countries) {
    targeting.countries.forEach((country, index) => {
      if (!validator.isLength(country, { min: 2, max: 100 })) {
        errors[`countries.${index}`] = 'Country name must be between 2 and 100 characters';
      }
    });
  }

  if (targeting.languages) {
    targeting.languages.forEach((language, index) => {
      if (!validator.isLength(language, { min: 2, max: 10 })) {
        errors[`languages.${index}`] = 'Language code must be between 2 and 10 characters';
      }
    });
  }

  if (targeting.subscriptionTiers) {
    const validTiers = ['FREE', 'BASE', 'MID', 'TOP'];
    targeting.subscriptionTiers.forEach((tier, index) => {
      if (!validTiers.includes(tier)) {
        errors[`subscriptionTiers.${index}`] = `Invalid subscription tier: ${tier}`;
      }
    });
  }

  if (targeting.minRating !== undefined) {
    if (!validator.isFloat(targeting.minRating.toString(), { min: 0, max: 5 })) {
      errors.minRating = 'Minimum rating must be between 0 and 5';
    }
  }

  return errors;
};