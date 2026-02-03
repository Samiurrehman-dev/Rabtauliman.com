'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, RefreshCw, ArrowLeft, Search, RotateCcw, Trash } from 'lucide-react';

interface UserStats {
  totalContributed: number;
  pendingCount: number;
  pendingAmount: number;
  totalTransactions: number;
}

interface DeletedUser {
  _id: string;
  name: string;
  username: string;
  phone: string;
  whatsapp: string;
  createdAt: string;
  deletedAt: string;
  stats: UserStats;
}

export default function RecycleBinPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DeletedUser | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  // Fetch deleted users on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchDeletedUsers();
    }
  }, [status]);

  // Fetch deleted users from API
  const fetchDeletedUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users/recycle-bin');
      const result = await response.json();

      if (result.success) {
        setUsers(result.data || []);
      } else {
        console.error('Failed to fetch deleted users:', result.error);
        alert(`Failed to fetch deleted users: ${result.error}`);
      }
    } catch (error) {
      console.error('Error fetching deleted users:', error);
      alert(`Error fetching deleted users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Open Restore dialog for a user
  const openRestoreDialog = (user: DeletedUser) => {
    setSelectedUser(user);
    setRestoreDialogOpen(true);
  };

  // Open Permanent Delete dialog for a user
  const openDeleteDialog = (user: DeletedUser) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Restore user
  const restoreUser = async () => {
    if (!selectedUser) {
      alert('No user selected');
      return;
    }

    try {
      setRestoring(true);
      const response = await fetch('/api/admin/users/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser._id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`User "${selectedUser.name}" restored successfully!`);
        setRestoreDialogOpen(false);
        setSelectedUser(null);
        fetchDeletedUsers(); // Refresh the list
      } else {
        alert(`Failed to restore user: ${result.error}`);
      }
    } catch (error) {
      console.error('Error restoring user:', error);
      alert(`Error restoring user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRestoring(false);
    }
  };

  // Permanently delete user
  const permanentDeleteUser = async () => {
    if (!selectedUser) {
      alert('No user selected');
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch('/api/admin/users/permanent', {
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
        alert(`User "${selectedUser.name}" permanently deleted!`);
        setDeleteDialogOpen(false);
        setSelectedUser(null);
        fetchDeletedUsers(); // Refresh the list
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

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query)
    );
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-emerald-700 mx-auto mb-4" />
          <p className="text-slate-600">Loading recycle bin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/users')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="h-8 w-8 text-red-600" />
                Recycle Bin
              </h1>
              <p className="text-slate-600 mt-1">
                Manage deleted donors - restore or permanently delete
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={fetchDeletedUsers}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Deleted Donors
            </CardTitle>
            <CardDescription>
              {filteredUsers.length} {filteredUsers.length === 1 ? 'donor' : 'donors'} in recycle bin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users Table */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Trash2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg font-medium">
                  {searchQuery ? 'No deleted users found matching your search' : 'Recycle bin is empty'}
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  {searchQuery ? 'Try a different search term' : 'Deleted users will appear here'}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Contributions</TableHead>
                      <TableHead>Deleted Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">@{user.username}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-slate-600">{user.phone}</div>
                            <div className="text-slate-500">{user.whatsapp}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-semibold text-emerald-700">
                              {formatCurrency(user.stats.totalContributed)}
                            </div>
                            <div className="text-slate-500">
                              {user.stats.totalTransactions} transactions
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-slate-600">
                            {formatDate(user.deletedAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRestoreDialog(user)}
                              className="gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Restore
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(user)}
                              className="gap-2 text-red-700 border-red-300 hover:bg-red-50"
                            >
                              <Trash className="h-4 w-4" />
                              Delete Forever
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
      </div>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <RotateCcw className="h-5 w-5" />
              Restore User
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Are you sure you want to restore <span className="font-semibold text-slate-900">{selectedUser.name}</span> (@{selectedUser.username})?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-900 font-semibold mb-2">
                ✓ User will be restored
              </p>
              <p className="text-sm text-emerald-800">
                This will restore:
              </p>
              <ul className="text-sm text-emerald-800 list-disc list-inside mt-2 space-y-1">
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
                  setRestoreDialogOpen(false);
                  setSelectedUser(null);
                }}
                disabled={restoring}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={restoreUser}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
                disabled={restoring}
              >
                {restoring ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Yes, Restore User
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash className="h-5 w-5" />
              Permanently Delete User
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Are you sure you want to permanently delete <span className="font-semibold text-slate-900">{selectedUser.name}</span> (@{selectedUser.username})?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-900 font-semibold mb-2">
                ⚠️ Warning: This action is IRREVERSIBLE!
              </p>
              <p className="text-sm text-red-800">
                This will permanently delete:
              </p>
              <ul className="text-sm text-red-800 list-disc list-inside mt-2 space-y-1">
                <li>The user account (cannot be recovered)</li>
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
                onClick={permanentDeleteUser}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting Forever...
                  </>
                ) : (
                  <>
                    <Trash className="h-4 w-4 mr-2" />
                    Yes, Delete Forever
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
