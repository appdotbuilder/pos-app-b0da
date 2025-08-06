
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, customersTable, salesTable, saleItemsTable } from '../db/schema';
import { type ReportPeriodInput } from '../schema';
import { getBestSellingProducts } from '../handlers/get_best_selling_products';

// Test data setup
const testUser = {
  username: 'testcashier',
  email: 'cashier@test.com',
  password_hash: 'hashedpassword',
  role: 'cashier' as const
};

const testProducts = [
  {
    name: 'Product A',
    description: 'First product',
    price: '10.00',
    stock_quantity: 100,
    sku: 'PROD-A',
    barcode: null
  },
  {
    name: 'Product B',
    description: 'Second product',
    price: '20.00',
    stock_quantity: 50,
    sku: 'PROD-B',
    barcode: null
  },
  {
    name: 'Product C',
    description: 'Third product',
    price: '15.00',
    stock_quantity: 75,
    sku: 'PROD-C',
    barcode: null
  }
];

const testCustomer = {
  name: 'Test Customer',
  email: 'customer@test.com',
  phone: '123-456-7890'
};

describe('getBestSellingProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return best selling products in descending order by quantity', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create test products
    const products = await db.insert(productsTable)
      .values(testProducts)
      .returning()
      .execute();

    // Create test customer
    const [customer] = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    // Use current date for sales to ensure they're within our test range
    const saleDate = new Date();

    // Create sales and sale items with different quantities
    // Sale 1: Product A (5 units), Product B (3 units)
    const [sale1] = await db.insert(salesTable)
      .values({
        customer_id: customer.id,
        cashier_id: user.id,
        total_amount: '110.00', // (5 * 10) + (3 * 20)
        payment_method: 'cash',
        sale_date: saleDate
      })
      .returning()
      .execute();

    await db.insert(saleItemsTable)
      .values([
        {
          sale_id: sale1.id,
          product_id: products[0].id, // Product A
          quantity: 5,
          unit_price: '10.00',
          total_price: '50.00'
        },
        {
          sale_id: sale1.id,
          product_id: products[1].id, // Product B
          quantity: 3,
          unit_price: '20.00',
          total_price: '60.00'
        }
      ])
      .execute();

    // Sale 2: Product B (7 units), Product C (2 units)
    const [sale2] = await db.insert(salesTable)
      .values({
        customer_id: customer.id,
        cashier_id: user.id,
        total_amount: '170.00', // (7 * 20) + (2 * 15)
        payment_method: 'card',
        sale_date: saleDate
      })
      .returning()
      .execute();

    await db.insert(saleItemsTable)
      .values([
        {
          sale_id: sale2.id,
          product_id: products[1].id, // Product B
          quantity: 7,
          unit_price: '20.00',
          total_price: '140.00'
        },
        {
          sale_id: sale2.id,
          product_id: products[2].id, // Product C
          quantity: 2,
          unit_price: '15.00',
          total_price: '30.00'
        }
      ])
      .execute();

    // Test with date range that includes current date
    const startDate = new Date(saleDate);
    startDate.setHours(0, 0, 0, 0); // Start of day
    const endDate = new Date(saleDate);
    endDate.setHours(23, 59, 59, 999); // End of day

    const input: ReportPeriodInput = {
      start_date: startDate,
      end_date: endDate
    };

    const result = await getBestSellingProducts(input);

    expect(result).toHaveLength(3);

    // Should be ordered by total quantity sold descending
    // Product B: 3 + 7 = 10 units
    expect(result[0].product_name).toEqual('Product B');
    expect(result[0].total_quantity_sold).toEqual(10);
    expect(result[0].total_revenue).toEqual(200.00); // 60 + 140

    // Product A: 5 units
    expect(result[1].product_name).toEqual('Product A');
    expect(result[1].total_quantity_sold).toEqual(5);
    expect(result[1].total_revenue).toEqual(50.00);

    // Product C: 2 units
    expect(result[2].product_name).toEqual('Product C');
    expect(result[2].total_quantity_sold).toEqual(2);
    expect(result[2].total_revenue).toEqual(30.00);
  });

  it('should filter sales by date range', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create test product
    const [product] = await db.insert(productsTable)
      .values(testProducts[0])
      .returning()
      .execute();

    // Create test customer
    const [customer] = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    // Create sale within date range
    const [saleInRange] = await db.insert(salesTable)
      .values({
        customer_id: customer.id,
        cashier_id: user.id,
        total_amount: '50.00',
        payment_method: 'cash',
        sale_date: new Date('2024-06-15')
      })
      .returning()
      .execute();

    await db.insert(saleItemsTable)
      .values({
        sale_id: saleInRange.id,
        product_id: product.id,
        quantity: 5,
        unit_price: '10.00',
        total_price: '50.00'
      })
      .execute();

    // Create sale outside date range
    const [saleOutOfRange] = await db.insert(salesTable)
      .values({
        customer_id: customer.id,
        cashier_id: user.id,
        total_amount: '30.00',
        payment_method: 'cash',
        sale_date: new Date('2024-08-15')
      })
      .returning()
      .execute();

    await db.insert(saleItemsTable)
      .values({
        sale_id: saleOutOfRange.id,
        product_id: product.id,
        quantity: 3,
        unit_price: '10.00',
        total_price: '30.00'
      })
      .execute();

    // Test with limited date range
    const input: ReportPeriodInput = {
      start_date: new Date('2024-06-01'),
      end_date: new Date('2024-07-31')
    };

    const result = await getBestSellingProducts(input);

    expect(result).toHaveLength(1);
    expect(result[0].product_name).toEqual('Product A');
    expect(result[0].total_quantity_sold).toEqual(5); // Only the sale within range
    expect(result[0].total_revenue).toEqual(50.00);
  });

  it('should return empty array when no sales in period', async () => {
    const input: ReportPeriodInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getBestSellingProducts(input);

    expect(result).toHaveLength(0);
  });

  it('should handle products with same quantity sold', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create test products
    const products = await db.insert(productsTable)
      .values([testProducts[0], testProducts[1]])
      .returning()
      .execute();

    // Create test customer
    const [customer] = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    // Use current date for sale
    const saleDate = new Date();

    // Create sales with same quantities
    const [sale] = await db.insert(salesTable)
      .values({
        customer_id: customer.id,
        cashier_id: user.id,
        total_amount: '90.00',
        payment_method: 'cash',
        sale_date: saleDate
      })
      .returning()
      .execute();

    await db.insert(saleItemsTable)
      .values([
        {
          sale_id: sale.id,
          product_id: products[0].id, // Product A
          quantity: 3,
          unit_price: '10.00',
          total_price: '30.00'
        },
        {
          sale_id: sale.id,
          product_id: products[1].id, // Product B
          quantity: 3,
          unit_price: '20.00',
          total_price: '60.00'
        }
      ])
      .execute();

    // Test with date range that includes current date
    const startDate = new Date(saleDate);
    startDate.setHours(0, 0, 0, 0); // Start of day
    const endDate = new Date(saleDate);
    endDate.setHours(23, 59, 59, 999); // End of day

    const input: ReportPeriodInput = {
      start_date: startDate,
      end_date: endDate
    };

    const result = await getBestSellingProducts(input);

    expect(result).toHaveLength(2);
    // Both products should have same quantity
    expect(result[0].total_quantity_sold).toEqual(3);
    expect(result[1].total_quantity_sold).toEqual(3);
  });
});
