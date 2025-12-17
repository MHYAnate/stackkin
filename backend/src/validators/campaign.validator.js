import validator from 'validator';

export const validateCampaignInput = (data) => {
  const errors = {};

  // Required fields
  if (!data.name || !validator.isLength(data.name, { min: 2, max: 200 })) {
    errors.name = 'Name must be between 2 and 200 characters';
  }

  if (!data.advertiserId || !validator.isMongoId(data.advertiserId.toString())) {
    errors.advertiserId = 'Valid advertiser ID is required';
  }

  if (!data.budgetType || !['DAILY', 'TOTAL', 'LIFETIME'].includes(data.budgetType)) {
    errors.budgetType = 'Valid budget type is required';
  }

  if (!data.totalBudget || !validator.isInt(data.totalBudget.toString(), { min: 1 })) {
    errors.totalBudget = 'Total budget must be a positive number';
  }

  if (!data.goalType || !['IMPRESSIONS', 'CLICKS', 'CONVERSIONS', 'LEADS', 'SALES', 'ENGAGEMENT', 'AWARENESS'].includes(data.goalType)) {
    errors.goalType = 'Valid goal type is required';
  }

  if (!data.goalValue || !validator.isInt(data.goalValue.toString(), { min: 1 })) {
    errors.goalValue = 'Goal value must be a positive number';
  }

  if (!data.startDate || !validator.isISO8601(data.startDate.toString())) {
    errors.startDate = 'Valid start date is required';
  }

  if (!data.endDate || !validator.isISO8601(data.endDate.toString())) {
    errors.endDate = 'Valid end date is required';
  }

  // Date validation
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

  // Daily budget validation
  if (data.dailyBudget) {
    if (!validator.isInt(data.dailyBudget.toString(), { min: 1 })) {
      errors.dailyBudget = 'Daily budget must be a positive number';
    }
    
    if (data.totalBudget && data.dailyBudget > data.totalBudget) {
      errors.dailyBudget = 'Daily budget cannot exceed total budget';
    }
  }

  // Targeting validation
  if (data.targeting) {
    const targetingErrors = validateCampaignTargetingInput(data.targeting);
    if (Object.keys(targetingErrors).length > 0) {
      errors.targeting = targetingErrors;
    }
  }

  // Description validation
  if (data.description && !validator.isLength(data.description, { min: 0, max: 1000 })) {
    errors.description = 'Description cannot exceed 1000 characters';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateCampaignUpdateInput = (data) => {
  const errors = {};

  if (data.name && !validator.isLength(data.name, { min: 2, max: 200 })) {
    errors.name = 'Name must be between 2 and 200 characters';
  }

  if (data.budgetType && !['DAILY', 'TOTAL', 'LIFETIME'].includes(data.budgetType)) {
    errors.budgetType = 'Valid budget type is required';
  }

  if (data.totalBudget !== undefined && !validator.isInt(data.totalBudget.toString(), { min: 0 })) {
    errors.totalBudget = 'Total budget must be a non-negative number';
  }

  if (data.dailyBudget !== undefined && !validator.isInt(data.dailyBudget.toString(), { min: 0 })) {
    errors.dailyBudget = 'Daily budget must be a non-negative number';
  }

  if (data.goalType && !['IMPRESSIONS', 'CLICKS', 'CONVERSIONS', 'LEADS', 'SALES', 'ENGAGEMENT', 'AWARENESS'].includes(data.goalType)) {
    errors.goalType = 'Valid goal type is required';
  }

  if (data.goalValue !== undefined && !validator.isInt(data.goalValue.toString(), { min: 0 })) {
    errors.goalValue = 'Goal value must be a non-negative number';
  }

  if (data.startDate && !validator.isISO8601(data.startDate.toString())) {
    errors.startDate = 'Valid start date is required';
  }

  if (data.endDate && !validator.isISO8601(data.endDate.toString())) {
    errors.endDate = 'Valid end date is required';
  }

  // Date validation
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    
    if (end <= start) {
      errors.endDate = 'End date must be after start date';
    }
  }

  // Targeting validation
  if (data.targeting) {
    const targetingErrors = validateCampaignTargetingInput(data.targeting);
    if (Object.keys(targetingErrors).length > 0) {
      errors.targeting = targetingErrors;
    }
  }

  // Description validation
  if (data.description && !validator.isLength(data.description, { min: 0, max: 1000 })) {
    errors.description = 'Description cannot exceed 1000 characters';
  }

  if (data.notes && !validator.isLength(data.notes, { min: 0, max: 5000 })) {
    errors.notes = 'Notes cannot exceed 5000 characters';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateCampaignTargetingInput = (targeting) => {
  const errors = {};

  if (targeting.countries) {
    if (!Array.isArray(targeting.countries)) {
      errors.countries = 'Countries must be an array';
    } else {
      targeting.countries.forEach((country, index) => {
        if (!validator.isLength(country, { min: 2, max: 100 })) {
          errors[`countries.${index}`] = 'Country name must be between 2 and 100 characters';
        }
      });
    }
  }

  if (targeting.languages) {
    if (!Array.isArray(targeting.languages)) {
      errors.languages = 'Languages must be an array';
    } else {
      targeting.languages.forEach((language, index) => {
        if (!validator.isLength(language, { min: 2, max: 10 })) {
          errors[`languages.${index}`] = 'Language code must be between 2 and 10 characters';
        }
      });
    }
  }

  if (targeting.subscriptionTiers) {
    if (!Array.isArray(targeting.subscriptionTiers)) {
      errors.subscriptionTiers = 'Subscription tiers must be an array';
    } else {
      const validTiers = ['FREE', 'BASE', 'MID', 'TOP'];
      targeting.subscriptionTiers.forEach((tier, index) => {
        if (!validTiers.includes(tier)) {
          errors[`subscriptionTiers.${index}`] = `Invalid subscription tier: ${tier}`;
        }
      });
    }
  }

  if (targeting.userRoles) {
    if (!Array.isArray(targeting.userRoles)) {
      errors.userRoles = 'User roles must be an array';
    } else {
      const validRoles = ['USER', 'PREMIUM_USER', 'VERIFIED_USER', 'ADMIN', 'SUPER_ADMIN', 'MODERATOR'];
      targeting.userRoles.forEach((role, index) => {
        if (!validRoles.includes(role)) {
          errors[`userRoles.${index}`] = `Invalid user role: ${role}`;
        }
      });
    }
  }

  if (targeting.minRating !== undefined) {
    if (!validator.isFloat(targeting.minRating.toString(), { min: 0, max: 5 })) {
      errors.minRating = 'Minimum rating must be between 0 and 5';
    }
  }

  if (targeting.isVerified !== undefined && typeof targeting.isVerified !== 'boolean') {
    errors.isVerified = 'isVerified must be a boolean';
  }

  return errors;
};