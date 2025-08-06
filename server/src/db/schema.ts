
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['cashier', 'admin']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'digital']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stock_quantity: integer('stock_quantity').notNull(),
  sku: text('sku').notNull().unique(),
  barcode: text('barcode'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Customers table
export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Sales table
export const salesTable = pgTable('sales', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id'),
  cashier_id: integer('cashier_id').notNull(),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  payment_method: paymentMethodEnum('payment_method').notNull(),
  sale_date: timestamp('sale_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Sale items table
export const saleItemsTable = pgTable('sale_items', {
  id: serial('id').primaryKey(),
  sale_id: integer('sale_id').notNull(),
  product_id: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  total_price: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  sales: many(salesTable)
}));

export const productsRelations = relations(productsTable, ({ many }) => ({
  saleItems: many(saleItemsTable)
}));

export const customersRelations = relations(customersTable, ({ many }) => ({
  sales: many(salesTable)
}));

export const salesRelations = relations(salesTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [salesTable.customer_id],
    references: [customersTable.id]
  }),
  cashier: one(usersTable, {
    fields: [salesTable.cashier_id],
    references: [usersTable.id]
  }),
  items: many(saleItemsTable)
}));

export const saleItemsRelations = relations(saleItemsTable, ({ one }) => ({
  sale: one(salesTable, {
    fields: [saleItemsTable.sale_id],
    references: [salesTable.id]
  }),
  product: one(productsTable, {
    fields: [saleItemsTable.product_id],
    references: [productsTable.id]
  })
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  products: productsTable,
  customers: customersTable,
  sales: salesTable,
  saleItems: saleItemsTable
};
