
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput, UpdateUserInput, UserRole } from '../../../server/src/schema';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateUserInput>({
    username: '',
    email: '',
    password: '',
    role: 'cashier'
  });

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (err) {
      setError('Failed to load users');
      console.error('Failed to load users:', err);
      // Sample data for demonstration when backend is not implemented
      setUsers([
        {
          id: 1,
          username: 'admin',
          email: 'admin@pos.com',
          password_hash: '', // Not shown on frontend
          role: 'admin',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          username: 'cashier1',
          email: 'cashier1@pos.com',
          password_hash: '',
          role: 'cashier',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          username: 'cashier2',
          email: 'cashier2@pos.com',
          password_hash: '',
          role: 'cashier',
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const resetForm = useCallback(() => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'cashier'
    });
    setEditingUser(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (editingUser) {
        const updateData: UpdateUserInput = {
          id: editingUser.id,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          // Only include password if it's provided
          ...(formData.password && { password: formData.password })
        };
        const updated = await trpc.updateUser.mutate(updateData);
        setUsers((prev: User[]) =>
          prev.map((u: User) => u.id === editingUser.id ? updated : u)
        );
      } else {
        const created = await trpc.createUser.mutate(formData);
        setUsers((prev: User[]) => [...prev, created]);
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      setError(editingUser ? 'Failed to update user' : 'Failed to create user');
      console.error('User operation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = useCallback((user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Don't populate password for security
      role: user.role
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      setIsLoading(true);
      await trpc.deleteUser.mutate({ id: userId });
      setUsers((prev: User[]) => prev.filter((u: User) => u.id !== userId));
    } catch (err) {
      setError('Failed to delete user');
      console.error('Delete failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
        <h2 className="text-base sm:text-lg font-semibold">System Users</h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="w-full sm:w-auto h-10">
              <span className="sm:hidden">➕ Add</span>
              <span className="hidden sm:inline">➕ Add User</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {editingUser ? 'Edit User' : 'Add New User'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                  }
                  className="h-10 text-base"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                  }
                  className="h-10 text-base"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                  }
                  className="h-10 text-base"
                  required={!editingUser}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">Role</Label>
                <Select
                  value={formData.role || 'cashier'}
                  onValueChange={(value: UserRole) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger className="h-10 text-base">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-10 text-base"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="h-10 text-base">
                  {isLoading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0 sm:p-6">
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No users available.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-sm">{user.username}</TableCell>
                        <TableCell className="text-sm">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                            {user.role.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{user.created_at.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(user)}
                              className="text-xs"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(user.id)}
                              className="text-xs"
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3 p-3">
                {users.map((user: User) => (
                  <Card key={user.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm leading-tight">{user.username}</h3>
                          <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                          <p className="text-xs text-gray-500 mt-1">Created: {user.created_at.toLocaleDateString()}</p>
                        </div>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs ml-2 shrink-0">
                          {user.role.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(user)}
                          className="flex-1 text-xs h-8"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(user.id)}
                          className="flex-1 text-xs h-8"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
