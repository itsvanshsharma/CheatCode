const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URL = process.env.MONGODB_URL;

async function resetDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Drop the database
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped successfully');

    // Create new collections
    const collections = ['users', 'questions', 'codes', 'courses'];
    for (const collection of collections) {
      await mongoose.connection.createCollection(collection);
      console.log(`Collection ${collection} created successfully`);
    }

    console.log('Database reset completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase(); 