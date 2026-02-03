import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import connectDB from '@/src/lib/db';
import User from '@/src/models/User';

// Force Node.js runtime (required for MongoDB)
export const runtime = 'nodejs';

/**
 * POST /api/admin/users/restore
 * Restore a soft-deleted user (clear deletedAt field)
 */
export async function POST(request: NextRequest) {
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

    // Check if user exists and is deleted
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'User is not in recycle bin' },
        { status: 400 }
      );
    }

    // Restore the user by clearing deletedAt
    await User.findByIdAndUpdate(userId, {
      deletedAt: null
    });

    return NextResponse.json({
      success: true,
      message: 'User restored successfully',
    });
  } catch (error) {
    console.error('Error restoring user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore user' },
      { status: 500 }
    );
  }
}
