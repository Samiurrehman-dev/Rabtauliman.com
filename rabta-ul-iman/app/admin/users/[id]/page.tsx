'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Phone,
  MessageCircle,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  LogOut,
  ArrowLeft,
  Wallet,
  CalendarIcon,
  Filter,
  Check,
  X,
} from 'lucide-react';

interface Transaction {
  _id: string;
  donorName: string;
  amount: number;
  type: string;
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  date: string;
}

interface UserDetails {
  _id: string;
  name: string;
  username: string;
  phone: string;
  whatsapp: string;
  role: string;
  createdAt: string;
}

interface Stats {
  totalContributed: number;
  madrassaTotal: number;
  rabtaTotal: number;
  pendingCount: number;
  totalTransactions: number;
  approvedCount: number;
  rejectedCount: number;
}

interface UserData {
  user: UserDetails;
  transactions: Transaction[];
  stats: Stats;
}

export default function UserProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  // Fetch user data on mount
  useEffect(() => {
    if (status === 'authenticated' && userId) {
      fetchUserData();
    }
  }, [status, userId]);

  // Fetch user data from API
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);
      const result = await response.json();

      if (result.success) {
        setUserData(result.data);
      } else {
        console.error('Failed to fetch user data:', result.error);
        alert(`Failed to fetch user data: ${result.error}`);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      alert(`Error fetching user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Update transaction status
  const updateTransactionStatus = async (transactionId: string, newStatus: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to ${newStatus === 'approved' ? 'approve' : 'reject'} this transaction?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/transactions/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Transaction ${newStatus} successfully!`);
        fetchUserData(); // Refresh data
      } else {
        alert(`Failed to update transaction: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert(`Error updating transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    });
  };

  // Open image dialog
  const openImageDialog = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get category badge
  const getCategoryBadge = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('madrassa')) {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-300">
          Madrassa
        </Badge>
      );
    } else if (lowerType.includes('rabta')) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
          Rabta
        </Badge>
      );
    } else {
      return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Get unique years and months from transactions
  const availableYears = useMemo(() => {
    if (!userData?.transactions) return [];
    const years = userData.transactions.map((t) => 
      new Date(t.date || t.createdAt).getFullYear()
    );
    return [...new Set(years)].sort((a, b) => b - a);
  }, [userData]);

  const months = [
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  // Filter transactions
  const filteredTransactions = userData?.transactions.filter((transaction) => {
    // Status filter
    if (filter !== 'all' && transaction.status !== filter) return false;
    
    // Date filtering
    const transactionDate = new Date(transaction.date || transaction.createdAt);
    const transactionYear = transactionDate.getFullYear();
    const transactionMonth = transactionDate.getMonth();
    
    // Year filter
    if (selectedYear !== 'all' && transactionYear !== parseInt(selectedYear)) return false;
    
    // Month filter
    if (selectedMonth !== 'all' && transactionMonth !== parseInt(selectedMonth)) return false;
    
    return true;
  }) || [];

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/admin/login');
  };

  // If not authenticated or loading, show nothing
  if (status === 'loading' || status === 'unauthenticated') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-700" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">User not found</p>
          <Button onClick={() => router.push('/admin/users')} className="mt-4">
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/users')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to All Users
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Donor Profile</h1>
                <p className="text-sm text-slate-600">
                  Detailed history and statistics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUserData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <Card className="mb-6 border-emerald-200 bg-gradient-to-br from-white to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-emerald-900">
              <div className="h-12 w-12 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xl font-bold">
                {userData.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-2xl">{userData.user.name}</div>
                <div className="text-sm font-normal text-slate-600">@{userData.user.username}</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-slate-200">
                <Phone className="h-5 w-5 text-emerald-700" />
                <div>
                  <p className="text-xs text-slate-600">Phone Number</p>
                  <p className="font-medium">{userData.user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-slate-200">
                <MessageCircle className="h-5 w-5 text-emerald-700" />
                <div>
                  <p className="text-xs text-slate-600">WhatsApp</p>
                  <a
                    href={`https://wa.me/${userData.user.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    {userData.user.whatsapp}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-slate-200">
                <Calendar className="h-5 w-5 text-emerald-700" />
                <div>
                  <p className="text-xs text-slate-600">Joined</p>
                  <p className="font-medium">{formatDate(userData.user.createdAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Contributed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-700">
                {formatCurrency(userData.stats.totalContributed)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {userData.stats.approvedCount} approved transactions
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Madrassa Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-700">
                {formatCurrency(userData.stats.madrassaTotal)}
              </p>
              <Badge className="bg-purple-100 text-purple-800 border-purple-300 mt-2">
                Madrassa Fund
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Rabta Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-700">
                {formatCurrency(userData.stats.rabtaTotal)}
              </p>
              <Badge className="bg-blue-100 text-blue-800 border-blue-300 mt-2">
                Rabta Fund
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Pledges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-700">
                {userData.stats.pendingCount}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {userData.stats.rejectedCount} rejected
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    All transactions for this donor ({userData.stats.totalTransactions} total, showing {filteredTransactions.length})
                  </CardDescription>
                </div>
              </div>
              
              {/* Filters Row */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* Status Filters */}
                <div className="flex gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className={filter === 'all' ? 'bg-emerald-700 hover:bg-emerald-800' : ''}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('pending')}
                    className={filter === 'pending' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={filter === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('approved')}
                    className={filter === 'approved' ? 'bg-emerald-700 hover:bg-emerald-800' : ''}
                  >
                    Approved
                  </Button>
                  <Button
                    variant={filter === 'rejected' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('rejected')}
                    className={filter === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    Rejected
                  </Button>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-slate-300"></div>

                {/* Date Filters */}
                <div className="flex gap-2 items-center">
                  <CalendarIcon className="h-4 w-4 text-slate-600" />
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[120px] h-9">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(selectedMonth !== 'all' || selectedYear !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedMonth('all');
                        setSelectedYear('all');
                      }}
                      className="h-9"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Screenshot</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell className="text-slate-600">
                          {formatDate(transaction.date || transaction.createdAt)}
                        </TableCell>
                        <TableCell>{getCategoryBadge(transaction.type)}</TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell>
                          {transaction.screenshotUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openImageDialog(transaction.screenshotUrl!)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          ) : (
                            <span className="text-slate-400 text-sm">No screenshot</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.status === 'pending' ? (
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTransactionStatus(transaction._id, 'approved')}
                                className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                              >
                                <Check className="h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTransactionStatus(transaction._id, 'rejected')}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
            <DialogDescription>Transaction proof of payment</DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="mt-4">
              <img
                src={selectedImage}
                alt="Transaction Screenshot"
                className="w-full h-auto rounded-lg border border-slate-200"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
