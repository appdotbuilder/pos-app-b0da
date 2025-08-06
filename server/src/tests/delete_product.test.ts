
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, usersTable, salesTable, saleItemsTable, customersTable } from '../db/schema';
import { deleteProduct } from '../handlers/delete_product';
import { eq } from 'drizzle-orm';

describe('deleteProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a product that exists and has no sales', async () => {
    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing',
        price: '19.99',
        stock_quantity: 100,
        sku: 'TEST001',
        barcode: '123456789'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Delete the product
    const result = await deleteProduct(productId);

    expect(result).toBe(true);

    // Verify product was deleted from database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(0);
  });

  it('should return false when trying to delete a product that does not exist', async () => {
    const nonExistentId = 99999;

    const result = await deleteProduct(nonExistentId);

    expect(result).toBe(false);
  });

  it('should throw error when trying to delete a product that has associated sales', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();

    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '123-456-7890'
      })
      .returning()
      .execute();

    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product with Sales',
        description: 'A product that has sales',
        price: '25.50',
        stock_quantity: 50,
        sku: 'TEST002',
        barcode: '987654321'
      })
      .returning()
      .execute();

    // Create a sale
    const saleResult = await db.insert(salesTable)
      .values({
        customer_id: customerResult[0].id,
        cashier_id: userResult[0].id,
        total_amount: '25.50',
        payment_method: 'cash'
      })
      .returning()
      .execute();

    // Create a sale item linking the product to the sale
    await db.insert(saleItemsTable)
      .values({
        sale_id: saleResult[0].id,
        product_id: productResult[0].id,
        quantity: 1,
        unit_price: '25.50',
        total_price: '25.50'
      })
      .execute();

    // Attempt to delete the product should throw an error
    expect(() => deleteProduct(productResult[0].id)).toThrow(/Cannot delete product: product has associated sales/i);

    // Verify product still exists in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productResult[0].id))
      .execute();

    expect(products).toHaveLength(1);
  });

  it('should delete multiple different products successfully', async () => {
    // Create multiple test products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        description: 'First test product',
        price: '10.00',
        stock_quantity: 25,
        sku: 'PROD001',
        barcode: null
      })
      .returning()
      .execute();

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        description: 'Second test product',
        price: '15.00',
        stock_quantity: 30,
        sku: 'PROD002',
        barcode: 'ABC123'
      })
      .returning()
      .execute();

    // Delete both products
    const result1 = await deleteProduct(product1Result[0].id);
    const result2 = await deleteProduct(product2Result[0].id);

    expect(result1).toBe(true);
    expect(result2).toBe(true);

    // Verify both products were deleted
    const remainingProducts = await db.select()
      .from(productsTable)
      .execute();

    expect(remainingProducts).toHaveLength(0);
  });
});
