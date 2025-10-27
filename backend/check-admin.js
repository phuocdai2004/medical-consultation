const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const checkAdmin = async () => {
  try {
    const admin = await User.findOne({ email: 'admin@medical.com' });
    
    if (!admin) {
      console.log('❌ Admin not found');
      process.exit(1);
    }
    
    console.log('✅ Admin found:');
    console.log('📧 Email:', admin.email);
    console.log('👤 Role:', admin.role);
    console.log('✔️  isActive:', admin.isActive);
    console.log('✔️  isVerified:', admin.isVerified);
    console.log('🔑 Has password:', !!admin.password);
    
    // Test password
    const isMatch = await admin.comparePassword('Admin123456');
    console.log('🔐 Password matches:', isMatch);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkAdmin();
