'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

export default function DonorLogin() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });
  const [signupData, setSignupData] = useState({
    name: '',
    username: '',
    phone: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username: loginData.username,
        password: loginData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid username or password');
      } else {
        router.push('/donor/dashboard');
      }
    } catch (error) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signupData.name,
          username: signupData.username,
          phone: signupData.phone,
          whatsapp: signupData.whatsapp,
          password: signupData.password,
          role: 'donor',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setActiveTab('login');
        setLoginData({ username: signupData.username, password: '' });
        setError('');
        alert('Registration successful! Please login.');
      } else {
        setError(result.error || 'Failed to register');
      }
    } catch (error) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Rabta-ul-Iman
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Donor Portal
          </p>
        </div>

        <Card className="border-emerald-200 dark:border-emerald-900 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900 dark:text-white">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              {activeTab === 'login' ? 'Sign in to your donor account' : 'Join as a donor to make a difference'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'login'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <LogIn className="inline-block mr-2 h-4 w-4" />
                Login
              </button>
              <button
                onClick={() => { setActiveTab('signup'); setError(''); }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'signup'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <UserPlus className="inline-block mr-2 h-4 w-4" />
                Sign Up
              </button>
            </div>

            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:bg-slate-800 dark:text-white"
                    placeholder="Enter your username"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full px-4 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:bg-slate-800 dark:text-white"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white">
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            )}

            {activeTab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:bg-slate-800 dark:text-white"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="signup-username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Username</label>
                  <input
                    id="signup-username"
                    type="text"
                    required
                    value={signupData.username}
                    onChange={(e) => setSignupData({ ...signupData, username: e.target.value.toLowerCase() })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:bg-slate-800 dark:text-white"
                    placeholder="Choose a username"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={signupData.phone}
                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:bg-slate-800 dark:text-white"
                    placeholder="03001234567"
                  />
                </div>

                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">WhatsApp Number</label>
                  <input
                    id="whatsapp"
                    type="tel"
                    required
                    value={signupData.whatsapp}
                    onChange={(e) => setSignupData({ ...signupData, whatsapp: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:bg-slate-800 dark:text-white"
                    placeholder="03001234567"
                  />
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      className="w-full px-4 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:bg-slate-800 dark:text-white"
                      placeholder="Minimum 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:bg-slate-800 dark:text-white"
                      placeholder="Re-enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white">
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link href="/admin/login" className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300">
                Admin Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
