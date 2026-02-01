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
 * POST /api/admin/change-password
 * Changes admin password
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Current password and new password are required',
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'New password must be at least 6 characters long',
      }, { status: 400 });
    }

    // Connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI);
    }

    // Find admin user
    const admin = await User.findOne({ 
      username: 'admin',
      role: 'admin'
    });

    if (!admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin user not found',
      }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: 'Current password is incorrect',
      }, { status: 401 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    admin.password = hashedPassword;
    await admin.save();

    console.log('✅ Admin password changed successfully');

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('❌ Error changing password:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to change password',
    }, { status: 500 });
  }
}
