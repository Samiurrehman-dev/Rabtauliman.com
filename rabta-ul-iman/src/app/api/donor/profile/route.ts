import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import connectDB from '@/src/lib/db';
import User from '@/src/models/User';

// Force Node.js runtime (required for bcrypt and MongoDB)
export const runtime = 'nodejs';

/**
 * GET /api/donor/profile
 * Fetch donor profile information
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    await connectDB();

    const user = await User.findById(userId).lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user._id,
          name: user.name,
          username: user.username,
          phone: user.phone,
          whatsapp: user.whatsapp,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch profile',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/donor/profile
 * Update donor profile (name, whatsapp, password)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    await connectDB();

    const body = await request.json();
    const { name, whatsapp, password, currentPassword } = body;

    // Find user
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (name) user.name = name;
    if (whatsapp) user.whatsapp = whatsapp;

    // If password update is requested, verify current password
    if (password) {
      if (!currentPassword) {
        return NextResponse.json(
          {
            success: false,
            error: 'Current password is required to update password',
          },
          { status: 400 }
        );
      }

      // Verify current password
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        return NextResponse.json(
          {
            success: false,
            error: 'Current password is incorrect',
          },
          { status: 401 }
        );
      }

      user.password = password;
    }

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user._id,
          name: user.name,
          username: user.username,
          phone: user.phone,
          whatsapp: user.whatsapp,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating profile:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        {
          success: false,
          error: messages.join(', '),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update profile',
      },
      { status: 500 }
    );
  }
}
