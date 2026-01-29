// Script to create admin user in the database
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://miansami123:sami1234@cluster0.q2uduko.mongodb.net/rabta-ul-iman?retryWrites=true&w=majority';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    whatsapp: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['donor', 'admin'],
      default: 'donor',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📋 Admin Details:');
      console.log('   Username:', existingAdmin.username);
      console.log('   Name:', existingAdmin.name);
      console.log('   Role:', existingAdmin.role);
      console.log('   Created:', existingAdmin.createdAt);
      
      // Ask if user wants to update password
      console.log('\n💡 To update admin password, delete the existing admin first.');
      return;
    }

    // Hash the password
    const plainPassword = 'admin123';
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    console.log('✅ Password hashed successfully\n');

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      name: 'Admin',
      username: 'admin',
      phone: '+923001234567',
      whatsapp: '+923001234567',
      password: hashedPassword,
      role: 'admin',
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('📋 Admin User Details:');
    console.log('========================');
    console.log('Name:', adminUser.name);
    console.log('Username:', adminUser.username);
    console.log('Password: admin123 (plain text - for login)');
    console.log('Role:', adminUser.role);
    console.log('Phone:', adminUser.phone);
    console.log('WhatsApp:', adminUser.whatsapp);
    console.log('ID:', adminUser._id.toString());
    console.log('Created:', adminUser.createdAt);
    console.log('\n🎉 You can now login at /admin/login with:');
    console.log('   Username: admin');
    console.log('   Password: admin123\n');

  } catch (error) {
    if (error.code === 11000) {
      console.error('❌ Error: Admin user already exists!');
    } else {
      console.error('❌ Error:', error.message);
      console.error('Stack:', error.stack);
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

createAdmin();
