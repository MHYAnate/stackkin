import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#667eea',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Color must be a valid hex color'
    }
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  solutionsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  order: {
    type: Number,
    default: 0,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ isActive: 1, order: 1 });

// Virtual for subcategories
categorySchema.virtual('subCategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory',
  justOne: false
});

// Virtual for solutions
categorySchema.virtual('solutions', {
  ref: 'Solution',
  localField: '_id',
  foreignField: 'category',
  justOne: false
});

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }
  next();
});

// Pre-remove middleware
categorySchema.pre('remove', async function(next) {
  // Move all solutions to parent category or mark as uncategorized
  const Solution = mongoose.model('Solution');
  const Category = mongoose.model('Category');
  
  const children = await Category.find({ parentCategory: this._id });
  
  // Update children categories to have this category's parent
  if (children.length > 0) {
    await Category.updateMany(
      { parentCategory: this._id },
      { parentCategory: this.parentCategory }
    );
  }
  
  // Update solutions to parent category or default
  await Solution.updateMany(
    { category: this._id },
    { category: this.parentCategory }
  );
  
  next();
});

// Instance methods
categorySchema.methods.getHierarchy = async function() {
  const hierarchy = [];
  let current = this;
  
  while (current) {
    hierarchy.unshift({
      id: current._id,
      name: current.name,
      slug: current.slug
    });
    
    if (current.parentCategory && typeof current.parentCategory === 'object') {
      current = current.parentCategory;
    } else if (current.parentCategory) {
      const Category = mongoose.model('Category');
      current = await Category.findById(current.parentCategory);
    } else {
      current = null;
    }
  }
  
  return hierarchy;
};

const Category = mongoose.model('Category', categorySchema);

export default Category;