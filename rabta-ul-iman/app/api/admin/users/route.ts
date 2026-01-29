import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import connectDB from '@/src/lib/db';
import User from '@/src/models/User';
import Transaction from '@/src/models/Transaction';

// Force Node.js runtime (required for MongoDB)
export const runtime = 'nodejs';

/**
 * GET /api/admin/users
 * Fetch all donors (users with role 'donor') with their transaction counts
 */
export async function GET(request: NextRequest) {
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

    // Fetch all donors
    const users = await User.find({ role: 'donor' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // For each user, get their transaction stats
    const usersWithStats = await Promise.all(
      users.map(async (user: any) => {
        const userId = user._id.toString();
        
        // Get transaction counts and totals
        const transactions = await Transaction.find({
          $or: [
            { userId: userId },
            { donorId: userId }
          ]
        }).lean();

        const approvedTransactions = transactions.filter((t: any) => t.status === 'approved');
        const totalContributed = approvedTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
        const pendingCount = transactions.filter((t: any) => t.status === 'pending').length;
        const totalTransactions = transactions.length;

        return {
          _id: userId,
          name: user.name,
          username: user.username,
          phone: user.phone,
          whatsapp: user.whatsapp,
          createdAt: user.createdAt,
          stats: {
            totalContributed,
            pendingCount,
            totalTransactions,
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: usersWithStats,
      count: usersWithStats.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
