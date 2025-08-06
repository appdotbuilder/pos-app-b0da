
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProductById } from '../handlers/get_product_by_id';

// Test product data
const testProduct: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing',
  price: 29.99,
  stock_quantity: 50,
  sku: 'TEST-001',
  barcode: '1234567890123'
};

describe('getProductById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return product when it exists', async () => {
    // Create a product first
    const insertResult = await db.insert(productsTable)
      .values({
        name: testProduct.name,
        description: testProduct.description,
        price: testProduct.price.toString(),
        stock_quantity: testProduct.stock_quantity,
        sku: testProduct.sku,
        barcode: testProduct.barcode
      })
      .returning()
      .execute();

    const createdProduct = insertResult[0];

    // Fetch the product by ID
    const result = await getProductById(createdProduct.id);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdProduct.id);
    expect(result!.name).toEqual('Test Product');
    expect(result!.description).toEqual(testProduct.description);
    expect(result!.price).toEqual(29.99);
    expect(typeof result!.price).toEqual('number');
    expect(result!.stock_quantity).toEqual(50);
    expect(result!.sku).toEqual('TEST-001');
    expect(result!.barcode).toEqual('1234567890123');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when product does not exist', async () => {
    const result = await getProductById(999);
    expect(result).toBeNull();
  });

  it('should handle numeric price conversion correctly', async () => {
    // Create a product with specific price
    const insertResult = await db.insert(productsTable)
      .values({
        name: 'Price Test Product',
        description: 'Testing price conversion',
        price: '123.45',
        stock_quantity: 10,
        sku: 'PRICE-001',
        barcode: null
      })
      .returning()
      .execute();

    const createdProduct = insertResult[0];

    // Fetch and verify price conversion
    const result = await getProductById(createdProduct.id);

    expect(result).not.toBeNull();
    expect(result!.price).toEqual(123.45);
    expect(typeof result!.price).toEqual('number');
  });

  it('should handle nullable fields correctly', async () => {
    // Create a product with null description and barcode
    const insertResult = await db.insert(productsTable)
      .values({
        name: 'Minimal Product',
        description: null,
        price: '10.00',
        stock_quantity: 5,
        sku: 'MIN-001',
        barcode: null
      })
      .returning()
      .execute();

    const createdProduct = insertResult[0];

    // Fetch the product
    const result = await getProductById(createdProduct.id);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.barcode).toBeNull();
    expect(result!.name).toEqual('Minimal Product');
    expect(result!.price).toEqual(10.00);
  });
});
