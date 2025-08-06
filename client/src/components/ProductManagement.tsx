
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import type { Product, CreateProductInput, UpdateProductInput } from '../../../server/src/schema';

interface ProductManagementProps {
  canEdit: boolean;
}

export function ProductManagement({ canEdit }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateProductInput>({
    name: '',
    description: null,
    price: 0,
    stock_quantity: 0,
    sku: '',
    barcode: null
  });

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getProducts.query();
      setProducts(result);
    } catch (err) {
      setError('Failed to load products');
      console.error('Failed to load products:', err);
      // When API is not implemented, show sample data for demonstration
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = products.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: null,
      price: 0,
      stock_quantity: 0,
      sku: '',
      barcode: null
    });
    setEditingProduct(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (editingProduct) {
        const updateData: UpdateProductInput = {
          id: editingProduct.id,
          ...formData
        };
        const updated = await trpc.updateProduct.mutate(updateData);
        setProducts((prev: Product[]) =>
          prev.map((p: Product) => p.id === editingProduct.id ? updated : p)
        );
      } else {
        const created = await trpc.createProduct.mutate(formData);
        setProducts((prev: Product[]) => [...prev, created]);
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      setError(editingProduct ? 'Failed to update product' : 'Failed to create product');
      console.error('Product operation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock_quantity: product.stock_quantity,
      sku: product.sku,
      barcode: product.barcode
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      setIsLoading(true);
      await trpc.deleteProduct.mutate({ id: productId });
      setProducts((prev: Product[]) => prev.filter((p: Product) => p.id !== productId));
    } catch (err) {
      setError('Failed to delete product');
      console.error('Delete failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (quantity <= 10) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 h-10 sm:h-9 text-base"
          />
        </div>
        
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="w-full sm:w-auto h-10 sm:h-9">
                <span className="sm:hidden">➕ Add</span>
                <span className="hidden sm:inline">➕ Add Product</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name" className="text-sm font-medium">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateProductInput) => ({ ...prev, name: e.target.value }))
                      }
                      className="h-10 text-base"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sku" className="text-sm font-medium">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateProductInput) => ({ ...prev, sku: e.target.value }))
                      }
                      className="h-10 text-base"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateProductInput) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                      }
                      className="h-10 text-base"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="stock_quantity" className="text-sm font-medium">Stock Quantity</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateProductInput) => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))
                      }
                      className="h-10 text-base"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateProductInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    rows={3}
                    className="text-base resize-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="barcode" className="text-sm font-medium">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateProductInput) => ({
                        ...prev,
                        barcode: e.target.value || null
                      }))
                    }
                    className="h-10 text-base"
                  />
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
                    {isLoading ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {searchTerm ? 'No products found matching your search.' : 'No products available.'}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      {canEdit && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product: Product) => {
                      const stockStatus = getStockStatus(product.stock_quantity);
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.description && (
                                <div className="text-sm text-gray-500">{product.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell>${product.price.toFixed(2)}</TableCell>
                          <TableCell>{product.stock_quantity}</TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.variant}>
                              {stockStatus.label}
                            </Badge>
                          </TableCell>
                          {canEdit && (
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(product)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(product.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3 p-3">
                {filteredProducts.map((product: Product) => {
                  const stockStatus = getStockStatus(product.stock_quantity);
                  return (
                    <Card key={product.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm leading-tight">{product.name}</h3>
                            {product.description && (
                              <p className="text-xs text-gray-500 mt-1">{product.description}</p>
                            )}
                          </div>
                          <Badge variant={stockStatus.variant} className="text-xs ml-2 shrink-0">
                            {stockStatus.label}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">SKU: </span>
                            <span className="font-mono text-xs">{product.sku}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Stock: </span>
                            <span>{product.stock_quantity}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-green-600">
                            ${product.price.toFixed(2)}
                          </span>
                          {canEdit && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(product)}
                                className="text-xs h-8 px-3"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(product.id)}
                                className="text-xs h-8 px-3"
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
