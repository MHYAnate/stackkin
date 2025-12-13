// src/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { createLogger } from '../utils/logger.util.js';

const logger = createLogger('Cloudinary');

/**
 * Cloudinary configuration
 */
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
};

/**
 * Initialize Cloudinary
 */
export const initializeCloudinary = () => {
  if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
    logger.warn('Cloudinary credentials not fully configured');
    return false;
  }

  cloudinary.config(cloudinaryConfig);
  logger.info('Cloudinary initialized successfully');
  return true;
};

/**
 * Upload folder paths
 */
export const uploadFolders = {
  profiles: 'stackkin/profiles',
  solutions: 'stackkin/solutions',
  jobs: 'stackkin/jobs',
  marketplace: 'stackkin/marketplace',
  squads: 'stackkin/squads',
  verifications: 'stackkin/verifications',
  chat: 'stackkin/chat',
  advertisements: 'stackkin/advertisements',
  general: 'stackkin/general',
};

/**
 * Allowed file types
 */
export const allowedFileTypes = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf'],
  all: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
};

/**
 * Max file size in bytes (10MB)
 */
export const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;

/**
 * File filter function for multer
 * @param {string[]} allowedTypes - Allowed MIME types
 * @returns {Function}
 */
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  };
};

/**
 * Create Cloudinary storage configuration
 * @param {string} folder - Upload folder
 * @param {Object} options - Additional options
 * @returns {CloudinaryStorage}
 */
export const createCloudinaryStorage = (folder, options = {}) => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
      transformation: options.transformation || [{ quality: 'auto' }],
      resource_type: options.resourceType || 'auto',
      public_id: (req, file) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const fileNameWithoutExt = file.originalname.split('.')[0];
        return `${fileNameWithoutExt}-${uniqueSuffix}`;
      },
      ...options.params,
    },
  });
};

/**
 * Upload configurations for different use cases
 */
export const uploadConfigs = {
  /**
   * Profile image upload
   */
  profileImage: multer({
    storage: createCloudinaryStorage(uploadFolders.profiles, {
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
      ],
    }),
    limits: { fileSize: maxFileSize },
    fileFilter: createFileFilter(allowedFileTypes.images),
  }),

  /**
   * Solution attachments upload
   */
  solutionAttachment: multer({
    storage: createCloudinaryStorage(uploadFolders.solutions),
    limits: { fileSize: maxFileSize },
    fileFilter: createFileFilter(allowedFileTypes.all),
  }),

  /**
   * Marketplace listing images
   */
  marketplaceImage: multer({
    storage: createCloudinaryStorage(uploadFolders.marketplace, {
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto' },
      ],
    }),
    limits: { fileSize: maxFileSize },
    fileFilter: createFileFilter(allowedFileTypes.images),
  }),

  /**
   * Verification documents
   */
  verificationDocument: multer({
    storage: createCloudinaryStorage(uploadFolders.verifications, {
      resourceType: 'image',
    }),
    limits: { fileSize: maxFileSize },
    fileFilter: createFileFilter(allowedFileTypes.all),
  }),

  /**
   * Squad logo upload
   */
  squadLogo: multer({
    storage: createCloudinaryStorage(uploadFolders.squads, {
      transformation: [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' },
      ],
    }),
    limits: { fileSize: maxFileSize },
    fileFilter: createFileFilter(allowedFileTypes.images),
  }),

  /**
   * Chat attachments
   */
  chatAttachment: multer({
    storage: createCloudinaryStorage(uploadFolders.chat),
    limits: { fileSize: maxFileSize },
    fileFilter: createFileFilter(allowedFileTypes.all),
  }),

  /**
   * Advertisement images
   */
  advertisementImage: multer({
    storage: createCloudinaryStorage(uploadFolders.advertisements, {
      transformation: [
        { width: 1200, height: 628, crop: 'fill' },
        { quality: 'auto' },
      ],
    }),
    limits: { fileSize: maxFileSize },
    fileFilter: createFileFilter(allowedFileTypes.images),
  }),

  /**
   * General file upload
   */
  generalUpload: multer({
    storage: createCloudinaryStorage(uploadFolders.general),
    limits: { fileSize: maxFileSize },
    fileFilter: createFileFilter(allowedFileTypes.all),
  }),
};

/**
 * Upload file to Cloudinary directly
 * @param {string} filePath - Local file path or URL
 * @param {Object} options - Upload options
 * @returns {Promise<Object>}
 */
export const uploadFile = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || uploadFolders.general,
      resource_type: options.resourceType || 'auto',
      transformation: options.transformation,
      ...options,
    });

    return {
      success: true,
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Upload file from buffer
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>}
 */
export const uploadFromBuffer = async (buffer, options = {}) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || uploadFolders.general,
          resource_type: options.resourceType || 'auto',
          transformation: options.transformation,
          ...options,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              success: true,
              publicId: result.public_id,
              url: result.secure_url,
              format: result.format,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
            });
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    logger.error('Cloudinary buffer upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Resource type (image, video, raw)
 * @returns {Promise<Object>}
 */
export const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return {
      success: result.result === 'ok',
      result: result.result,
    };
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Delete multiple files from Cloudinary
 * @param {string[]} publicIds - Array of public IDs
 * @param {string} resourceType - Resource type
 * @returns {Promise<Object>}
 */
export const deleteFiles = async (publicIds, resourceType = 'image') => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
    });

    return {
      success: true,
      deleted: result.deleted,
    };
  } catch (error) {
    logger.error('Cloudinary bulk delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate transformation URL
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} transformations - Transformation options
 * @returns {string}
 */
export const getTransformedUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations,
  });
};

/**
 * Generate thumbnail URL
 * @param {string} publicId - Cloudinary public ID
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 * @returns {string}
 */
export const getThumbnailUrl = (publicId, width = 150, height = 150) => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { width, height, crop: 'fill', gravity: 'auto' },
      { quality: 'auto' },
    ],
  });
};

/**
 * Cloudinary health check
 * @returns {Promise<Object>}
 */
export const checkCloudinaryHealth = async () => {
  try {
    const result = await cloudinary.api.ping();
    return {
      status: 'connected',
      healthy: result.status === 'ok',
    };
  } catch (error) {
    return {
      status: 'error',
      healthy: false,
      message: error.message,
    };
  }
};

/**
 * Export Cloudinary instance
 */
export { cloudinary };

/**
 * Cloudinary configuration export
 */
export default {
  initialize: initializeCloudinary,
  cloudinary,
  uploadFolders,
  allowedFileTypes,
  maxFileSize,
  uploadConfigs,
  uploadFile,
  uploadFromBuffer,
  deleteFile,
  deleteFiles,
  getTransformedUrl,
  getThumbnailUrl,
  healthCheck: checkCloudinaryHealth,
  createCloudinaryStorage,
};