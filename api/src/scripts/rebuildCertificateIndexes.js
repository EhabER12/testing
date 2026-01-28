import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Certificate from '../models/certificateModel.js';

// Load environment variables
dotenv.config();

const rebuildIndexes = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('Dropping old certificate indexes...');
    try {
      await Certificate.collection.dropIndexes();
      console.log('Old indexes dropped');
    } catch (err) {
      console.log('No indexes to drop or error dropping:', err.message);
    }

    console.log('Rebuilding certificate indexes...');
    await Certificate.syncIndexes();
    console.log('Indexes rebuilt successfully!');

    console.log('\nCurrent indexes:');
    const indexes = await Certificate.collection.getIndexes();
    console.log(JSON.stringify(indexes, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error rebuilding indexes:', error);
    process.exit(1);
  }
};

rebuildIndexes();
