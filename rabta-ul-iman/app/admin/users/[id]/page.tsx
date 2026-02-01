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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/users')}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">Donor Profile</h1>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">
                  Detailed history
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUserData}
                disabled={loading}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-xs sm:text-sm">Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-1 sm:gap-2 text-red-600 hover:text-red-700 px-2 sm:px-3"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline text-xs sm:text-sm">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* User Info Card */}
        <Card className="mb-4 sm:mb-6 border-emerald-200 bg-gradient-to-br from-white to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-emerald-900">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-emerald-700 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
                {userData.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-lg sm:text-xl lg:text-2xl">{userData.user.name}</div>
                <div className="text-xs sm:text-sm font-normal text-slate-600">@{userData.user.username}</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-700" />
                <div>
                  <p className="text-xs text-slate-600">Phone</p>
                  <p className="font-medium text-xs sm:text-sm">{userData.user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-700" />
                <div>
                  <p className="text-xs text-slate-600">WhatsApp</p>
                  <a
                    href={`https://wa.me/${userData.user.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline text-xs sm:text-sm"
                  >
                    {userData.user.whatsapp}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 bg-white p-3 sm:p-4 rounded-lg border border-slate-200">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-700" />
                <div>
                  <p className="text-xs text-slate-600">Joined</p>
                  <p className="font-medium text-xs sm:text-sm">{formatDate(userData.user.createdAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
          <Card className="border-emerald-200">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-1 sm:gap-2">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Total</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-emerald-700">
                {formatCurrency(userData.stats.totalContributed)}
              </p>
              <p className="text-xs text-slate-500 mt-1 hidden sm:block">
                {userData.stats.approvedCount} approved
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-1 sm:gap-2">
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                Madrassa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-purple-700">
                {formatCurrency(userData.stats.madrassaTotal)}
              </p>
              <Badge className="bg-purple-100 text-purple-800 border-purple-300 mt-2 text-xs hidden sm:inline-flex">
                Madrassa Fund
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-1 sm:gap-2">
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                Rabta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-blue-700">
                {formatCurrency(userData.stats.rabtaTotal)}
              </p>
              <Badge className="bg-blue-100 text-blue-800 border-blue-300 mt-2 text-xs hidden sm:inline-flex">
                Rabta Fund
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-1 sm:gap-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-amber-700">
                {userData.stats.pendingCount}
              </p>
              <p className="text-xs text-slate-500 mt-1 hidden sm:block">
                {userData.stats.rejectedCount} rejected
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex justify-between items-start sm:items-center">
                <div>
                  <CardTitle className="text-base sm:text-lg">Transaction History</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {userData.stats.totalTransactions} total, showing {filteredTransactions.length}
                  </CardDescription>
                </div>
              </div>
              
              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 items-start sm:items-center">
                {/* Status Filters */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className={`text-xs sm:text-sm h-8 px-2 sm:px-3 ${filter === 'all' ? 'bg-emerald-700 hover:bg-emerald-800' : ''}`}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('pending')}
                    className={`text-xs sm:text-sm h-8 px-2 sm:px-3 ${filter === 'pending' ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={filter === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('approved')}
                    className={`text-xs sm:text-sm h-8 px-2 sm:px-3 ${filter === 'approved' ? 'bg-emerald-700 hover:bg-emerald-800' : ''}`}
                  >
                    Approved
                  </Button>
                  <Button
                    variant={filter === 'rejected' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('rejected')}
                    className={`text-xs sm:text-sm h-8 px-2 sm:px-3 ${filter === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  >
                    Rejected
                  </Button>
                </div>

                {/* Divider */}
                <div className="h-px w-full sm:h-6 sm:w-px bg-slate-300"></div>

                {/* Date Filters */}
                <div className="flex gap-2 items-center w-full sm:w-auto">
                  <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="flex-1 sm:w-[120px] lg:w-[140px] h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="Month" />
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
                    <SelectTrigger className="flex-1 sm:w-[100px] lg:w-[120px] h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="Year" />
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
                      className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
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
                <p className="text-slate-500 text-sm sm:text-base">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Category</TableHead>
                      <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Screenshot</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell className="text-slate-600 text-xs sm:text-sm">
                          {formatDate(transaction.date || transaction.createdAt)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{getCategoryBadge(transaction.type)}</TableCell>
                        <TableCell className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {transaction.screenshotUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openImageDialog(transaction.screenshotUrl!)}
                              className="flex items-center gap-1 h-7 sm:h-8 px-2 sm:px-3"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden lg:inline text-xs">View</span>
                            </Button>
                          ) : (
                            <span className="text-slate-400 text-xs sm:text-sm">No screenshot</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.status === 'pending' ? (
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTransactionStatus(transaction._id, 'approved')}
                                className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 h-7 sm:h-8 px-2 sm:px-3"
                              >
                                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden lg:inline text-xs">Approve</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTransactionStatus(transaction._id, 'rejected')}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 h-7 sm:h-8 px-2 sm:px-3"
                              >
                                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden lg:inline text-xs">Reject</span>
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs sm:text-sm">-</span>
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
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Payment Screenshot</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Transaction proof of payment</DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="mt-3 sm:mt-4">
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
