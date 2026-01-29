import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import connectDB from '@/src/lib/db';
import Transaction from '@/src/models/Transaction';

// Force Node.js runtime
export const runtime = 'nodejs';

/**
 * GET /api/donor/transactions
 * Get current donor's transaction history
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

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Fetch transactions for the current donor
    const transactions = await Transaction.find({ donorId: session.user.id })
      .sort({ date: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await Transaction.countDocuments({ donorId: session.user.id });

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
