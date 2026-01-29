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
import { CheckCircle2, XCircle, Eye, RefreshCw, TrendingUp, Users, LogOut, User } from 'lucide-react';

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  // Fetch transactions on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransactions();
    }
  }, [status]);

  // Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      console.log('Fetching transactions from API...');
      const response = await fetch('/api/admin/transactions');
      console.log('Response status:', response.status);
      
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
        alert(`Failed to fetch transactions: ${result.error}`);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      alert(`Error fetching transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

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

  // Get recent approved donors (last 5)
  const recentDonors = transactions
    .filter((t) => t.status === 'approved')
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Rabta-ul-Iman
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-1">
              Admin Dashboard - Transaction Management
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* User Info */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <User className="h-4 w-4 text-emerald-700" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {session?.user?.name || 'Admin'}
              </span>
            </div>
            {/* View All Users Button */}
            <Button
              onClick={() => router.push('/admin/users')}
              variant="outline"
              className="border-emerald-700 text-emerald-700 hover:bg-emerald-50"
            >
              <Users className="mr-2 h-4 w-4" />
              All Donors
            </Button>
            {/* Refresh Button */}
            <Button
              onClick={fetchTransactions}
              disabled={loading}
              variant="outline"
              className="border-emerald-700 text-emerald-700 hover:bg-emerald-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Approved Funds */}
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Approved Funds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-500">
                    {formatCurrency(stats.totalApprovedFunds)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Lifetime donations
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-emerald-700 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Rabta Fund */}
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Rabta Fund
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-500">
                    {formatCurrency(stats.rabtaFund)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Approved Rabta donations
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-blue-700 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Madrassa Fund */}
          <Card className="border-purple-200 dark:border-purple-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Madrassa Fund
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-700 dark:text-purple-500">
                    {formatCurrency(stats.madrassaFund)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Approved Madrassa donations
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-purple-700 opacity-20" />
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="border-yellow-200 dark:border-yellow-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">
                    {stats.pendingCount}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Awaiting verification
                  </p>
                </div>
                <RefreshCw className="h-12 w-12 text-yellow-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Table */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900 dark:text-white">
              Transaction Management
            </CardTitle>
            <CardDescription>
              Verify and manage donor payment submissions
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Donor Name</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell className="font-medium">
                          {transaction.donorName}
                        </TableCell>
                        <TableCell className="font-semibold text-emerald-700">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {formatDate(transaction.createdAt)}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            {/* View Receipt Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openImageDialog(transaction.screenshotUrl)}
                              className="h-8"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>

                            {/* Approve Button */}
                            {transaction.status !== 'approved' && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateTransactionStatus(transaction._id, 'approved')
                                }
                                disabled={updating === transaction._id}
                                className="h-8 bg-emerald-700 hover:bg-emerald-800 text-white"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Approve
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
                                className="h-8"
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
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
