'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Key, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/admin/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 2000);
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 sm:py-12 px-2 sm:px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="mb-4 sm:mb-6 hover:bg-slate-200 text-xs sm:text-sm">
            <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <Card className="border-emerald-200 shadow-xl">
          <CardHeader className="space-y-2 sm:space-y-3">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-700 rounded-full flex items-center justify-center">
                <Key className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">
                  Admin Settings
                </CardTitle>
                <CardDescription className="text-xs sm:text-base">
                  Change your password
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <label
                  htmlFor="currentPassword"
                  className="text-xs sm:text-sm font-medium text-slate-700"
                >
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-white text-slate-900"
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label
                  htmlFor="newPassword"
                  className="text-xs sm:text-sm font-medium text-slate-700"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-white text-slate-900"
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
                <p className="text-xs text-slate-500">
                  Password must be at least 6 characters
                </p>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-xs sm:text-sm font-medium text-slate-700"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-white text-slate-900"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 text-center">
                    {error}
                  </p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                  <p className="text-sm text-emerald-700 font-medium">
                    {success}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-4 sm:py-6 text-base sm:text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Change Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
