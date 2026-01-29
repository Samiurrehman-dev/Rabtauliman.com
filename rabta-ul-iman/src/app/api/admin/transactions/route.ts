import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/src/lib/db';
import Transaction from '@/src/models/Transaction';

// Force Node.js runtime (required for MongoDB)
export const runtime = 'nodejs';

/**
 * GET /api/admin/transactions
 * Fetches all transactions sorted by newest first
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();

    // Get query parameters for filtering (optional)
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build query
    const query: any = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    // Fetch transactions sorted by newest first
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Calculate stats
    const stats = {
      totalApprovedFunds: await Transaction.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).then((result) => (result[0]?.total || 0)),
      pendingCount: await Transaction.countDocuments({ status: 'pending' }),
      totalTransactions: await Transaction.countDocuments(),
    };

    return NextResponse.json(
      {
        success: true,
        data: transactions,
        stats,
        count: transactions.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch transactions',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/transactions
 * Creates a new transaction (optional - for testing purposes)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { donorName, amount, screenshotUrl } = body;

    // Validate required fields
    if (!donorName || !amount || !screenshotUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: donorName, amount, screenshotUrl',
        },
        { status: 400 }
      );
    }

    // Create new transaction
    const transaction = await Transaction.create({
      donorName,
      amount,
      screenshotUrl,
      status: 'pending',
    });

    return NextResponse.json(
      {
        success: true,
        data: transaction,
        message: 'Transaction created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create transaction',
      },
      { status: 500 }
    );
  }
}
