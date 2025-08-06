
import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['cashier', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Payment method enum
export const paymentMethodSchema = z.enum(['cash', 'card', 'digital']);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

// User schemas
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  role: userRoleSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: userRoleSchema
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: userRoleSchema.optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Product schemas
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  stock_quantity: z.number().int(),
  sku: z.string(),
  barcode: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  price: z.number().positive(),
  stock_quantity: z.number().int().nonnegative(),
  sku: z.string().min(1).max(100),
  barcode: z.string().nullable()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  sku: z.string().min(1).max(100).optional(),
  barcode: z.string().nullable().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Customer schemas
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

export const createCustomerInputSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().nullable(),
  phone: z.string().nullable()
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

// Sale schemas
export const saleSchema = z.object({
  id: z.number(),
  customer_id: z.number().nullable(),
  cashier_id: z.number(),
  total_amount: z.number(),
  payment_method: paymentMethodSchema,
  sale_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Sale = z.infer<typeof saleSchema>;

export const createSaleInputSchema = z.object({
  customer_id: z.number().nullable(),
  cashier_id: z.number(),
  total_amount: z.number().positive(),
  payment_method: paymentMethodSchema,
  items: z.array(z.object({
    product_id: z.number(),
    quantity: z.number().int().positive(),
    unit_price: z.number().positive()
  })).min(1)
});

export type CreateSaleInput = z.infer<typeof createSaleInputSchema>;

// Sale item schemas
export const saleItemSchema = z.object({
  id: z.number(),
  sale_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  unit_price: z.number(),
  total_price: z.number(),
  created_at: z.coerce.date()
});

export type SaleItem = z.infer<typeof saleItemSchema>;

// Report schemas
export const salesSummarySchema = z.object({
  total_sales: z.number(),
  total_amount: z.number(),
  average_sale: z.number(),
  period_start: z.coerce.date(),
  period_end: z.coerce.date()
});

export type SalesSummary = z.infer<typeof salesSummarySchema>;

export const bestSellingProductSchema = z.object({
  product_id: z.number(),
  product_name: z.string(),
  total_quantity_sold: z.number(),
  total_revenue: z.number()
});

export type BestSellingProduct = z.infer<typeof bestSellingProductSchema>;

export const inventoryReportItemSchema = z.object({
  product_id: z.number(),
  product_name: z.string(),
  current_stock: z.number(),
  sku: z.string(),
  price: z.number()
});

export type InventoryReportItem = z.infer<typeof inventoryReportItemSchema>;

// Input schemas for reports
export const reportPeriodInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type ReportPeriodInput = z.infer<typeof reportPeriodInputSchema>;
