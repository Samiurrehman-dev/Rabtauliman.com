import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

// Inline Transaction schema
const TransactionSchema = new mongoose.Schema({
  donorName: String,
  amount: Number,
  screenshotUrl: String,
  status: String,
  type: String,
  description: String,
  userId: mongoose.Schema.Types.ObjectId,
  donorId: mongoose.Schema.Types.ObjectId,
  date: Date,
}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

/**
 * GET /api/admin/transactions
 * Fetches all transactions from MongoDB
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📡 Admin transactions API called');
    
    // Connect to MongoDB if not connected
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
      });
      console.log('✅ MongoDB connected');
    }

    // Fetch transactions - limit to 100 for performance
    const transactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    console.log(`Found ${transactions.length} transactions`);

    // Serialize data
    const serializedTransactions = transactions.map((t: any) => ({
      _id: t._id.toString(),
      donorName: t.donorName,
      amount: t.amount,
      screenshotUrl: t.screenshotUrl,
      status: t.status,
      type: t.type || 'donation',
      description: t.description,
      createdAt: t.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: t.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    // Calculate stats from fetched transactions (faster than aggregation)
    const approved = transactions.filter((t: any) => t.status === 'approved');
    const totalApprovedFunds = approved.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    const pendingCount = transactions.filter((t: any) => t.status === 'pending').length;

    const stats = {
      totalApprovedFunds,
      rabtaFund: 0, // Can be calculated later if needed
      madrassaFund: 0, // Can be calculated later if needed
      pendingCount,
      totalTransactions: transactions.length,
    };

    console.log('✅ Sending response with', transactions.length, 'transactions');

    return NextResponse.json({
      success: true,
      data: serializedTransactions,
      stats,
      count: serializedTransactions.length,
    });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch transactions',
    }, { status: 500 });
  }
}
