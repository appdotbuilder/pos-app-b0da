
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, customersTable, salesTable, saleItemsTable } from '../db/schema';
import { getSaleWithItems } from '../handlers/get_sale_with_items';

describe('getSaleWithItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return sale with items when sale exists', async () => {
    // Create test data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'cashier1',
        email: 'cashier@test.com',
        password_hash: 'hashed_password',
        role: 'cashier'
      })
      .returning()
      .execute();

    const customerResult = await db.insert(customersTable)
      .values({
        name: 'John Doe',
        email: 'john@test.com',
        phone: '123-456-7890'
      })
      .returning()
      .execute();

    const productResult = await db.insert(productsTable)
      .values([
        {
          name: 'Product 1',
          description: 'Test product 1',
          price: '10.99',
          stock_quantity: 100,
          sku: 'PROD1',
          barcode: '123456789'
        },
        {
          name: 'Product 2',
          description: 'Test product 2',
          price: '15.50',
          stock_quantity: 50,
          sku: 'PROD2',
          barcode: '987654321'
        }
      ])
      .returning()
      .execute();

    const saleResult = await db.insert(salesTable)
      .values({
        customer_id: customerResult[0].id,
        cashier_id: userResult[0].id,
        total_amount: '36.48',
        payment_method: 'card'
      })
      .returning()
      .execute();

    await db.insert(saleItemsTable)
      .values([
        {
          sale_id: saleResult[0].id,
          product_id: productResult[0].id,
          quantity: 2,
          unit_price: '10.99',
          total_price: '21.98'
        },
        {
          sale_id: saleResult[0].id,
          product_id: productResult[1].id,
          quantity: 1,
          unit_price: '15.50',
          total_price: '15.50'
        }
      ])
      .execute();

    // Test the handler
    const result = await getSaleWithItems(saleResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(saleResult[0].id);
    expect(result!.customer_id).toEqual(customerResult[0].id);
    expect(result!.cashier_id).toEqual(userResult[0].id);
    expect(result!.total_amount).toEqual(36.48);
    expect(typeof result!.total_amount).toBe('number');
    expect(result!.payment_method).toEqual('card');
    expect(result!.sale_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);

    expect(result!.items).toHaveLength(2);

    // Check first item
    expect(result!.items[0].sale_id).toEqual(saleResult[0].id);
    expect(result!.items[0].product_id).toEqual(productResult[0].id);
    expect(result!.items[0].quantity).toEqual(2);
    expect(result!.items[0].unit_price).toEqual(10.99);
    expect(typeof result!.items[0].unit_price).toBe('number');
    expect(result!.items[0].total_price).toEqual(21.98);
    expect(typeof result!.items[0].total_price).toBe('number');

    // Check second item
    expect(result!.items[1].sale_id).toEqual(saleResult[0].id);
    expect(result!.items[1].product_id).toEqual(productResult[1].id);
    expect(result!.items[1].quantity).toEqual(1);
    expect(result!.items[1].unit_price).toEqual(15.50);
    expect(typeof result!.items[1].unit_price).toBe('number');
    expect(result!.items[1].total_price).toEqual(15.50);
    expect(typeof result!.items[1].total_price).toBe('number');
  });

  it('should return null when sale does not exist', async () => {
    const result = await getSaleWithItems(999);

    expect(result).toBeNull();
  });

  it('should return sale with empty items array when no items exist', async () => {
    // Create test data without sale items
    const userResult = await db.insert(usersTable)
      .values({
        username: 'cashier1',
        email: 'cashier@test.com',
        password_hash: 'hashed_password',
        role: 'cashier'
      })
      .returning()
      .execute();

    const saleResult = await db.insert(salesTable)
      .values({
        customer_id: null,
        cashier_id: userResult[0].id,
        total_amount: '0.00',
        payment_method: 'cash'
      })
      .returning()
      .execute();

    const result = await getSaleWithItems(saleResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(saleResult[0].id);
    expect(result!.items).toHaveLength(0);
    expect(result!.total_amount).toEqual(0);
    expect(typeof result!.total_amount).toBe('number');
  });
});
