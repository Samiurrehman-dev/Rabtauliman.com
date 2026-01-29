import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import connectDB from '@/src/lib/db';
import User from '@/src/models/User';
import Transaction from '@/src/models/Transaction';
import mongoose from 'mongoose';

// Force Node.js runtime (required for MongoDB)
export const runtime = 'nodejs';

/**
 * GET /api/admin/users/[id]
 * Fetch a specific user's details and all their transactions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Await params in Next.js 15+
    const { id } = await params;
    const userId = id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Fetch user details
    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch all transactions for this user
    const transactions = await Transaction.find({
      $or: [
        { userId: userId },
        { donorId: userId }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate statistics
    const approvedTransactions = transactions.filter((t: any) => t.status === 'approved');
    const totalContributed = approvedTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    
    // Calculate Madrassa vs Rabta totals
    const madrassaTotal = approvedTransactions
      .filter((t: any) => t.type?.toLowerCase().includes('madrassa'))
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const rabtaTotal = approvedTransactions
      .filter((t: any) => t.type?.toLowerCase().includes('rabta'))
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const pendingCount = transactions.filter((t: any) => t.status === 'pending').length;

    // Return user details, transactions, and stats
    return NextResponse.json({
      success: true,
      data: {
        user: {
          _id: user._id.toString(),
          name: user.name,
          username: user.username,
          phone: user.phone,
          whatsapp: user.whatsapp,
          role: user.role,
          createdAt: user.createdAt,
        },
        transactions: transactions.map((t: any) => ({
          ...t,
          _id: t._id.toString(),
          userId: t.userId?.toString(),
          donorId: t.donorId?.toString(),
        })),
        stats: {
          totalContributed,
          madrassaTotal,
          rabtaTotal,
          pendingCount,
          totalTransactions: transactions.length,
          approvedCount: approvedTransactions.length,
          rejectedCount: transactions.filter((t: any) => t.status === 'rejected').length,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}
