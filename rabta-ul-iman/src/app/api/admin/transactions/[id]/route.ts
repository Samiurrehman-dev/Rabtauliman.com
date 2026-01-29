import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/src/lib/db';
import Transaction from '@/src/models/Transaction';
import mongoose from 'mongoose';

// Force Node.js runtime (required for MongoDB)
export const runtime = 'nodejs';

/**
 * PATCH /api/admin/transactions/[id]
 * Updates the status of a specific transaction
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid transaction ID format',
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status. Must be: pending, approved, or rejected',
        },
        { status: 400 }
      );
    }

    // Find and update transaction
    const transaction = await Transaction.findByIdAndUpdate(
      id,
      { status },
      {
        new: true, // Return updated document
        runValidators: true, // Run model validators
      }
    );

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: transaction,
        message: `Transaction ${status} successfully`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update transaction',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/transactions/[id]
 * Deletes a specific transaction (optional - for admin cleanup)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid transaction ID format',
        },
        { status: 400 }
      );
    }

    // Find and delete transaction
    const transaction = await Transaction.findByIdAndDelete(id);

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Transaction deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete transaction',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/transactions/[id]
 * Fetches a specific transaction by ID (optional - for detailed view)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid transaction ID format',
        },
        { status: 400 }
      );
    }

    // Find transaction
    const transaction = await Transaction.findById(id).lean();

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: transaction,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch transaction',
      },
      { status: 500 }
    );
  }
}
