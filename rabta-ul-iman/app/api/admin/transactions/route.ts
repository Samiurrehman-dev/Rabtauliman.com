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
    console.log('📡 GET /api/admin/transactions - Starting...');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected');

    // Get query parameters for filtering (optional)
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build query
    const query: any = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    console.log('Fetching transactions with query:', query);
    
    // Fetch transactions sorted by newest first
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    console.log(`Found ${transactions.length} transactions`);

    // Serialize MongoDB ObjectIds to strings for JSON response
    const serializedTransactions = transactions.map((transaction: any) => ({
      ...transaction,
      _id: transaction._id.toString(),
      userId: transaction.userId?.toString(),
      donorId: transaction.donorId?.toString(),
      createdAt: transaction.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: transaction.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    // Calculate stats
    const approvedAggregation = await Transaction.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    
    // Calculate Rabta Fund (approved transactions with type containing 'rabta')
    const rabtaAggregation = await Transaction.aggregate([
      { 
        $match: { 
          status: 'approved',
          type: { $regex: /rabta/i }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    
    // Calculate Madrassa Fund (approved transactions with type containing 'madrassa')
    const madrassaAggregation = await Transaction.aggregate([
      { 
        $match: { 
          status: 'approved',
          type: { $regex: /madrassa/i }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    
    const totalApprovedFunds = approvedAggregation[0]?.total || 0;
    const rabtaFund = rabtaAggregation[0]?.total || 0;
    const madrassaFund = madrassaAggregation[0]?.total || 0;
    const pendingCount = await Transaction.countDocuments({ status: 'pending' });
    const totalTransactions = await Transaction.countDocuments();

    const stats = {
      totalApprovedFunds,
      rabtaFund,
      madrassaFund,
      pendingCount,
      totalTransactions,
    };

    console.log('Stats calculated:', stats);

    return NextResponse.json(
      {
        success: true,
        data: serializedTransactions,
        stats,
        count: serializedTransactions.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error fetching transactions:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch transactions',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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
