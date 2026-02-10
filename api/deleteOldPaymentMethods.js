import mongoose from 'mongoose';
import PaymentMethod from './src/models/paymentMethodSchema.js';

// Update this with your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genoun';

async function deleteOldPaymentMethods() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all payment methods with null or empty credentials
        const oldMethods = await PaymentMethod.find({
            $or: [
                { credentials: null },
                { credentials: {} }
            ]
        });

        console.log(`\n📋 Found ${oldMethods.length} payment method(s) with null/empty credentials:`);
        oldMethods.forEach((method) => {
            console.log(`   - ${method.provider} (ID: ${method._id})`);
        });

        if (oldMethods.length === 0) {
            console.log('\n✅ No old payment methods found. Database is clean!');
            await mongoose.connection.close();
            return;
        }

        // Delete them
        console.log('\n🗑️  Deleting old payment methods...');
        const result = await PaymentMethod.deleteMany({
            $or: [
                { credentials: null },
                { credentials: {} }
            ]
        });

        console.log(`✅ Successfully deleted ${result.deletedCount} payment method(s)\n`);

        console.log('📝 Next steps:');
        console.log('   1. Restart your API server (pm2 restart all)');
        console.log('   2. Go to /dashboard/payment-methods');
        console.log('   3. Add PayPal and Kashier configurations again');
        console.log('   4. Save - credentials should now be stored correctly! 🎉\n');

        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

deleteOldPaymentMethods();
