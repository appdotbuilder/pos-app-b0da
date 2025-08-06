
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getInventoryReport } from '../handlers/get_inventory_report';

const testProduct1: CreateProductInput = {
  name: 'Test Product 1',
  description: 'First test product',
  price: 19.99,
  stock_quantity: 50,
  sku: 'TEST001',
  barcode: '123456789'
};

const testProduct2: CreateProductInput = {
  name: 'Test Product 2',
  description: 'Second test product',
  price: 29.99,
  stock_quantity: 0,
  sku: 'TEST002',
  barcode: null
};

const testProduct3: CreateProductInput = {
  name: 'Test Product 3',
  description: null,
  price: 15.50,
  stock_quantity: 100,
  sku: 'TEST003',
  barcode: '987654321'
};

describe('getInventoryReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getInventoryReport();
    expect(result).toEqual([]);
  });

  it('should return inventory report for all products', async () => {
    // Create test products
    await db.insert(productsTable).values([
      {
        name: testProduct1.name,
        description: testProduct1.description,
        price: testProduct1.price.toString(),
        stock_quantity: testProduct1.stock_quantity,
        sku: testProduct1.sku,
        barcode: testProduct1.barcode
      },
      {
        name: testProduct2.name,
        description: testProduct2.description,
        price: testProduct2.price.toString(),
        stock_quantity: testProduct2.stock_quantity,
        sku: testProduct2.sku,
        barcode: testProduct2.barcode
      }
    ]).execute();

    const result = await getInventoryReport();

    expect(result).toHaveLength(2);
    
    // Verify first product
    const product1 = result.find(p => p.sku === 'TEST001');
    expect(product1).toBeDefined();
    expect(product1?.product_name).toEqual('Test Product 1');
    expect(product1?.current_stock).toEqual(50);
    expect(product1?.price).toEqual(19.99);
    expect(typeof product1?.price).toBe('number');
    expect(product1?.product_id).toBeDefined();

    // Verify second product (out of stock)
    const product2 = result.find(p => p.sku === 'TEST002');
    expect(product2).toBeDefined();
    expect(product2?.product_name).toEqual('Test Product 2');
    expect(product2?.current_stock).toEqual(0);
    expect(product2?.price).toEqual(29.99);
    expect(typeof product2?.price).toBe('number');
  });

  it('should handle products with different stock levels', async () => {
    // Create products with varying stock levels
    await db.insert(productsTable).values([
      {
        name: testProduct1.name,
        description: testProduct1.description,
        price: testProduct1.price.toString(),
        stock_quantity: testProduct1.stock_quantity,
        sku: testProduct1.sku,
        barcode: testProduct1.barcode
      },
      {
        name: testProduct3.name,
        description: testProduct3.description,
        price: testProduct3.price.toString(),
        stock_quantity: testProduct3.stock_quantity,
        sku: testProduct3.sku,
        barcode: testProduct3.barcode
      }
    ]).execute();

    const result = await getInventoryReport();

    expect(result).toHaveLength(2);
    
    // Verify products are returned with correct stock levels
    const stocks = result.map(p => p.current_stock).sort((a, b) => a - b);
    expect(stocks).toEqual([50, 100]);
    
    // Verify all required fields are present and properly typed
    result.forEach(item => {
      expect(item.product_id).toBeDefined();
      expect(typeof item.product_id).toBe('number');
      expect(item.product_name).toBeDefined();
      expect(typeof item.product_name).toBe('string');
      expect(item.current_stock).toBeDefined();
      expect(typeof item.current_stock).toBe('number');
      expect(item.sku).toBeDefined();
      expect(typeof item.sku).toBe('string');
      expect(item.price).toBeDefined();
      expect(typeof item.price).toBe('number');
    });
  });

  it('should handle products with null descriptions', async () => {
    // Create product with null description
    await db.insert(productsTable).values({
      name: testProduct3.name,
      description: testProduct3.description, // null
      price: testProduct3.price.toString(),
      stock_quantity: testProduct3.stock_quantity,
      sku: testProduct3.sku,
      barcode: testProduct3.barcode
    }).execute();

    const result = await getInventoryReport();

    expect(result).toHaveLength(1);
    expect(result[0].product_name).toEqual('Test Product 3');
    expect(result[0].current_stock).toEqual(100);
    expect(result[0].price).toEqual(15.50);
    expect(result[0].sku).toEqual('TEST003');
  });
});
