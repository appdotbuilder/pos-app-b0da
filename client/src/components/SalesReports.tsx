
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { 
  Sale, 
  SalesSummary, 
  BestSellingProduct, 
  InventoryReportItem, 
  User,
  ReportPeriodInput 
} from '../../../server/src/schema';

interface SalesReportsProps {
  currentUser: User;
  canViewAllSales: boolean;
}

export function SalesReports({ currentUser, canViewAllSales }: SalesReportsProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [bestSellingProducts, setBestSellingProducts] = useState<BestSellingProduct[]>([]);
  const [inventoryReport, setInventoryReport] = useState<InventoryReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [dateRange, setDateRange] = useState<{
    start_date: string;
    end_date: string;
  }>({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end_date: new Date().toISOString().split('T')[0] // today
  });

  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  const updateDateRange = useCallback((period: string) => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate: string;

    switch (period) {
      case 'today':
        startDate = endDate;
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        return; // Custom date range, don't update
    }

    setDateRange({ start_date: startDate, end_date: endDate });
    setSelectedPeriod(period);
  }, []);

  const loadSalesData = useCallback(async () => {
    try {
      setIsLoading(true);
      const reportPeriod: ReportPeriodInput = {
        start_date: new Date(dateRange.start_date),
        end_date: new Date(dateRange.end_date)
      };

      const [salesResult, summaryResult, bestSellingResult] = await Promise.all([
        canViewAllSales ? trpc.getSales.query() : trpc.getSalesByCashier.query({ cashierId: currentUser.id }),
        trpc.getSalesSummary.query(reportPeriod),
        trpc.getBestSellingProducts.query(reportPeriod)
      ]);

      setSales(salesResult);
      setSalesSummary(summaryResult);
      setBestSellingProducts(bestSellingResult);
    } catch (err) {
      console.error('Failed to load sales data:', err);
      
      // Sample data for demonstration when backend is not implemented
      const sampleSales: Sale[] = [
        {
          id: 1,
          customer_id: 1,
          cashier_id: currentUser.id,
          total_amount: 28.47,
          payment_method: 'card',
          sale_date: new Date(),
          created_at: new Date()
        },
        {
          id: 2,
          customer_id: null,
          cashier_id: currentUser.id,
          total_amount: 15.99,
          payment_method: 'cash',
          sale_date: new Date(Date.now() - 86400000), // Yesterday
          created_at: new Date(Date.now() - 86400000)
        }
      ];

      const sampleSummary: SalesSummary = {
        total_sales: 2,
        total_amount: 44.46,
        average_sale: 22.23,
        period_start: new Date(dateRange.start_date),
        period_end: new Date(dateRange.end_date)
      };

      const sampleBestSelling: BestSellingProduct[] = [
        {
          product_id: 1,
          product_name: 'Coffee - Premium Blend',
          total_quantity_sold: 15,
          total_revenue: 194.85
        },
        {
          product_id: 2,
          product_name: 'Chocolate Bar',
          total_quantity_sold: 8,
          total_revenue: 28.00
        }
      ];

      setSales(sampleSales);
      setSalesSummary(sampleSummary);
      setBestSellingProducts(sampleBestSelling);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, currentUser.id, canViewAllSales]);

  const loadInventoryReport = useCallback(async () => {
    try {
      const result = await trpc.getInventoryReport.query();
      setInventoryReport(result);
    } catch (err) {
      console.error('Failed to load inventory report:', err);
      
      // Sample inventory data for demonstration
      const sampleInventory: InventoryReportItem[] = [
        {
          product_id: 1,
          product_name: 'Coffee - Premium Blend',
          current_stock: 45,
          sku: 'COFFEE001',
          price: 12.99
        },
        {
          product_id: 2,
          product_name: 'Chocolate Bar',
          current_stock: 120,
          sku: 'CHOC001',
          price: 3.50
        },
        {
          product_id: 3,
          product_name: 'Water Bottle',
          current_stock: 8,
          sku: 'WATER001',
          price: 1.99
        }
      ];
      
      setInventoryReport(sampleInventory);
    }
  }, []);

  useEffect(() => {
    loadSalesData();
    loadInventoryReport();
  }, [loadSalesData, loadInventoryReport]);

  const handleDateRangeChange = useCallback(() => {
    setSelectedPeriod('custom');
    loadSalesData();
  }, [loadSalesData]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Date Range Controls */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <span>📅</span>
            <span>Report Period</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label className="text-sm font-medium">Quick Select</Label>
              <Select value={selectedPeriod} onValueChange={updateDateRange}>
                <SelectTrigger className="h-10 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date</Label>
              <Input
                type="date"
                value={dateRange.start_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDateRange((prev) => ({ ...prev, start_date: e.target.value }))
                }
                className="h-10 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Date</Label>
              <Input
                type="date"
                value={dateRange.end_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDateRange((prev) => ({ ...prev, end_date: e.target.value }))
                }
                className="h-10 text-base"
              />
            </div>
            
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label className="text-sm font-medium opacity-0 pointer-events-none">Update</Label>
              <Button onClick={handleDateRangeChange} disabled={isLoading} className="w-full h-10 text-base">
                {isLoading ? 'Loading...' : 'Update Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="summary" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-1 p-2 sm:p-3 text-xs sm:text-sm">
            <span>📊</span>
            <span>Summary</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-1 p-2 sm:p-3 text-xs sm:text-sm">
            <span>💰</span>
            <span>Sales</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-1 p-2 sm:p-3 text-xs sm:text-sm">
            <span>🏆</span>
            <span className="hidden sm:inline">Best Sellers</span>
            <span className="sm:hidden">Products</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-1 p-2 sm:p-3 text-xs sm:text-sm">
            <span>📦</span>
            <span>Inventory</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Sales Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {salesSummary ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {salesSummary.total_sales}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Total Sales</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      ${salesSummary.total_amount.toFixed(2)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Total Revenue</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">
                      ${salesSummary.average_sale.toFixed(2)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Average Sale</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-orange-600">
                      {Math.ceil((salesSummary.period_end.getTime() - salesSummary.period_start.getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Days</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No summary data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">
                {canViewAllSales ? 'All Sales' : 'My Sales'} ({sales.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {sales.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No sales found for the selected period
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sale ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Customer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sales.map((sale: Sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-mono text-sm">#{sale.id}</TableCell>
                            <TableCell className="text-sm">{sale.sale_date.toLocaleDateString()}</TableCell>
                            <TableCell className="font-semibold text-sm">
                              ${sale.total_amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-sm">
                              <span className="capitalize">{sale.payment_method}</span>
                            </TableCell>
                            <TableCell className="text-sm">
                              {sale.customer_id ? `Customer #${sale.customer_id}` : 'Walk-in'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Mobile Card View */}
                  <div className="sm:hidden space-y-3 p-3">
                    {sales.map((sale: Sale) => (
                      <Card key={sale.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">Sale #{sale.id}</p>
                            <p className="text-xs text-gray-500">{sale.sale_date.toLocaleDateString()}</p>
                          </div>
                          <p className="font-semibold text-green-600">${sale.total_amount.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <div>
                            <span className="text-gray-500">Payment: </span>
                            <span className="capitalize">{sale.payment_method}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Customer: </span>
                            <span>{sale.customer_id ? `#${sale.customer_id}` : 'Walk-in'}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Best Selling Products</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {bestSellingProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No sales data available for the selected period
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity Sold</TableHead>
                          <TableHead>Total Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bestSellingProducts.map((product: BestSellingProduct, index: number) => (
                          <TableRow key={product.product_id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {index === 0 && <span className="text-yellow-500">🥇</span>}
                                {index === 1 && <span className="text-gray-400">🥈</span>}
                                {index === 2 && <span className="text-orange-600">🥉</span>}
                                <span className="font-medium text-sm">{product.product_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{product.total_quantity_sold}</TableCell>
                            <TableCell className="font-semibold text-sm">
                              ${product.total_revenue.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Mobile Card View */}
                  <div className="sm:hidden space-y-3 p-3">
                    {bestSellingProducts.map((product: BestSellingProduct, index: number) => (
                      <Card key={product.product_id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            {index === 0 && <span className="text-yellow-500 text-lg">🥇</span>}
                            {index === 1 && <span className="text-gray-400 text-lg">🥈</span>}
                            {index === 2 && <span className="text-orange-600 text-lg">🥉</span>}
                            {index > 2 && <span className="w-6 h-6 flex items-center justify-center text-sm font-semibold text-gray-500">#{index + 1}</span>}
                            <h3 className="font-medium text-sm leading-tight">{product.product_name}</h3>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-green-600">${product.total_revenue.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">{product.total_quantity_sold} sold</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Current Inventory Levels</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {inventoryReport.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No inventory data available
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Current Stock</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Stock Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryReport.map((item: InventoryReportItem) => {
                          const stockValue = item.current_stock * item.price;
                          const isLowStock = item.current_stock <= 10;
                          const isOutOfStock = item.current_stock === 0;
                          
                          return (
                            <TableRow key={item.product_id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {isOutOfStock && <span className="text-red-500">⚠️</span>}
                                  {isLowStock && !isOutOfStock && <span className="text-yellow-500">⚠️</span>}
                                  <span className="font-medium text-sm">{item.product_name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                              <TableCell>
                                <span className={`text-sm ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : ''}`}>
                                  {item.current_stock}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm">${item.price.toFixed(2)}</TableCell>
                              <TableCell className="font-semibold text-sm">
                                ${stockValue.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Mobile Card View */}
                  <div className="sm:hidden space-y-3 p-3">
                    {inventoryReport.map((item: InventoryReportItem) => {
                      const stockValue = item.current_stock * item.price;
                      const isLowStock = item.current_stock <= 10;
                      const isOutOfStock = item.current_stock === 0;
                      
                      return (
                        <Card key={item.product_id} className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                {isOutOfStock && <span className="text-red-500">⚠️</span>}
                                {isLowStock && !isOutOfStock && <span className="text-yellow-500">⚠️</span>}
                                <div className="min-w-0">
                                  <h3 className="font-medium text-sm leading-tight">{item.product_name}</h3>
                                  <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-semibold text-green-600">${item.price.toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <div>
                                <span className="text-gray-500">Stock: </span>
                                <span className={isOutOfStock ? 'text-red-600 font-medium' : isLowStock ? 'text-yellow-600 font-medium' : ''}>
                                  {item.current_stock}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Value: </span>
                                <span className="font-semibold">${stockValue.toFixed(2)}</span>
                              </div>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
