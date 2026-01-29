import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import dbConnect from '@/src/lib/db';
import Transaction from '@/src/models/Transaction';

export async function PATCH(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const { transactionId, status } = await req.json();

    // Validate required fields
    if (!transactionId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: transactionId, status' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status must be either "pending", "approved", or "rejected"' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find and update transaction
    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      { status },
      { new: true }
    );

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transaction,
      message: `Transaction status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update transaction status' 
      },
      { status: 500 }
    );
  }
}
