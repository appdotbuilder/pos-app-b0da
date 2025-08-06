
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { User, UserRole } from '../../../server/src/schema';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Demo users for testing - in production this would validate against real backend
      const demoUsers: Record<string, { id: number; role: UserRole; email: string }> = {
        'admin': { id: 1, role: 'admin', email: 'admin@pos.com' },
        'cashier': { id: 2, role: 'cashier', email: 'cashier@pos.com' },
        'demo': { id: 3, role: 'cashier', email: 'demo@pos.com' }
      };

      const userInfo = demoUsers[username.toLowerCase()];
      if (!userInfo || password !== 'password') {
        throw new Error('Invalid credentials');
      }

      const user: User = {
        id: userInfo.id,
        username: username,
        email: userInfo.email,
        password_hash: '', // Not needed on frontend
        role: userInfo.role,
        created_at: new Date(),
        updated_at: new Date()
      };

      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center space-x-2">
            <span className="text-3xl">🏪</span>
            <span>POS System</span>
          </CardTitle>
          <p className="text-gray-600">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          
          {/* Demo credentials info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-sm mb-2">Demo Credentials:</h3>
            <div className="text-xs space-y-1 text-gray-600">
              <div><strong>Admin:</strong> admin / password</div>
              <div><strong>Cashier:</strong> cashier / password</div>
              <div><strong>Demo:</strong> demo / password</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
