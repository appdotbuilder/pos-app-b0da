
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, customersTable, salesTable, saleItemsTable } from '../db/schema';
import { type CreateSaleInput } from '../schema';
import { createSale } from '../handlers/create_sale';
import { eq } from 'drizzle-orm';

describe('createSale', () => {
  let cashierId: number;
  let customerId: number;
  let productId1: number;
  let productId2: number;

  beforeEach(async () => {
    await createDB();

    // Create test cashier
    const cashierResult = await db.insert(usersTable)
      .values({
        username: 'test_cashier',
        email: 'cashier@test.com',
        password_hash: 'hashed_password_123',
        role: 'cashier'
      })
      .returning()
      .execute();
    cashierId = cashierResult[0].id;

    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '123-456-7890'
      })
      .returning()
      .execute();
    customerId = customerResult[0].id;

    // Create test products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Test Product 1',
        description: 'First test product',
        price: '19.99',
        stock_quantity: 100,
        sku: 'TEST001',
        barcode: '1234567890123'
      })
      .returning()
      .execute();
    productId1 = product1Result[0].id;

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Test Product 2',
        description: 'Second test product',
        price: '29.99',
        stock_quantity: 50,
        sku: 'TEST002',
        barcode: '1234567890124'
      })
      .returning()
      .execute();
    productId2 = product2Result[0].id;
  });

  afterEach(resetDB);

  it('should create a sale with customer', async () => {
    const testInput: CreateSaleInput = {
      customer_id: customerId,
      cashier_id: cashierId,
      total_amount: 79.97,
      payment_method: 'card',
      items: [
        {
          product_id: productId1,
          quantity: 2,
          unit_price: 19.99
        },
        {
          product_id: productId2,
          quantity: 1,
          unit_price: 29.99
        }
      ]
    };

    const result = await createSale(testInput);

    // Verify sale fields
    expect(result.customer_id).toEqual(customerId);
    expect(result.cashier_id).toEqual(cashierId);
    expect(result.total_amount).toEqual(79.97);
    expect(result.payment_method).toEqual('card');
    expect(result.id).toBeDefined();
    expect(result.sale_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a sale without customer', async () => {
    const testInput: CreateSaleInput = {
      customer_id: null,
      cashier_id: cashierId,
      total_amount: 19.99,
      payment_method: 'cash',
      items: [
        {
          product_id: productId1,
          quantity: 1,
          unit_price: 19.99
        }
      ]
    };

    const result = await createSale(testInput);

    expect(result.customer_id).toBeNull();
    expect(result.cashier_id).toEqual(cashierId);
    expect(result.total_amount).toEqual(19.99);
    expect(result.payment_method).toEqual('cash');
  });

  it('should save sale and items to database', async () => {
    const testInput: CreateSaleInput = {
      customer_id: customerId,
      cashier_id: cashierId,
      total_amount: 39.98,
      payment_method: 'digital',
      items: [
        {
          product_id: productId1,
          quantity: 2,
          unit_price: 19.99
        }
      ]
    };

    const result = await createSale(testInput);

    // Verify sale in database
    const sales = await db.select()
      .from(salesTable)
      .where(eq(salesTable.id, result.id))
      .execute();

    expect(sales).toHaveLength(1);
    expect(sales[0].customer_id).toEqual(customerId);
    expect(sales[0].cashier_id).toEqual(cashierId);
    expect(parseFloat(sales[0].total_amount)).toEqual(39.98);

    // Verify sale items in database
    const saleItems = await db.select()
      .from(saleItemsTable)
      .where(eq(saleItemsTable.sale_id, result.id))
      .execute();

    expect(saleItems).toHaveLength(1);
    expect(saleItems[0].product_id).toEqual(productId1);
    expect(saleItems[0].quantity).toEqual(2);
    expect(parseFloat(saleItems[0].unit_price)).toEqual(19.99);
    expect(parseFloat(saleItems[0].total_price)).toEqual(39.98);
  });

  it('should update product stock quantities', async () => {
    const testInput: CreateSaleInput = {
      customer_id: customerId,
      cashier_id: cashierId,
      total_amount: 79.97,
      payment_method: 'card',
      items: [
        {
          product_id: productId1,
          quantity: 3,
          unit_price: 19.99
        },
        {
          product_id: productId2,
          quantity: 2,
          unit_price: 29.99
        }
      ]
    };

    await createSale(testInput);

    // Verify stock quantities updated
    const product1 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId1))
      .execute();
    expect(product1[0].stock_quantity).toEqual(97); // 100 - 3

    const product2 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId2))
      .execute();
    expect(product2[0].stock_quantity).toEqual(48); // 50 - 2
  });

  it('should reject sale with non-existent cashier', async () => {
    const testInput: CreateSaleInput = {
      customer_id: customerId,
      cashier_id: 99999,
      total_amount: 19.99,
      payment_method: 'cash',
      items: [
        {
          product_id: productId1,
          quantity: 1,
          unit_price: 19.99
        }
      ]
    };

    await expect(createSale(testInput)).rejects.toThrow(/cashier with id 99999 not found/i);
  });

  it('should reject sale with non-existent customer', async () => {
    const testInput: CreateSaleInput = {
      customer_id: 99999,
      cashier_id: cashierId,
      total_amount: 19.99,
      payment_method: 'cash',
      items: [
        {
          product_id: productId1,
          quantity: 1,
          unit_price: 19.99
        }
      ]
    };

    await expect(createSale(testInput)).rejects.toThrow(/customer with id 99999 not found/i);
  });

  it('should reject sale with non-existent product', async () => {
    const testInput: CreateSaleInput = {
      customer_id: customerId,
      cashier_id: cashierId,
      total_amount: 19.99,
      payment_method: 'cash',
      items: [
        {
          product_id: 99999,
          quantity: 1,
          unit_price: 19.99
        }
      ]
    };

    await expect(createSale(testInput)).rejects.toThrow(/product with id 99999 not found/i);
  });

  it('should reject sale with insufficient stock', async () => {
    const testInput: CreateSaleInput = {
      customer_id: customerId,
      cashier_id: cashierId,
      total_amount: 199.99,
      payment_method: 'cash',
      items: [
        {
          product_id: productId1,
          quantity: 150, // More than available stock of 100
          unit_price: 19.99
        }
      ]
    };

    await expect(createSale(testInput)).rejects.toThrow(/insufficient stock for product id/i);
  });

  it('should handle multiple sale items correctly', async () => {
    const testInput: CreateSaleInput = {
      customer_id: customerId,
      cashier_id: cashierId,
      total_amount: 109.95,
      payment_method: 'card',
      items: [
        {
          product_id: productId1,
          quantity: 3,
          unit_price: 19.99
        },
        {
          product_id: productId2,
          quantity: 1,
          unit_price: 29.99
        },
        {
          product_id: productId1,
          quantity: 1,
          unit_price: 19.99
        }
      ]
    };

    const result = await createSale(testInput);

    // Verify all sale items created
    const saleItems = await db.select()
      .from(saleItemsTable)
      .where(eq(saleItemsTable.sale_id, result.id))
      .execute();

    expect(saleItems).toHaveLength(3);
    
    // Verify product 1 stock reduced by total quantity (3 + 1 = 4)
    const product1 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId1))
      .execute();
    expect(product1[0].stock_quantity).toEqual(96); // 100 - 4
  });
});
