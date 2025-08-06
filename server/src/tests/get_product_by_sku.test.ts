
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProductBySku } from '../handlers/get_product_by_sku';

// Test product data
const testProduct: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing',
  price: 19.99,
  stock_quantity: 100,
  sku: 'TEST-SKU-123',
  barcode: '1234567890123'
};

describe('getProductBySku', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a product when SKU exists', async () => {
    // Create test product
    await db.insert(productsTable)
      .values({
        name: testProduct.name,
        description: testProduct.description,
        price: testProduct.price.toString(),
        stock_quantity: testProduct.stock_quantity,
        sku: testProduct.sku,
        barcode: testProduct.barcode
      })
      .execute();

    const result = await getProductBySku('TEST-SKU-123');

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Test Product');
    expect(result!.description).toEqual('A product for testing');
    expect(result!.price).toEqual(19.99);
    expect(typeof result!.price).toBe('number');
    expect(result!.stock_quantity).toEqual(100);
    expect(result!.sku).toEqual('TEST-SKU-123');
    expect(result!.barcode).toEqual('1234567890123');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when SKU does not exist', async () => {
    const result = await getProductBySku('NON-EXISTENT-SKU');

    expect(result).toBeNull();
  });

  it('should handle SKU case sensitivity', async () => {
    // Create test product
    await db.insert(productsTable)
      .values({
        name: testProduct.name,
        description: testProduct.description,
        price: testProduct.price.toString(),
        stock_quantity: testProduct.stock_quantity,
        sku: 'UPPER-CASE-SKU',
        barcode: testProduct.barcode
      })
      .execute();

    // SKUs should be case sensitive
    const upperResult = await getProductBySku('UPPER-CASE-SKU');
    const lowerResult = await getProductBySku('upper-case-sku');

    expect(upperResult).not.toBeNull();
    expect(upperResult!.sku).toEqual('UPPER-CASE-SKU');
    expect(lowerResult).toBeNull();
  });

  it('should handle products with null description and barcode', async () => {
    // Create product with null optional fields
    await db.insert(productsTable)
      .values({
        name: 'Minimal Product',
        description: null,
        price: '9.99',
        stock_quantity: 50,
        sku: 'MINIMAL-SKU',
        barcode: null
      })
      .execute();

    const result = await getProductBySku('MINIMAL-SKU');

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Minimal Product');
    expect(result!.description).toBeNull();
    expect(result!.price).toEqual(9.99);
    expect(result!.sku).toEqual('MINIMAL-SKU');
    expect(result!.barcode).toBeNull();
  });
});
