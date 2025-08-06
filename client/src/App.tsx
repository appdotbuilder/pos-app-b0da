
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductManagement } from '@/components/ProductManagement';
import { SalesTransaction } from '@/components/SalesTransaction';
import { UserManagement } from '@/components/UserManagement';
import { SalesReports } from '@/components/SalesReports';
import { LoginForm } from '@/components/LoginForm';
import type { User } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication check - in production this would validate stored tokens
  useEffect(() => {
    // Simulate checking for existing session
    const storedUser = localStorage.getItem('pos-user');
    
    setTimeout(() => {
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser) as User;
          setCurrentUser(user);
        } catch (err) {
          console.error('Invalid stored user data:', err);
          localStorage.removeItem('pos-user');
        }
      }
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pos-user', JSON.stringify(user));
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('pos-user');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading POS System...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">🏪 POS System</h1>
              <Badge variant={isAdmin ? 'default' : 'secondary'}>
                {currentUser.role.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {currentUser.username}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sales" className="flex items-center space-x-2">
              <span>💳</span>
              <span>Sales</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center space-x-2">
              <span>📦</span>
              <span>Products</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <span>📊</span>
              <span>Reports</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <span>👥</span>
                <span>Users</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>💳</span>
                  <span>Sales Transaction</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SalesTransaction currentUser={currentUser} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📦</span>
                  <span>Product Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductManagement canEdit={isAdmin} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📊</span>
                  <span>Sales Reports</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SalesReports 
                  currentUser={currentUser}
                  canViewAllSales={isAdmin} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>👥</span>
                    <span>User Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

export default App;
