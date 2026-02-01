'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Eye, RefreshCw, TrendingUp, Users, LogOut, User, Settings, UserPlus } from 'lucide-react';

interface Transaction {
  _id: string;
  donorName: string;
  amount: number;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalApprovedFunds: number;
  rabtaFund: number;
  madrassaFund: number;
  pendingCount: number;
  totalTransactions: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalApprovedFunds: 0,
    rabtaFund: 0,
    madrassaFund: 0,
    pendingCount: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  // Fetch transactions function
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      console.log('Fetching transactions from API...');
      const response = await fetch('/api/admin/transactions', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response (raw):', errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error('Error response (parsed):', errorData);
          setFetchError(errorData.error || 'Unknown error');
        } catch (e) {
          console.error('Failed to parse error response');
          setFetchError(`Status ${response.status}`);
        }
        return;
      }
      
      const result = await response.json();
      console.log('API Response:', result);

      if (result.success) {
        setTransactions(result.data || []);
        setStats(result.stats || {
          totalApprovedFunds: 0,
          rabtaFund: 0,
          madrassaFund: 0,
          pendingCount: 0,
          totalTransactions: 0,
        });
        console.log('Transactions loaded:', result.data?.length || 0);
      } else {
        console.error('Failed to fetch transactions:', result.error);
        setFetchError(result.error);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setFetchError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions on mount - only once
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Update transaction status
  const updateTransactionStatus = async (
    id: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      setUpdating(id);
      const response = await fetch(`/api/admin/transactions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh transactions after successful update
        await fetchTransactions();
      } else {
        console.error('Failed to update transaction:', result.error);
        alert('Failed to update transaction status');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('An error occurred while updating transaction');
    } finally {
      setUpdating(null);
    }
  };

  // Open image dialog
  const openImageDialog = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge variant and label
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-700 hover:bg-emerald-800 text-white">
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            Rejected
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-700" />
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  // Show loading while fetching data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-700 mx-auto mb-4" />
          <p className="text-slate-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  // Show error if fetch failed
  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Error Loading Data</h2>
          <p className="text-slate-600 mb-4">{fetchError}</p>
          <Button onClick={() => fetchTransactions()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Get recent approved donors (last 5)
  const recentDonors = transactions
    .filter((t) => t.status === 'approved')
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
              Rabta-ul-Iman
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-400 mt-1">
              Admin Dashboard
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* User Info */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <User className="h-4 w-4 text-emerald-700" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {session?.user?.name || 'Admin'}
              </span>
            </div>
            {/* Settings Button */}
            <Button
              onClick={() => router.push('/admin/settings')}
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            {/* Create Admin Button */}
            <Button
              onClick={() => router.push('/admin/create-admin')}
              variant="outline"
              size="sm"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm"
            >
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Create Admin</span>
            </Button>
            {/* View All Users Button */}
            <Button
              onClick={() => router.push('/admin/users')}
              variant="outline"
              size="sm"
              className="border-emerald-700 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden lg:inline">All Donors</span>
            </Button>
            {/* Refresh Button */}
            <Button
              onClick={fetchTransactions}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-emerald-700 text-emerald-700 hover:bg-emerald-50"
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="destructive"
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          {/* Total Approved Funds */}
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-emerald-700 dark:text-emerald-500">
                    {formatCurrency(stats.totalApprovedFunds)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 hidden sm:block">
                    Lifetime donations
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-emerald-700 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Rabta Fund */}
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                Rabta Fund
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-blue-700 dark:text-blue-500">
                    {formatCurrency(stats.rabtaFund)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 hidden sm:block">
                    Rabta donations
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-blue-700 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Madrassa Fund */}
          <Card className="border-purple-200 dark:border-purple-900">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                Madrassa Fund
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-purple-700 dark:text-purple-500">
                    {formatCurrency(stats.madrassaFund)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 hidden sm:block">
                    Madrassa donations
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-purple-700 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="border-yellow-200 dark:border-yellow-900">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-yellow-600 dark:text-yellow-500">
                    {stats.pendingCount}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 hidden sm:block">
                    Awaiting verification
                  </p>
                </div>
                <RefreshCw className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-yellow-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Table */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl lg:text-2xl text-slate-900 dark:text-white">
              Transactions
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Verify and manage donations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-emerald-700" />
                <span className="ml-3 text-slate-600">Loading transactions...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No transactions found
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-xs sm:text-sm">Donor</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm">Amount</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell">Date</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="font-semibold text-xs sm:text-sm text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {transaction.donorName}
                        </TableCell>
                        <TableCell className="font-semibold text-emerald-700 text-xs sm:text-sm">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-slate-600 hidden md:table-cell">
                          {formatDate(transaction.createdAt)}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            {/* View Receipt Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openImageDialog(transaction.screenshotUrl)}
                              className="h-7 sm:h-8 px-2 sm:px-3"
                            >
                              <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                              <span className="hidden sm:inline text-xs">View</span>
                            </Button>

                            {/* Approve Button */}
                            {transaction.status !== 'approved' && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateTransactionStatus(transaction._id, 'approved')
                                }
                                disabled={updating === transaction._id}
                                className="h-7 sm:h-8 px-2 sm:px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                              >
                                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                                <span className="hidden sm:inline">Approve</span>
                              </Button>
                            )}

                            {/* Reject Button */}
                            {transaction.status !== 'rejected' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  updateTransactionStatus(transaction._id, 'rejected')
                                }
                                disabled={updating === transaction._id}
                                className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
                              >
                                <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" />
                                <span className="hidden sm:inline">Reject</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Screenshot Modal */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Payment Receipt</DialogTitle>
              <DialogDescription>
                Screenshot of the payment transaction
              </DialogDescription>
            </DialogHeader>
            {selectedImage && (
              <div className="mt-4">
                <img
                  src={selectedImage}
                  alt="Payment Screenshot"
                  className="w-full h-auto rounded-lg border border-slate-200"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
