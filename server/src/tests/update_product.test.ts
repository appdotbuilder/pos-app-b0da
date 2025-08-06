
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type UpdateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

// Helper to create a test product
const createTestProduct = async (): Promise<number> => {
  const testProduct = {
    name: 'Original Product',
    description: 'Original description',
    price: '29.99',
    stock_quantity: 50,
    sku: 'ORIG-001',
    barcode: '123456789'
  };

  const result = await db.insert(productsTable)
    .values(testProduct)
    .returning()
    .execute();

  return result[0].id;
};

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all product fields', async () => {
    const productId = await createTestProduct();

    const updateInput: UpdateProductInput = {
      id: productId,
      name: 'Updated Product',
      description: 'Updated description',
      price: 39.99,
      stock_quantity: 75,
      sku: 'UPD-001',
      barcode: '987654321'
    };

    const result = await updateProduct(updateInput);

    expect(result.id).toEqual(productId);
    expect(result.name).toEqual('Updated Product');
    expect(result.description).toEqual('Updated description');
    expect(result.price).toEqual(39.99);
    expect(typeof result.price).toEqual('number');
    expect(result.stock_quantity).toEqual(75);
    expect(result.sku).toEqual('UPD-001');
    expect(result.barcode).toEqual('987654321');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const productId = await createTestProduct();

    const updateInput: UpdateProductInput = {
      id: productId,
      name: 'Partial Update',
      price: 19.99
    };

    const result = await updateProduct(updateInput);

    expect(result.name).toEqual('Partial Update');
    expect(result.price).toEqual(19.99);
    expect(result.description).toEqual('Original description');
    expect(result.stock_quantity).toEqual(50);
    expect(result.sku).toEqual('ORIG-001');
    expect(result.barcode).toEqual('123456789');
  });

  it('should save updated product to database', async () => {
    const productId = await createTestProduct();

    const updateInput: UpdateProductInput = {
      id: productId,
      name: 'Database Test',
      price: 24.99
    };

    await updateProduct(updateInput);

    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Database Test');
    expect(parseFloat(products[0].price)).toEqual(24.99);
    expect(products[0].description).toEqual('Original description');
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    const productId = await createTestProduct();

    const updateInput: UpdateProductInput = {
      id: productId,
      description: null,
      barcode: null
    };

    const result = await updateProduct(updateInput);

    expect(result.description).toBeNull();
    expect(result.barcode).toBeNull();
  });

  it('should throw error for non-existent product', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999,
      name: 'Non-existent Product'
    };

    expect(updateProduct(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update the updated_at timestamp', async () => {
    const productId = await createTestProduct();

    // Get original timestamp
    const originalProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    const originalUpdatedAt = originalProduct[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateProductInput = {
      id: productId,
      name: 'Timestamp Test'
    };

    const result = await updateProduct(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
