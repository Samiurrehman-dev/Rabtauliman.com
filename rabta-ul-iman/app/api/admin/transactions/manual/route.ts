import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import dbConnect from '@/src/lib/db';
import Transaction from '@/src/models/Transaction';
import User from '@/src/models/User';

export async function POST(req: NextRequest) {
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
    const { userId, amount, category, status = 'approved' } = await req.json();

    // Validate required fields
    if (!userId || !amount || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, amount, category' },
        { status: 400 }
      );
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate category
    if (!['rabta', 'madrassa'].includes(category.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Category must be either "rabta" or "madrassa"' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['approved', 'pending'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status must be either "approved" or "pending"' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get user details for donorName
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Create transaction with specified status
    const transaction = await Transaction.create({
      userId,
      donorId: userId,
      donorName: user.name,
      amount: parsedAmount,
      type: category.toLowerCase(),
      status: status,
      date: new Date(),
      isPrivate: false,
      description: `Manually added by admin - ${status}`,
    });

    return NextResponse.json({
      success: true,
      data: transaction,
      message: 'Transaction added successfully',
    });
  } catch (error) {
    console.error('Error creating manual transaction:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create transaction' 
      },
      { status: 500 }
    );
  }
}
