// ... existing imports ...
import seedAdvertisementData from '../database/seeds/advertisement.seed.js';

// ... existing code ...

const seedAll = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await clearDatabase();
    
    // Seed in order
    await seedUsers();
    await seedCategories();
    await seedSubscriptions();
    await seedAdvertisementData(); // Add this line
    
    console.log('All data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedAll();