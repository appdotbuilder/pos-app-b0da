
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProducts } from '../handlers/get_products';

const testProduct1: CreateProductInput = {
  name: 'Test Product 1',
  description: 'First test product',
  price: 19.99,
  stock_quantity: 100,
  sku: 'TEST001',
  barcode: '1234567890123'
};

const testProduct2: CreateProductInput = {
  name: 'Test Product 2', 
  description: null,
  price: 29.50,
  stock_quantity: 50,
  sku: 'TEST002',
  barcode: null
};

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();
    expect(result).toEqual([]);
  });

  it('should return all products from database', async () => {
    // Insert test products directly
    await db.insert(productsTable)
      .values([
        {
          ...testProduct1,
          price: testProduct1.price.toString()
        },
        {
          ...testProduct2,
          price: testProduct2.price.toString()
        }
      ])
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(2);
    
    // Verify first product
    const product1 = result.find(p => p.sku === 'TEST001');
    expect(product1).toBeDefined();
    expect(product1!.name).toEqual('Test Product 1');
    expect(product1!.description).toEqual('First test product');
    expect(product1!.price).toEqual(19.99);
    expect(typeof product1!.price).toBe('number');
    expect(product1!.stock_quantity).toEqual(100);
    expect(product1!.sku).toEqual('TEST001');
    expect(product1!.barcode).toEqual('1234567890123');
    expect(product1!.id).toBeDefined();
    expect(product1!.created_at).toBeInstanceOf(Date);
    expect(product1!.updated_at).toBeInstanceOf(Date);

    // Verify second product
    const product2 = result.find(p => p.sku === 'TEST002');
    expect(product2).toBeDefined();
    expect(product2!.name).toEqual('Test Product 2');
    expect(product2!.description).toBeNull();
    expect(product2!.price).toEqual(29.50);
    expect(typeof product2!.price).toBe('number');
    expect(product2!.stock_quantity).toEqual(50);
    expect(product2!.sku).toEqual('TEST002');
    expect(product2!.barcode).toBeNull();
  });

  it('should handle large number of products', async () => {
    // Insert multiple products
    const products = Array.from({ length: 10 }, (_, i) => ({
      name: `Product ${i + 1}`,
      description: `Description ${i + 1}`,
      price: ((i + 1) * 10.5).toString(),
      stock_quantity: (i + 1) * 5,
      sku: `SKU${String(i + 1).padStart(3, '0')}`,
      barcode: `${String(i + 1).padStart(13, '0')}`
    }));

    await db.insert(productsTable)
      .values(products)
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(10);
    
    // Verify all products have correct numeric conversion
    result.forEach(product => {
      expect(typeof product.price).toBe('number');
      expect(product.price).toBeGreaterThan(0);
      expect(product.id).toBeDefined();
      expect(product.created_at).toBeInstanceOf(Date);
      expect(product.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific product to ensure data integrity
    const product5 = result.find(p => p.sku === 'SKU005');
    expect(product5).toBeDefined();
    expect(product5!.price).toEqual(52.5);
    expect(product5!.stock_quantity).toEqual(25);
  });
});
