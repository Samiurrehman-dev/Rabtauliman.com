import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import connectDB from '@/src/lib/db';
import Transaction from '@/src/models/Transaction';
import User from '@/src/models/User';
import mongoose from 'mongoose';

// Force Node.js runtime
export const runtime = 'nodejs';

/**
 * GET /api/donor/transactions
 * Get current donor's transaction history
 */
export async function GET(request: NextRequest) {
  console.log('=== Donor Transactions API Called ===');
  try {
    // Check authentication
    const session = await auth();
    console.log('Session:', session ? { id: session.user?.id, username: session.user?.username, role: session.user?.role } : 'No session');
    
    if (!session || !session.user) {
      console.error('No session or user found');
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

    // Add timeout for database connection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout - Database connection took too long')), 30000);
    });

    await Promise.race([connectDB(), timeoutPromise]);

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get user ID from session (with fallback to username lookup)
    let userId = session.user.id;
    console.log('Initial userId from session:', userId);
    
    if (!userId && session.user.username) {
      console.log('Looking up user by username:', session.user.username);
      const user = await User.findOne({ username: session.user.username }).lean();
      if (user?._id) {
        userId = user._id.toString();
        console.log('Found userId from username lookup:', userId);
      }
    }

    if (!userId) {
      console.error('No userId found after lookup');
      return NextResponse.json(
        {
          success: false,
          error: 'User not found - Please log out and log in again',
        },
        { status: 404 }
      );
    }

    console.log('Fetching transactions for userId:', userId);
    
    // Convert string ID to ObjectId for MongoDB query
    const objectId = new mongoose.Types.ObjectId(userId);
    
    // Fetch transactions for the current donor (check both userId and donorId fields)
    const transactions = await Transaction.find({ 
      $or: [
        { donorId: objectId },
        { userId: objectId }
      ]
    })
      .sort({ date: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .lean();

    console.log('Found transactions:', transactions.length);

    // Get total count for pagination
    const totalCount = await Transaction.countDocuments({ 
      $or: [
        { donorId: objectId },
        { userId: objectId }
      ]
    });
    console.log('Total transaction count:', totalCount);

    return NextResponse.json(
      {
        success: true,
        data: transactions.map((transaction) => ({
          id: transaction._id.toString(),
          amount: transaction.amount,
          date: transaction.date,
          type: transaction.type,
          status: transaction.status,
          description: transaction.description,
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching donor transactions:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch transactions',
      },
      { status: 500 }
    );
  }
}
