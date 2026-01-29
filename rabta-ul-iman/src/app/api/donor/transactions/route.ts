import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import connectDB from '@/src/lib/db';
import Transaction from '@/src/models/Transaction';
import User from '@/src/models/User';

// Force Node.js runtime (required for MongoDB and auth)
export const runtime = 'nodejs';

/**
 * GET /api/donor/transactions
 * Fetches donor's personal transactions and public ledger
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

    // Fetch user's own transactions
    const myTransactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Calculate personal stats
    const myStats = {
      totalApprovedDonations: await Transaction.aggregate([
        { $match: { userId, status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).then((result) => (result[0]?.total || 0)),
      pendingPledges: await Transaction.countDocuments({ userId, status: 'pending' }),
    };

    // Fetch public ledger (all approved transactions, hide private ones)
    const publicLedger = await Transaction.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to recent 50 for performance
      .lean()
      .exec();

    // Transform public ledger to hide private donor names
    const transformedPublicLedger = publicLedger.map((transaction) => ({
      ...transaction,
      donorName: transaction.isPrivate ? 'Anonymous Donor' : transaction.donorName,
      screenshotUrl: transaction.isPrivate ? '' : transaction.screenshotUrl, // Hide screenshot for privacy
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          myTransactions,
          myStats,
          publicLedger: transformedPublicLedger,
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

/**
 * POST /api/donor/transactions
 * Create a new invoice (pledge)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const userName = session.user.name || 'Unknown Donor';

    await connectDB();

    const body = await request.json();
    const { amount, isPrivate, notes } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid amount is required',
        },
        { status: 400 }
      );
    }

    // Create new transaction (pledge state - no screenshot yet)
    const newTransaction = await Transaction.create({
      userId,
      donorName: userName,
      amount,
      screenshotUrl: '', // Empty initially
      status: 'pending',
      isPrivate: isPrivate || false,
      notes: notes || '',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Invoice created successfully',
        data: newTransaction,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating invoice:', error);

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
        error: error.message || 'Failed to create invoice',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/donor/transactions
 * Upload screenshot and update transaction to awaiting verification
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
    const { transactionId, screenshotUrl } = body;

    // Validate required fields
    if (!transactionId || !screenshotUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction ID and screenshot URL are required',
        },
        { status: 400 }
      );
    }

    // Find transaction and verify ownership
    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId,
    });

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found or unauthorized',
        },
        { status: 404 }
      );
    }

    // Update transaction with screenshot
    transaction.screenshotUrl = screenshotUrl;
    // Status remains 'pending' for admin verification
    await transaction.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Payment screenshot uploaded successfully. Awaiting admin verification.',
        data: transaction,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error uploading screenshot:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload screenshot',
      },
      { status: 500 }
    );
  }
}
