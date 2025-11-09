const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

console.log('📝 Testing MongoDB Connection...');
console.log('URI:', uri.replace(/:[^:]*@/, ':****@')); // Hide password

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 5000,
})
.then(() => {
    console.log('✅ Successfully connected to MongoDB!');
    process.exit(0);
})
.catch(err => {
    console.log('❌ Connection failed!');
    console.log('Error:', err.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check MongoDB Atlas IP whitelist');
    console.log('2. Verify username/password are correct');
    console.log('3. Check if MongoDB cluster is running');
    console.log('4. Disable VPN if using one');
    process.exit(1);
});
