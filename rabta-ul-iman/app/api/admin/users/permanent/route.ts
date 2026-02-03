import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import connectDB from '@/src/lib/db';
import User from '@/src/models/User';
import Transaction from '@/src/models/Transaction';

// Force Node.js runtime (required for MongoDB)
export const runtime = 'nodejs';

/**
 * DELETE /api/admin/users/permanent
 * Permanently delete a user and all associated transactions
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { userId } = await request.json();

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete admin users' },
        { status: 403 }
      );
    }

    // Check if user is in recycle bin
    if (!user.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'User must be in recycle bin before permanent deletion' },
        { status: 400 }
      );
    }

    // Delete all transactions associated with this user
    await Transaction.deleteMany({ 
      $or: [
        { userId: userId },
        { donorId: userId }
      ]
    });

    // Permanently delete the user
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: 'User and associated transactions permanently deleted',
    });
  } catch (error) {
    console.error('Error permanently deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to permanently delete user' },
      { status: 500 }
    );
  }
}
