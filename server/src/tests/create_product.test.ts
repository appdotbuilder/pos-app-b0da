
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing',
  price: 19.99,
  stock_quantity: 100,
  sku: 'TEST-001',
  barcode: '1234567890123'
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product with all fields', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.description).toEqual('A product for testing');
    expect(result.price).toEqual(19.99);
    expect(typeof result.price).toEqual('number');
    expect(result.stock_quantity).toEqual(100);
    expect(result.sku).toEqual('TEST-001');
    expect(result.barcode).toEqual('1234567890123');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a product with null description and barcode', async () => {
    const inputWithNulls: CreateProductInput = {
      name: 'Simple Product',
      description: null,
      price: 9.99,
      stock_quantity: 50,
      sku: 'SIMPLE-001',
      barcode: null
    };

    const result = await createProduct(inputWithNulls);

    expect(result.name).toEqual('Simple Product');
    expect(result.description).toBeNull();
    expect(result.price).toEqual(9.99);
    expect(result.stock_quantity).toEqual(50);
    expect(result.sku).toEqual('SIMPLE-001');
    expect(result.barcode).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should save product to database', async () => {
    const result = await createProduct(testInput);

    // Query database to verify product was saved
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    expect(savedProduct.name).toEqual('Test Product');
    expect(savedProduct.description).toEqual('A product for testing');
    expect(parseFloat(savedProduct.price)).toEqual(19.99);
    expect(savedProduct.stock_quantity).toEqual(100);
    expect(savedProduct.sku).toEqual('TEST-001');
    expect(savedProduct.barcode).toEqual('1234567890123');
    expect(savedProduct.created_at).toBeInstanceOf(Date);
    expect(savedProduct.updated_at).toBeInstanceOf(Date);
  });

  it('should handle unique SKU constraint violation', async () => {
    // Create first product
    await createProduct(testInput);

    // Try to create another product with same SKU
    const duplicateInput: CreateProductInput = {
      ...testInput,
      name: 'Duplicate Product'
    };

    await expect(createProduct(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should create product with zero stock quantity', async () => {
    const zeroStockInput: CreateProductInput = {
      name: 'Out of Stock Product',
      description: 'Currently out of stock',
      price: 15.99,
      stock_quantity: 0,
      sku: 'OUT-001',
      barcode: null
    };

    const result = await createProduct(zeroStockInput);

    expect(result.stock_quantity).toEqual(0);
    expect(result.name).toEqual('Out of Stock Product');
    expect(result.price).toEqual(15.99);
  });

  it('should handle decimal prices correctly', async () => {
    const decimalInput: CreateProductInput = {
      name: 'Decimal Price Product',
      description: 'Testing decimal precision',
      price: 123.45,
      stock_quantity: 25,
      sku: 'DECIMAL-001',
      barcode: null
    };

    const result = await createProduct(decimalInput);

    expect(result.price).toEqual(123.45);
    expect(typeof result.price).toEqual('number');

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(parseFloat(products[0].price)).toEqual(123.45);
  });
});
