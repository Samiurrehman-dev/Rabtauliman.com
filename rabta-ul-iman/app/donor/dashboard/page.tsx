'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, User, Phone, MessageCircle, Calendar, DollarSign, History } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  type: string;
  status: string;
  description?: string;
}

interface DonorProfile {
  name: string;
  username: string;
  phone: string;
  whatsapp: string;
  joinedDate: string;
  totalDonations: number;
  lastDonation?: string;
}

export default function DonorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/donor/login');
    }
    
    // If authenticated but not a donor, redirect to appropriate page
    if (status === 'authenticated' && session?.user?.role !== 'donor') {
      if (session?.user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/donor/login');
      }
    }

    // Fetch donor profile and transactions
    if (status === 'authenticated' && session?.user?.role === 'donor') {
      fetchDonorData();
    }
  }, [status, session, router]);

  const fetchDonorData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching donor data...');
      
      // Fetch profile
      const profileRes = await fetch('/api/donor/profile', {
        credentials: 'include',
      });
      
      console.log('Profile response status:', profileRes.status);
      
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.data);
        console.log('Profile loaded successfully');
      } else {
        const errorData = await profileRes.json().catch(() => ({ error: 'Failed to fetch profile' }));
        console.error('Profile fetch error:', errorData);
      }

      // Fetch transactions
      console.log('Fetching transactions from /api/donor/transactions...');
      const transactionsRes = await fetch('/api/donor/transactions', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Transactions response status:', transactionsRes.status);
      console.log('Transactions response headers:', Object.fromEntries(transactionsRes.headers.entries()));
      
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        console.log('Transactions data:', transactionsData);
        setTransactions(transactionsData.data || []);
      } else {
        const errorText = await transactionsRes.text();
        console.error('Transactions error response (raw):', errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error('Transactions fetch error (parsed):', errorData);
          alert(`Error fetching transactions: ${errorData.error || 'Unknown error'}`);
        } catch (e) {
          console.error('Failed to parse error response');
          alert(`Error fetching transactions: Status ${transactionsRes.status}`);
        }
      }
    } catch (error) {
      console.error('Error fetching donor data:', error);
      alert(`Error fetching transactions: ${error instanceof Error ? error.message : 'Failed to fetch'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/donor/login' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-700 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'donor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Donor Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Welcome back, {session.user?.name || profile?.name}
            </p>
          </div>
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="mb-6 border-emerald-200 dark:border-emerald-900 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center">
              <User className="mr-2 h-6 w-6 text-emerald-700" />
              Profile Information
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Your account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="flex items-center text-slate-900 dark:text-white">
                  <User className="mr-2 h-4 w-4 text-slate-500" />
                  {profile?.name || session.user?.name || 'N/A'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <div className="flex items-center text-slate-900 dark:text-white">
                  <User className="mr-2 h-4 w-4 text-slate-500" />
                  {profile?.username || 'N/A'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <div className="flex items-center text-slate-900 dark:text-white">
                  <Phone className="mr-2 h-4 w-4 text-slate-500" />
                  {profile?.phone || 'N/A'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp
                </label>
                <div className="flex items-center text-slate-900 dark:text-white">
                  <MessageCircle className="mr-2 h-4 w-4 text-slate-500" />
                  {profile?.whatsapp || 'N/A'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Member Since
                </label>
                <div className="flex items-center text-slate-900 dark:text-white">
                  <Calendar className="mr-2 h-4 w-4 text-slate-500" />
                  {profile?.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="border-emerald-200 dark:border-emerald-900 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900 dark:text-white flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-emerald-700" />
                Total Donations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700">
                PKR {profile?.totalDonations?.toLocaleString() || '0'}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Thank you for your generous support
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 dark:border-emerald-900 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900 dark:text-white flex items-center">
                <History className="mr-2 h-5 w-5 text-emerald-700" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium text-slate-900 dark:text-white">
                {transactions.length} Transaction{transactions.length !== 1 ? 's' : ''}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                {profile?.lastDonation 
                  ? `Last donation: ${new Date(profile.lastDonation).toLocaleDateString()}`
                  : 'No donations yet'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="border-emerald-200 dark:border-emerald-900 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center">
              <History className="mr-2 h-6 w-6 text-emerald-700" />
              Transaction History
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Your donation records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm mt-2">Your donation history will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Description</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Amount</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-900 dark:text-white capitalize">
                          {transaction.type}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                          {transaction.description || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-emerald-700">
                          PKR {transaction.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
