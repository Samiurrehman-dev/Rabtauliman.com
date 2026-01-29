import { auth } from '@/src/lib/auth';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isOnAdminDashboard = nextUrl.pathname.startsWith('/admin/dashboard');
  const isOnAdminUsers = nextUrl.pathname.startsWith('/admin/users');
  const isOnAdminLogin = nextUrl.pathname.startsWith('/admin/login');
  const isOnDonorDashboard = nextUrl.pathname.startsWith('/donor/dashboard');
  const isOnDonorLogin = nextUrl.pathname.startsWith('/donor/login');

  // Protect admin routes
  if ((isOnAdminDashboard || isOnAdminUsers) && (!isLoggedIn || userRole !== 'admin')) {
    return Response.redirect(new URL('/admin/login', nextUrl));
  }

  // Protect donor routes
  if (isOnDonorDashboard && (!isLoggedIn || userRole !== 'donor')) {
    return Response.redirect(new URL('/donor/login', nextUrl));
  }

  // Redirect logged-in users away from login pages
  if (isLoggedIn && (isOnAdminLogin || isOnDonorLogin)) {
    if (userRole === 'admin') {
      return Response.redirect(new URL('/admin/dashboard', nextUrl));
    } else if (userRole === 'donor') {
      return Response.redirect(new URL('/donor/dashboard', nextUrl));
    }
  }

  return;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
