// Script to verify or reset admin user
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://miansami123:sami1234@cluster0.q2uduko.mongodb.net/rabta-ul-iman?retryWrites=true&w=majority';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    whatsapp: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['donor', 'admin'], default: 'donor' },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function verifyAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // Find admin user
    const admin = await User.findOne({ username: 'admin' });
    
    if (!admin) {
      console.log('❌ Admin user not found!\n');
      console.log('Creating admin user...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newAdmin = await User.create({
        name: 'Admin',
        username: 'admin',
        phone: '+923001234567',
        whatsapp: '+923001234567',
        password: hashedPassword,
        role: 'admin',
      });
      
      console.log('✅ Admin user created!\n');
      console.log('📋 Admin Details:');
      console.log('   ID:', newAdmin._id.toString());
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   Role:', newAdmin.role);
    } else {
      console.log('✅ Admin user exists!\n');
      console.log('📋 Admin Details:');
      console.log('   ID:', admin._id.toString());
      console.log('   Name:', admin.name);
      console.log('   Username:', admin.username);
      console.log('   Role:', admin.role);
      console.log('   Phone:', admin.phone);
      console.log('   Created:', admin.createdAt.toLocaleString());
      console.log('   Updated:', admin.updatedAt.toLocaleString());
      
      // Test password
      console.log('\n🔐 Testing password "admin123"...');
      const isMatch = await bcrypt.compare('admin123', admin.password);
      if (isMatch) {
        console.log('✅ Password is correct!');
      } else {
        console.log('❌ Password does NOT match!');
        console.log('\n💡 Resetting password to "admin123"...');
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        admin.password = hashedPassword;
        await admin.save();
        
        console.log('✅ Password reset successfully!');
      }
    }
    
    console.log('\n🎉 Login Credentials:');
    console.log('   URL: http://localhost:3000/admin/login');
    console.log('   Username: admin');
    console.log('   Password: admin123\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

verifyAdmin();
