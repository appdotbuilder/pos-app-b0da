
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
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">🏪 <span className="hidden sm:inline">POS System</span><span className="sm:hidden">POS</span></h1>
              <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-xs">
                {currentUser.role.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                Welcome, {currentUser.username}
              </span>
              <span className="text-xs text-gray-600 sm:hidden">
                {currentUser.username}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs sm:text-sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-3 sm:py-6 px-3 sm:px-6 lg:px-8">
        <Tabs defaultValue="sales" className="space-y-4 sm:space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="sales" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3">
              <span className="text-base sm:text-lg">💳</span>
              <span className="text-xs sm:text-sm">Sales</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3">
              <span className="text-base sm:text-lg">📦</span>
              <span className="text-xs sm:text-sm">Products</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3">
              <span className="text-base sm:text-lg">📊</span>
              <span className="text-xs sm:text-sm">Reports</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3">
                <span className="text-base sm:text-lg">👥</span>
                <span className="text-xs sm:text-sm">Users</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="sales" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <span>💳</span>
                  <span className="hidden sm:inline">Sales Transaction</span>
                  <span className="sm:hidden">Sales</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <SalesTransaction currentUser={currentUser} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <span>📦</span>
                  <span className="hidden sm:inline">Product Management</span>
                  <span className="sm:hidden">Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ProductManagement canEdit={isAdmin} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <span>📊</span>
                  <span className="hidden sm:inline">Sales Reports</span>
                  <span className="sm:hidden">Reports</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <SalesReports 
                  currentUser={currentUser}
                  canViewAllSales={isAdmin} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                    <span>👥</span>
                    <span className="hidden sm:inline">User Management</span>
                    <span className="sm:hidden">Users</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
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
