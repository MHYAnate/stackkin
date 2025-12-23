import Joi from 'joi';

export const createSolutionSchema = Joi.object({
  title: Joi.string().required().min(5).max(200).trim(),
  description: Joi.string().required().min(50).max(5000).trim(),
  shortDescription: Joi.string().required().max(200).trim(),
  category: Joi.string().required().hex().length(24),
  type: Joi.string().required().valid(
    'APPLICATION',
    'DEV_TOOL',
    'INTEGRATION',
    'TUTORIAL',
    'LIBRARY',
    'FRAMEWORK',
    'API',
    'PLUGIN',
    'TEMPLATE',
    'BOUNTY',
    'OTHER'
  ),
  techStack: Joi.array().items(Joi.string().trim()).min(1).max(20),
  useCases: Joi.array().items(Joi.string().trim()).min(1).max(10),
  documentationUrl: Joi.string().uri().allow(''),
  demoUrl: Joi.string().uri().allow(''),
  repositoryUrl: Joi.string().uri().allow(''),
  websiteUrl: Joi.string().uri().allow(''),
  videoUrl: Joi.string().uri().allow(''),
  images: Joi.array().items(Joi.string().uri()).max(10),
  attachments: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      url: Joi.string().required().uri(),
      type: Joi.string().required(),
      size: Joi.number().required().min(0)
    })
  ).max(5),
  contactEmail: Joi.string().required().email(),
  contactPhone: Joi.string().allow(''),
  pricingModel: Joi.string().required().valid(
    'FREE',
    'FREEMIUM',
    'PAID',
    'SUBSCRIPTION',
    'ONE_TIME',
    'CONTACT_FOR_PRICING'
  ),
  price: Joi.when('pricingModel', {
    is: Joi.valid('FREE', 'CONTACT_FOR_PRICING'),
    then: Joi.number().optional().allow(null),
    otherwise: Joi.number().required().min(0)
  }),
  currency: Joi.string().valid('NGN', 'USD', 'EUR', 'GBP').default('NGN'),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(20),
  features: Joi.array().items(Joi.string().trim().max(100)).max(20),
  requirements: Joi.array().items(Joi.string().trim().max(100)).max(10),
  visibility: Joi.string().valid('PUBLIC', 'UNLISTED', 'PRIVATE').default('PUBLIC'),
  allowComments: Joi.boolean().default(true),
  allowRatings: Joi.boolean().default(true)
});

export const updateSolutionSchema = Joi.object({
  title: Joi.string().min(5).max(200).trim(),
  description: Joi.string().min(50).max(5000).trim(),
  shortDescription: Joi.string().max(200).trim(),
  category: Joi.string().hex().length(24),
  type: Joi.string().valid(
    'APPLICATION',
    'DEV_TOOL',
    'INTEGRATION',
    'TUTORIAL',
    'LIBRARY',
    'FRAMEWORK',
    'API',
    'PLUGIN',
    'TEMPLATE',
    'BOUNTY',
    'OTHER'
  ),
  techStack: Joi.array().items(Joi.string().trim()).max(20),
  useCases: Joi.array().items(Joi.string().trim()).max(10),
  documentationUrl: Joi.string().uri().allow(''),
  demoUrl: Joi.string().uri().allow(''),
  repositoryUrl: Joi.string().uri().allow(''),
  websiteUrl: Joi.string().uri().allow(''),
  videoUrl: Joi.string().uri().allow(''),
  images: Joi.array().items(Joi.string().uri()).max(10),
  attachments: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      url: Joi.string().required().uri(),
      type: Joi.string().required(),
      size: Joi.number().required().min(0)
    })
  ).max(5),
  contactEmail: Joi.string().email(),
  contactPhone: Joi.string().allow(''),
  pricingModel: Joi.string().valid(
    'FREE',
    'FREEMIUM',
    'PAID',
    'SUBSCRIPTION',
    'ONE_TIME',
    'CONTACT_FOR_PRICING'
  ),
  price: Joi.number().min(0),
  currency: Joi.string().valid('NGN', 'USD', 'EUR', 'GBP'),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(20),
  features: Joi.array().items(Joi.string().trim().max(100)).max(20),
  requirements: Joi.array().items(Joi.string().trim().max(100)).max(10),
  visibility: Joi.string().valid('PUBLIC', 'UNLISTED', 'PRIVATE'),
  allowComments: Joi.boolean(),
  allowRatings: Joi.boolean()
}).min(1);

export const ratingSchema = Joi.object({
  solutionId: Joi.string().required().hex().length(24),
  rating: Joi.number().required().min(1).max(5).integer(),
  comment: Joi.string().required().min(10).max(1000).trim(),
  pros: Joi.array().items(Joi.string().trim().max(100)).max(10),
  cons: Joi.array().items(Joi.string().trim().max(100)).max(10)
});

export const complaintSchema = Joi.object({
  solutionId: Joi.string().required().hex().length(24),
  type: Joi.string().required().valid(
    'SPAM',
    'INAPPROPRIATE_CONTENT',
    'COPYRIGHT_VIOLATION',
    'MISLEADING_INFORMATION',
    'BROKEN_LINKS',
    'SECURITY_CONCERN',
    'OTHER'
  ),
  description: Joi.string().required().min(20).max(1000).trim(),
  evidence: Joi.array().items(Joi.string().uri()).max(5)
});

export const categorySchema = Joi.object({
  name: Joi.string().required().min(2).max(100).trim(),
  slug: Joi.string().required().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: Joi.string().max(500).trim().allow(''),
  icon: Joi.string().trim().allow(''),
  color: Joi.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).allow(''),
  parentId: Joi.string().hex().length(24).allow(null),
  order: Joi.number().default(0),
  isActive: Joi.boolean().default(true)
});

export default {
  createSolutionSchema,
  updateSolutionSchema,
  ratingSchema,
  complaintSchema,
  categorySchema
};