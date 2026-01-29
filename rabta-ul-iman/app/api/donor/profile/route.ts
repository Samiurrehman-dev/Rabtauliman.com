import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import connectDB from '@/src/lib/db';
import User from '@/src/models/User';
import Transaction from '@/src/models/Transaction';

// Force Node.js runtime
export const runtime = 'nodejs';

/**
 * GET /api/donor/profile
 * Get current donor's profile information
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Please login',
        },
        { status: 401 }
      );
    }

    // Only donors can access this endpoint
    if (session.user.role !== 'donor') {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied - Donors only',
        },
        { status: 403 }
      );
    }

    await connectDB();

    // Find user by ID
    const user = await User.findById(session.user.id).lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Calculate total donations
    const donationsResult = await Transaction.aggregate([
      {
        $match: {
          donorId: user._id,
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalDonations: { $sum: '$amount' },
          lastDonation: { $max: '$date' },
        },
      },
    ]);

    const stats = donationsResult[0] || { totalDonations: 0, lastDonation: null };

    // Return profile data
    return NextResponse.json(
      {
        success: true,
        data: {
          name: user.name,
          username: user.username,
          phone: user.phone,
          whatsapp: user.whatsapp,
          joinedDate: user.createdAt,
          totalDonations: stats.totalDonations,
          lastDonation: stats.lastDonation,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching donor profile:', error);
    
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
 * Update current donor's profile information
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Please login',
        },
        { status: 401 }
      );
    }

    // Only donors can access this endpoint
    if (session.user.role !== 'donor') {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied - Donors only',
        },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { name, phone, whatsapp } = body;

    // Find and update user
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(whatsapp && { whatsapp }),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        data: {
          name: updatedUser.name,
          username: updatedUser.username,
          phone: updatedUser.phone,
          whatsapp: updatedUser.whatsapp,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating donor profile:', error);
    
    // Handle validation errors
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
