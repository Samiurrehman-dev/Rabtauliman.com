import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/src/lib/db';
import User from '@/src/models/User';

// Force Node.js runtime (required for bcrypt and MongoDB)
export const runtime = 'nodejs';

/**
 * POST /api/auth/register
 * Register a new donor (can be called by admin or self-signup)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, username, phone, whatsapp, password, role } = body;

    // Validate required fields
    if (!name || !username || !phone || !whatsapp || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, username, phone, whatsapp, password',
        },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username already exists',
        },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = await User.create({
      name,
      username: username.toLowerCase(),
      phone,
      whatsapp,
      password,
      role: role || 'donor', // Default to donor if not specified
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        data: {
          id: newUser._id,
          name: newUser.name,
          username: newUser.username,
          phone: newUser.phone,
          whatsapp: newUser.whatsapp,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error registering user:', error);
    
    // Handle validation errors
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
        error: error.message || 'Failed to register user',
      },
      { status: 500 }
    );
  }
}
