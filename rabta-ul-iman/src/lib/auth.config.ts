import type { NextAuthConfig } from 'next-auth';

// Edge-compatible auth configuration (for middleware)
// Credentials provider is added in auth.ts which runs in Node.js runtime
export const authConfig: NextAuthConfig = {
  providers: [], // Providers will be added in auth.ts
  pages: {
    signIn: '/donor/login', // Default login page for donors
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }: any) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      
      const isOnAdminDashboard = nextUrl.pathname.startsWith('/admin/dashboard');
      const isOnAdminLogin = nextUrl.pathname.startsWith('/admin/login');
      const isOnDonorArea = nextUrl.pathname.startsWith('/donor') && !nextUrl.pathname.startsWith('/donor/login') && !nextUrl.pathname.startsWith('/donor/signup');
      const isOnDonorLogin = nextUrl.pathname.startsWith('/donor/login');
      
      // Admin routes protection
      if (isOnAdminDashboard) {
        if (isLoggedIn && userRole === 'admin') return true;
        return false; // Redirect to login
      }

      // Donor routes protection
      if (isOnDonorArea) {
        if (isLoggedIn && userRole === 'donor') return true;
        return false; // Redirect to login
      }

      // If logged in and trying to access login page, redirect based on role
      if (isLoggedIn && (isOnAdminLogin || isOnDonorLogin)) {
        if (userRole === 'admin') {
          return Response.redirect(new URL('/admin/dashboard', nextUrl));
        } else if (userRole === 'donor') {
          return Response.redirect(new URL('/donor/dashboard', nextUrl));
        }
      }
      
      return true;
    },
    jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
        token.phone = user.phone;
        token.whatsapp = user.whatsapp;
      }
      return token;
    },
    session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.phone = token.phone;
        session.user.whatsapp = token.whatsapp;
      }
      return session;
    },
  },
};
