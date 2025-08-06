
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { 
  Product, 
  Customer, 
  CreateSaleInput, 
  CreateCustomerInput, 
  PaymentMethod, 
  User 
} from '../../../server/src/schema';

interface SalesTransactionProps {
  currentUser: User;
}

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export function SalesTransaction({ currentUser }: SalesTransactionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);

  const [newCustomer, setNewCustomer] = useState<CreateCustomerInput>({
    name: '',
    email: null,
    phone: null
  });

  const loadData = useCallback(async () => {
    try {
      const [productsResult, customersResult] = await Promise.all([
        trpc.getProducts.query(),
        trpc.getCustomers.query()
      ]);
      setProducts(productsResult);
      setCustomers(customersResult);
    } catch (err) {
      console.error('Failed to load data:', err);
      // Sample data for demonstration when backend is not implemented
      setProducts([
        {
          id: 1,
          name: 'Coffee - Premium Blend',
          description: 'Rich and aromatic coffee blend',
          price: 12.99,
          stock_quantity: 45,
          sku: 'COFFEE001',
          barcode: '1234567890123',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'Chocolate Bar',
          description: 'Dark chocolate 70% cocoa',
          price: 3.50,
          stock_quantity: 120,
          sku: 'CHOC001',
          barcode: '2345678901234',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          name: 'Water Bottle',
          description: null,
          price: 1.99,
          stock_quantity: 8,
          sku: 'WATER001',
          barcode: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
      setCustomers([
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProducts = products.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    if (product.stock_quantity < quantity) {
      setError('Not enough stock available');
      return;
    }

    setCart((prev: CartItem[]) => {
      const existingItem = prev.find((item: CartItem) => item.product.id === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock_quantity) {
          setError('Not enough stock available');
          return prev;
        }
        return prev.map((item: CartItem) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
                total_price: newQuantity * item.unit_price
              }
            : item
        );
      } else {
        return [...prev, {
          product,
          quantity,
          unit_price: product.price,
          total_price: quantity * product.price
        }];
      }
    });
    setError('');
  }, []);

  const updateCartItemQuantity = useCallback((productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prev: CartItem[]) => prev.filter((item: CartItem) => item.product.id !== productId));
      return;
    }

    const product = products.find((p: Product) => p.id === productId);
    if (product && newQuantity > product.stock_quantity) {
      setError('Not enough stock available');
      return;
    }

    setCart((prev: CartItem[]) =>
      prev.map((item: CartItem) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              total_price: newQuantity * item.unit_price
            }
          : item
      )
    );
    setError('');
  }, [products]);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev: CartItem[]) => prev.filter((item: CartItem) => item.product.id !== productId));
  }, []);

  const calculateTotal = useCallback(() => {
    return cart.reduce((total: number, item: CartItem) => total + item.total_price, 0);
  }, [cart]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customer = await trpc.createCustomer.mutate(newCustomer);
      setCustomers((prev: Customer[]) => [...prev, customer]);
      setSelectedCustomerId(customer.id);
      setNewCustomer({ name: '', email: null, phone: null });
      setIsCustomerDialogOpen(false);
    } catch (err) {
      setError('Failed to create customer');
      console.error('Create customer failed:', err);
    }
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const saleInput: CreateSaleInput = {
        customer_id: selectedCustomerId,
        cashier_id: currentUser.id,
        total_amount: calculateTotal(),
        payment_method: paymentMethod,
        items: cart.map((item: CartItem) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      await trpc.createSale.mutate(saleInput);
      
      // Clear cart and reset form
      setCart([]);
      setSelectedCustomerId(null);
      setPaymentMethod('cash');
      
      // Refresh products to update stock quantities
      await loadData();
      
      alert('Sale completed successfully! 🎉');
    } catch (err) {
      setError('Failed to complete sale');
      console.error('Sale failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Product Selection */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🔍</span>
              <span>Product Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredProducts.map((product: Product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">
                      SKU: {product.sku} | Stock: {product.stock_quantity}
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      ${product.price.toFixed(2)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addToCart(product)}
                    disabled={product.stock_quantity === 0}
                  >
                    {product.stock_quantity === 0 ? 'Out of Stock' : '➕ Add'}
                  </Button>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No products found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart and Checkout */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🛒</span>
              <span>Shopping Cart</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Cart is empty
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item: CartItem) => (
                        <TableRow key={item.product.id}>
                          <TableCell>
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-sm text-gray-500">{item.product.sku}</div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              max={item.product.stock_quantity}
                              value={item.quantity}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateCartItemQuantity(item.product.id, parseInt(e.target.value) || 0)
                              }
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                          <TableCell>${item.total_price.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              ✕
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="border-t pt-4">
                  <div className="text-xl font-bold text-right">
                    Total: ${calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checkout Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>💳</span>
              <span>Checkout</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer (Optional)</Label>
              <div className="flex space-x-2">
                <Select
                  value={selectedCustomerId?.toString() || 'none'}
                  onValueChange={(value: string) => setSelectedCustomerId(value === 'none' ? null : parseInt(value))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select customer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No customer (Walk-in)</SelectItem>
                    {customers.map((customer: Customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      ➕ New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCustomer} className="space-y-4">
                      <div>
                        <Label htmlFor="customer-name">Name</Label>
                        <Input
                          id="customer-name"
                          value={newCustomer.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewCustomer((prev: CreateCustomerInput) => ({ ...prev, name: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer-email">Email</Label>
                        <Input
                          id="customer-email"
                          type="email"
                          value={newCustomer.email || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewCustomer((prev: CreateCustomerInput) => ({ ...prev, email: e.target.value || null }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer-phone">Phone</Label>
                        <Input
                          id="customer-phone"
                          value={newCustomer.phone || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewCustomer((prev: CreateCustomerInput) => ({ ...prev, phone: e.target.value || null }))
                          }
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Add Customer</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Cash</SelectItem>
                  <SelectItem value="card">💳 Card</SelectItem>
                  <SelectItem value="digital">📱 Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Processing...' : `Complete Sale - $${calculateTotal().toFixed(2)}`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
