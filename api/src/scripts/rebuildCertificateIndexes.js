import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Certificate from '../models/certificateModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from api/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const rebuildIndexes = async () => {
  try {
    // Verify MONGODB_URI is loaded
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('ERROR: MONGODB_URI not found in environment variables');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
      console.log('\nPlease check your .env file in api/ directory');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    console.log('URI:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    console.log('Dropping old certificate indexes...');
    try {
      await Certificate.collection.dropIndexes();
      console.log('✓ Old indexes dropped');
    } catch (err) {
      console.log('⚠ No indexes to drop or error:', err.message);
    }

    console.log('\nRebuilding certificate indexes...');
    await Certificate.syncIndexes();
    console.log('✓ Indexes rebuilt successfully!');

    console.log('\n=== Current Indexes ===');
    const indexes = await Certificate.collection.getIndexes();
    Object.keys(indexes).forEach(indexName => {
      console.log(`\n${indexName}:`, JSON.stringify(indexes[indexName], null, 2));
    });

    console.log('\n✓ All done! You can now restart the API.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error rebuilding indexes:', error);
    process.exit(1);
  }
};

rebuildIndexes();
