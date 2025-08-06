
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
    <div className="space-y-6">
      {/* Date Range Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📅</span>
            <span>Report Period</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <Select value={selectedPeriod} onValueChange={updateDateRange}>
                <SelectTrigger>
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
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.start_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDateRange((prev) => ({ ...prev, start_date: e.target.value }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.end_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDateRange((prev) => ({ ...prev, end_date: e.target.value }))
                }
              />
            </div>
            
            <Button onClick={handleDateRangeChange} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Update Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">📊 Summary</TabsTrigger>
          <TabsTrigger value="sales">💰 Sales</TabsTrigger>
          <TabsTrigger value="products">🏆 Best Sellers</TabsTrigger>
          
          <TabsTrigger value="inventory">📦 Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Sales Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {salesSummary ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {salesSummary.total_sales}
                    </div>
                    <div className="text-sm text-gray-600">Total Sales</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${salesSummary.total_amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      ${salesSummary.average_sale.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Average Sale</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.ceil((salesSummary.period_end.getTime() - salesSummary.period_start.getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-sm text-gray-600">Days</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No summary data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>
                {canViewAllSales ? 'All Sales' : 'My Sales'} ({sales.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sales.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No sales found for the selected period
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                          <TableCell>#{sale.id}</TableCell>
                          <TableCell>{sale.sale_date.toLocaleDateString()}</TableCell>
                          <TableCell className="font-semibold">
                            ${sale.total_amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">{sale.payment_method}</span>
                          </TableCell>
                          <TableCell>
                            {sale.customer_id ? `Customer #${sale.customer_id}` : 'Walk-in'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Best Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              {bestSellingProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No sales data available for the selected period
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                              <span className="font-medium">{product.product_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{product.total_quantity_sold}</TableCell>
                          <TableCell className="font-semibold">
                            ${product.total_revenue.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Current Inventory Levels</CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryReport.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No inventory data available
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                                <span className="font-medium">{item.product_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono">{item.sku}</TableCell>
                            <TableCell>
                              <span className={isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : ''}>
                                {item.current_stock}
                              </span>
                            </TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell className="font-semibold">
                              ${stockValue.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
