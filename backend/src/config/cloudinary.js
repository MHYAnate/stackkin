import { v2 as cloudinary } from 'cloudinary';
import stream from 'stream';
import logger from './logger.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Upload options
const uploadOptions = {
  folder: 'stackkin',
  resource_type: 'auto',
  timeout: 60000, // 60 seconds timeout
  chunk_size: 6000000 // 6MB chunks for large files
};

// Upload stream to Cloudinary
export const uploadStream = (fileStream, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { ...uploadOptions, ...options },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          logger.info('Cloudinary upload successful:', result.public_id);
          resolve(result);
        }
      }
    );

    fileStream.pipe(uploadStream);
  });
};

// Upload file by path
export const uploadFile = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      ...uploadOptions,
      ...options
    });
    
    logger.info('File uploaded to Cloudinary:', result.public_id);
    return result;
  } catch (error) {
    logger.error('Cloudinary file upload error:', error);
    throw error;
  }
};

// Upload base64 image
export const uploadBase64 = async (base64Data, options = {}) => {
  try {
    // Remove data URL prefix if present
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    const result = await cloudinary.uploader.upload(`data:image/png;base64,${base64String}`, {
      ...uploadOptions,
      ...options
    });
    
    logger.info('Base64 image uploaded to Cloudinary:', result.public_id);
    return result;
  } catch (error) {
    logger.error('Cloudinary base64 upload error:', error);
    throw error;
  }
};

// Delete file from Cloudinary
export const deleteFile = async (publicId, options = {}) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, options);
    
    if (result.result === 'ok') {
      logger.info('File deleted from Cloudinary:', publicId);
      return true;
    } else {
      logger.warn('Cloudinary delete result:', result);
      return false;
    }
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw error;
  }
};

// Generate image URL with transformations
export const generateImageUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations
  });
};

// Generate responsive image URLs
export const generateResponsiveUrls = (publicId, sizes = [100, 300, 600, 1200]) => {
  return sizes.map(size => ({
    width: size,
    url: cloudinary.url(publicId, {
      width: size,
      crop: 'scale',
      quality: 'auto',
      fetch_format: 'auto'
    })
  }));
};

// Check Cloudinary configuration
export const checkCloudinaryConfig = () => {
  const config = cloudinary.config();
  
  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    logger.error('Cloudinary configuration incomplete');
    return false;
  }
  
  return true;
};

// Get Cloudinary usage statistics
export const getUsageStats = async () => {
  try {
    const result = await cloudinary.api.usage();
    return result;
  } catch (error) {
    logger.error('Failed to get Cloudinary usage stats:', error);
    return null;
  }
};

export default cloudinary;