import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';
import connectDB from './db';
import User from '@/src/models/User';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Connect to database
          await connectDB();
          
          // Find user by username (works for both admin and donor)
          const user = await User.findOne({ 
            username: (credentials.username as string).toLowerCase() 
          }).select('+password').lean();

          if (!user) {
            console.log('User not found:', credentials.username);
            return null;
          }

          // Compare passwords using bcrypt
          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValidPassword) {
            console.log('Invalid password for user:', credentials.username);
            return null;
          }

          // Return user object with all necessary fields
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.role === 'admin' 
              ? 'admin@rabta-ul-iman.com' 
              : `${user.username}@donor.rabta-ul-iman.com`,
            role: user.role,
            username: user.username,
            phone: user.phone,
            whatsapp: user.whatsapp,
          };
        } catch (error) {
          console.error('Error during authentication:', error);
          return null;
        }
      },
    }),
  ],
});

// Export authOptions for API routes compatibility
export const authOptions = authConfig;
