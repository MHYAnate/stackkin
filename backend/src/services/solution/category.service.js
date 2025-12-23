import Category from '../../models/Category.js';
import Solution from '../../models/Solution.js';
import { AppError, ValidationError, NotFoundError } from '../../errors/index.js';
import logger from '../../config/logger.js';
import { getRedisClient } from '../../config/redis.js';

class CategoryService {
  constructor() {
    this.redis = getRedisClient();
  }

  // Create category
  async createCategory(data) {
    try {
      // Check if category with same name or slug exists
      const existingCategory = await Category.findOne({
        $or: [
          { name: data.name },
          { slug: data.slug }
        ]
      });

      if (existingCategory) {
        throw new ValidationError('Category with this name or slug already exists');
      }

      // Create category
      const category = new Category(data);
      await category.save();

      // Clear cache
      await this.clearCategoriesCache();

      logger.info(`Category created: ${category._id} - ${category.name}`);
      return category;
    } catch (error) {
      logger.error('Create category error:', error);
      throw error;
    }
  }

  // Update category
  async updateCategory(categoryId, data) {
    try {
      const category = await Category.findById(categoryId);
      
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      // Check if new name or slug conflicts with other categories
      if (data.name || data.slug) {
        const existingCategory = await Category.findOne({
          _id: { $ne: categoryId },
          $or: [
            { name: data.name || category.name },
            { slug: data.slug || category.slug }
          ]
        });

        if (existingCategory) {
          throw new ValidationError('Category with this name or slug already exists');
        }
      }

      // Prevent circular reference
      if (data.parentCategory && data.parentCategory.toString() === categoryId) {
        throw new ValidationError('Category cannot be its own parent');
      }

      // Update category
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          category[key] = data[key];
        }
      });

      await category.save();

      // Clear cache
      await this.clearCategoriesCache();
      await this.clearCategoryCache(categoryId);

      logger.info(`Category updated: ${categoryId} - ${category.name}`);
      return category;
    } catch (error) {
      logger.error('Update category error:', error);
      throw error;
    }
  }

  // Delete category
  async deleteCategory(categoryId, moveToCategoryId = null) {
    try {
      const category = await Category.findById(categoryId);
      
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      // Check if category has solutions
      const solutionCount = await Solution.countDocuments({ category: categoryId });
      
      if (solutionCount > 0 && !moveToCategoryId) {
        throw new ValidationError(
          'Category has solutions. Please specify a category to move solutions to.'
        );
      }

      if (moveToCategoryId) {
        const targetCategory = await Category.findById(moveToCategoryId);
        if (!targetCategory) {
          throw new NotFoundError('Target category not found');
        }

        // Move solutions to target category
        await Solution.updateMany(
          { category: categoryId },
          { category: moveToCategoryId }
        );

        // Update target category solution count
        await Category.findByIdAndUpdate(moveToCategoryId, {
          $inc: { solutionsCount: solutionCount }
        });
      }

      // Delete category
      await category.remove();

      // Clear cache
      await this.clearCategoriesCache();
      await this.clearCategoryCache(categoryId);

      logger.info(`Category deleted: ${categoryId} - ${category.name}`);
      return { deleted: true, message: 'Category deleted successfully' };
    } catch (error) {
      logger.error('Delete category error:', error);
      throw error;
    }
  }

  // Get all categories
  async getCategories(parentId = null, activeOnly = true) {
    try {
      const cacheKey = `categories:${parentId || 'root'}:${activeOnly}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const query = {};
      
      if (parentId === null) {
        query.parentCategory = null;
      } else if (parentId !== undefined) {
        query.parentCategory = parentId;
      }
      
      if (activeOnly) {
        query.isActive = true;
      }

      const categories = await Category.find(query)
        .sort({ order: 1, name: 1 })
        .populate('parentCategory', 'name slug');

      await this.redis.setex(cacheKey, 3600, JSON.stringify(categories)); // 1 hour cache
      return categories;
    } catch (error) {
      logger.error('Get categories error:', error);
      throw error;
    }
  }

  // Get category by ID
  async getCategoryById(categoryId) {
    try {
      const cacheKey = `category:${categoryId}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const category = await Category.findById(categoryId)
        .populate('parentCategory', 'name slug')
        .populate('subCategories', 'name slug icon color solutionsCount');

      if (!category) {
        throw new NotFoundError('Category not found');
      }

      await this.redis.setex(cacheKey, 300, JSON.stringify(category));
      return category;
    } catch (error) {
      logger.error('Get category by ID error:', error);
      throw error;
    }
  }

  // Get category by slug
  async getCategoryBySlug(slug) {
    try {
      const cacheKey = `category:slug:${slug}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const category = await Category.findOne({ slug })
        .populate('parentCategory', 'name slug')
        .populate('subCategories', 'name slug icon color solutionsCount');

      if (!category) {
        throw new NotFoundError('Category not found');
      }

      await this.redis.setex(cacheKey, 300, JSON.stringify(category));
      return category;
    } catch (error) {
      logger.error('Get category by slug error:', error);
      throw error;
    }
  }

  // Get category hierarchy
  async getCategoryHierarchy() {
    try {
      const cacheKey = 'categories:hierarchy';
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const categories = await Category.find({ isActive: true })
        .sort({ order: 1, name: 1 })
        .lean();

      // Build hierarchy
      const categoryMap = {};
      const rootCategories = [];

      // First pass: create map
      categories.forEach(category => {
        category.subCategories = [];
        categoryMap[category._id] = category;
      });

      // Second pass: build tree
      categories.forEach(category => {
        if (category.parentCategory) {
          const parent = categoryMap[category.parentCategory];
          if (parent) {
            parent.subCategories.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });

      await this.redis.setex(cacheKey, 3600, JSON.stringify(rootCategories));
      return rootCategories;
    } catch (error) {
      logger.error('Get category hierarchy error:', error);
      throw error;
    }
  }

  // Reorder categories
  async reorderCategories(orders) {
    try {
      const updates = orders.map(order => ({
        updateOne: {
          filter: { _id: order.categoryId },
          update: { order: order.order }
        }
      }));

      await Category.bulkWrite(updates);

      // Clear cache
      await this.clearCategoriesCache();

      logger.info('Categories reordered');
      return await this.getCategories();
    } catch (error) {
      logger.error('Reorder categories error:', error);
      throw error;
    }
  }

  // Get category stats
  async getCategoryStats(categoryId) {
    try {
      const cacheKey = `category:stats:${categoryId}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const category = await Category.findById(categoryId);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      // Get stats using aggregation
      const stats = await Solution.aggregate([
        { $match: { category: category._id, status: 'PUBLISHED', visibility: 'PUBLIC' } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$views' },
            totalSaves: { $sum: '$saves' },
            totalShares: { $sum: '$shares' },
            avgRating: { $avg: '$averageRating' },
            premiumCount: { $sum: { $cond: [{ $eq: ['$isPremium', true] }, 1, 0] } },
            featuredCount: { $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] } }
          }
        }
      ]);

      const result = {
        category: {
          id: category._id,
          name: category.name,
          slug: category.slug
        },
        totalSolutions: category.solutionsCount,
        totalViews: stats[0]?.totalViews || 0,
        totalSaves: stats[0]?.totalSaves || 0,
        totalShares: stats[0]?.totalShares || 0,
        averageRating: Math.round((stats[0]?.avgRating || 0) * 10) / 10,
        premiumCount: stats[0]?.premiumCount || 0,
        featuredCount: stats[0]?.featuredCount || 0,
        updatedAt: new Date()
      };

      await this.redis.setex(cacheKey, 600, JSON.stringify(result)); // 10 minutes cache
      return result;
    } catch (error) {
      logger.error('Get category stats error:', error);
      throw error;
    }
  }

  // Search categories
  async searchCategories(query, activeOnly = true) {
    try {
      const cacheKey = `categories:search:${query}:${activeOnly}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const searchQuery = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      };

      if (activeOnly) {
        searchQuery.isActive = true;
      }

      const categories = await Category.find(searchQuery)
        .sort({ solutionsCount: -1, name: 1 })
        .limit(20);

      await this.redis.setex(cacheKey, 300, JSON.stringify(categories));
      return categories;
    } catch (error) {
      logger.error('Search categories error:', error);
      throw error;
    }
  }

  // Cache clearing methods
  async clearCategoriesCache() {
    const keys = await this.redis.keys('categories:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async clearCategoryCache(categoryId) {
    const keys = await this.redis.keys(`category:*${categoryId}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

export default new CategoryService();