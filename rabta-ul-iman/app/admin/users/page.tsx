'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Eye, RefreshCw, LogOut, ArrowLeft, UserPlus, DollarSign, Search, Download, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface UserStats {
  totalContributed: number;
  pendingCount: number;
  totalTransactions: number;
}

interface User {
  _id: string;
  name: string;
  username: string;
  phone: string;
  whatsapp: string;
  createdAt: string;
  stats: UserStats;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFundDialogOpen, setAddFundDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [addingFund, setAddingFund] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    whatsapp: '',
    password: '',
  });
  const [fundFormData, setFundFormData] = useState({
    amount: '',
    category: 'rabta',
    status: 'approved',
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  // Fetch users on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsers();
    }
  }, [status]);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const result = await response.json();

      if (result.success) {
        setUsers(result.data || []);
      } else {
        console.error('Failed to fetch users:', result.error);
        alert(`Failed to fetch users: ${result.error}`);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert(`Error fetching users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Create new donor
  const createDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.username || !formData.phone || !formData.whatsapp || !formData.password) {
      alert('Please fill in all fields');
      return;
    }

    // Validate username format
    if (!/^[a-z0-9_]+$/.test(formData.username)) {
      alert('Username can only contain lowercase letters, numbers, and underscores');
      return;
    }

    // Validate phone numbers
    const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      alert('Please provide a valid Pakistani phone number');
      return;
    }
    if (!phoneRegex.test(formData.whatsapp)) {
      alert('Please provide a valid WhatsApp number');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role: 'donor',
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Donor created successfully!');
        setAddDialogOpen(false);
        setFormData({
          name: '',
          username: '',
          phone: '',
          whatsapp: '',
          password: '',
        });
        fetchUsers(); // Refresh the list
      } else {
        alert(`Failed to create donor: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating donor:', error);
      alert(`Error creating donor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  // Open Add Fund dialog for a user
  const openAddFundDialog = (user: User) => {
    setSelectedUser(user);
    setFundFormData({ amount: '', category: 'rabta', status: 'approved' });
    setAddFundDialogOpen(true);
  };

  // Open Delete dialog for a user
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Delete user
  const deleteUser = async () => {
    if (!selectedUser) {
      alert('No user selected');
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch('/api/admin/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser._id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`User "${selectedUser.name}" deleted successfully!`);
        setDeleteDialogOpen(false);
        setSelectedUser(null);
        fetchUsers(); // Refresh the list
      } else {
        alert(`Failed to delete user: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Error deleting user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleting(false);
    }
  };

  // Add fund manually
  const addFundManually = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      alert('No user selected');
      return;
    }

    if (!fundFormData.amount || parseFloat(fundFormData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setAddingFund(true);
      const response = await fetch('/api/admin/transactions/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          amount: parseFloat(fundFormData.amount),
          category: fundFormData.category,
          status: fundFormData.status,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const statusText = fundFormData.status === 'pending' ? 'pending pledge' : 'fund';
        alert(`${statusText.charAt(0).toUpperCase() + statusText.slice(1)} added successfully for ${selectedUser.name}!`);
        setAddFundDialogOpen(false);
        setFundFormData({ amount: '', category: 'rabta', status: 'approved' });
        setSelectedUser(null);
        fetchUsers(); // Refresh the list
      } else {
        alert(`Failed to add fund: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding fund:', error);
      alert(`Error adding fund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAddingFund(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query)
    );
  });

  // Download donors report as PDF
  const downloadDonorsReport = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(5, 150, 105); // emerald-700
    doc.text('Rabta-ul-Iman', 14, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Donors Report', 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${currentDate}`, 14, 38);
    doc.text(`Total Donors: ${filteredUsers.length}`, 14, 44);

    // Prepare table data
    const tableData = filteredUsers.map((user, index) => [
      index + 1,
      user.name,
      user.username,
      user.phone,
      user.whatsapp,
      formatCurrency(user.stats.totalContributed),
      user.stats.totalTransactions,
      user.stats.pendingCount,
      formatDate(user.createdAt),
    ]);

    // Add table
    autoTable(doc, {
      startY: 50,
      head: [[
        '#',
        'Name',
        'Username',
        'Phone',
        'WhatsApp',
        'Total Contributed',
        'Transactions',
        'Pending',
        'Joined Date',
      ]],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [5, 150, 105], // emerald-700
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244], // emerald-50
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30, halign: 'right' },
        6: { cellWidth: 20, halign: 'center' },
        7: { cellWidth: 18, halign: 'center' },
        8: { cellWidth: 25 },
      },
      margin: { left: 14, right: 14 },
    });

    // Add summary section
    const finalY = (doc as any).lastAutoTable.finalY || 50;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary:', 14, finalY + 15);
    
    const totalContributions = filteredUsers.reduce((sum, u) => sum + u.stats.totalContributed, 0);
    const totalPending = filteredUsers.reduce((sum, u) => sum + u.stats.pendingCount, 0);
    const totalTransactions = filteredUsers.reduce((sum, u) => sum + u.stats.totalTransactions, 0);
    
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text(`Total Contributions: ${formatCurrency(totalContributions)}`, 14, finalY + 22);
    doc.text(`Total Transactions: ${totalTransactions}`, 14, finalY + 28);
    doc.text(`Total Pending Pledges: ${totalPending}`, 14, finalY + 34);

    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    doc.save(`Donors_Report_${new Date().toISOString().split('T')[0]}.pdf`);
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

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/admin/login');
  };

  // If not authenticated or loading, show nothing
  if (status === 'loading' || status === 'unauthenticated') {
    return null;
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
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">All Donors</h1>
                <p className="text-sm text-slate-600">
                  Manage and view all donor profiles
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={downloadDonorsReport}
                variant="outline"
                className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                disabled={loading || users.length === 0}
              >
                <Download className="h-4 w-4" />
                Download Report
              </Button>
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Donor
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
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
        {/* Stats Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-700" />
              Donor Overview
            </CardTitle>
            <CardDescription>
              Total registered donors and their contribution statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <p className="text-sm text-emerald-700 font-medium">Total Donors</p>
                <p className="text-2xl font-bold text-emerald-900">{filteredUsers.length}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">Total Contributions</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(filteredUsers.reduce((sum, u) => sum + u.stats.totalContributed, 0))}
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700 font-medium">Pending Pledges</p>
                <p className="text-2xl font-bold text-amber-900">
                  {filteredUsers.reduce((sum, u) => sum + u.stats.pendingCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Donors</CardTitle>
            <CardDescription>
              Search by name or username, then view history or add fund manually
            </CardDescription>
            
            {/* Search Input */}
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <p className="text-sm text-slate-600 mt-2">
                  Showing {filteredUsers.length} of {users.length} donors
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-emerald-700" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">
                  {searchQuery ? 'No donors found matching your search' : 'No donors found'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Total Contributed</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-slate-600">@{user.username}</TableCell>
                        <TableCell>
                          <a
                            href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:text-emerald-800 hover:underline"
                          >
                            {user.whatsapp}
                          </a>
                        </TableCell>
                        <TableCell className="font-semibold text-emerald-700">
                          {formatCurrency(user.stats.totalContributed)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-50">
                            {user.stats.totalTransactions}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.stats.pendingCount > 0 ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                              {user.stats.pendingCount}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50">
                              0
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(user)}
                              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAddFundDialog(user)}
                              className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                            >
                              <DollarSign className="h-4 w-4" />
                              Add Fund
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => router.push(`/admin/users/${user._id}`)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View History
                            </Button>
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
      </main>

      {/* Add Donor Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-700" />
              Add New Donor
            </DialogTitle>
            <DialogDescription>
              Create a new donor account. All fields are required.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={createDonor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Muhammad Ahmed"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                maxLength={100}
              />
              <p className="text-xs text-slate-500">Maximum 100 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="e.g., ahmed123"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                required
                minLength={3}
                maxLength={50}
                pattern="^[a-z0-9_]+$"
              />
              <p className="text-xs text-slate-500">
                3-50 characters. Lowercase letters, numbers, and underscores only.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="e.g., 03001234567 or +923001234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                pattern="^(\+92|0)?[0-9]{10}$"
              />
              <p className="text-xs text-slate-500">
                Pakistani format: 03001234567 or +923001234567
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number *</Label>
              <Input
                id="whatsapp"
                placeholder="e.g., 03001234567 or +923001234567"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                required
                pattern="^(\+92|0)?[0-9]{10}$"
              />
              <p className="text-xs text-slate-500">
                Pakistani format: 03001234567 or +923001234567
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
              <p className="text-xs text-slate-500">Minimum 6 characters</p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddDialogOpen(false);
                  setFormData({
                    name: '',
                    username: '',
                    phone: '',
                    whatsapp: '',
                    password: '',
                  });
                }}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Donor
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Fund Dialog */}
      <Dialog open={addFundDialogOpen} onOpenChange={setAddFundDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-700" />
              Add Fund Manually
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Adding fund for <span className="font-semibold text-slate-900">{selectedUser.name}</span> (@{selectedUser.username})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={addFundManually} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={fundFormData.status}
                onValueChange={(value) => setFundFormData({ ...fundFormData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">✅ Approved (Already Paid)</SelectItem>
                  <SelectItem value="pending">⏳ Pending (Promise/Not Paid Yet)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Select "Approved" if payment is received, or "Pending" for promises
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={fundFormData.category}
                onValueChange={(value) => setFundFormData({ ...fundFormData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rabta">Rabta Fund</SelectItem>
                  <SelectItem value="madrassa">Madrassa Fund</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Select whether this is for Rabta or Madrassa fund
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (PKR) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 5000"
                value={fundFormData.amount}
                onChange={(e) => setFundFormData({ ...fundFormData, amount: e.target.value })}
                required
                min="1"
                step="0.01"
              />
              <p className="text-xs text-slate-500">
                Enter the amount in Pakistani Rupees
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Transactions marked as "Approved" will appear in statistics immediately. 
                Transactions marked as "Pending" will show as promises until you change their status to approved.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddFundDialogOpen(false);
                  setFundFormData({ amount: '', category: 'rabta', status: 'approved' });
                  setSelectedUser(null);
                }}
                disabled={addingFund}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800"
                disabled={addingFund}
              >
                {addingFund ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Adding Fund...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Add Fund
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Are you sure you want to delete <span className="font-semibold text-slate-900">{selectedUser.name}</span> (@{selectedUser.username})?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-900 font-semibold mb-2">
                ⚠️ Warning: This action cannot be undone!
              </p>
              <p className="text-sm text-red-800">
                This will permanently delete:
              </p>
              <ul className="text-sm text-red-800 list-disc list-inside mt-2 space-y-1">
                <li>The user account</li>
                <li>All transaction history ({selectedUser?.stats.totalTransactions || 0} transactions)</li>
                <li>All pending pledges ({selectedUser?.stats.pendingCount || 0} pending)</li>
                <li>Total contributions: {selectedUser ? formatCurrency(selectedUser.stats.totalContributed) : 'PKR 0'}</li>
              </ul>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSelectedUser(null);
                }}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={deleteUser}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Yes, Delete User
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
