import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || '';

// Inline User schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  username: String,
  password: String,
  role: String,
  phoneNumber: String,
  address: String,
  avatar: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

/**
 * POST /api/admin/create-admin
 * Creates a new admin user
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    // Only admins can create other admins
    if (session.user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Only admins can create other admins',
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, username, password } = body;

    // Validation
    if (!name || !username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Name, username, and password are required',
      }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({
        success: false,
        error: 'Username must be at least 3 characters long',
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 6 characters long',
      }, { status: 400 });
    }

    // Connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI);
    }

    // Check if username already exists
    const existingUser = await User.findOne({ 
      username: username.toLowerCase() 
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Username already exists',
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin user
    const newAdmin = new User({
      name,
      username: username.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      email: `${username.toLowerCase()}@admin.rabta-ul-iman.com`,
    });

    await newAdmin.save();

    console.log('✅ New admin created successfully:', username);

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: newAdmin._id.toString(),
        name: newAdmin.name,
        username: newAdmin.username,
        role: newAdmin.role,
      },
    });
  } catch (error: any) {
    console.error('❌ Error creating admin:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create admin',
    }, { status: 500 });
  }
}
