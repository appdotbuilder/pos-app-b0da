
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salesTable, usersTable, customersTable } from '../db/schema';
import { getSales } from '../handlers/get_sales';

describe('getSales', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no sales exist', async () => {
    const result = await getSales();
    expect(result).toEqual([]);
  });

  it('should fetch all sales', async () => {
    // Create test cashier
    const [cashier] = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();

    // Create test customer
    const [customer] = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '123-456-7890'
      })
      .returning()
      .execute();

    // Create sales with different dates to ensure predictable ordering
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier

    // Create test sales (earlier sale first)
    await db.insert(salesTable)
      .values({
        customer_id: customer.id,
        cashier_id: cashier.id,
        total_amount: '29.99',
        payment_method: 'cash',
        sale_date: earlier
      })
      .execute();

    // Create second sale (more recent)
    await db.insert(salesTable)
      .values({
        customer_id: customer.id,
        cashier_id: cashier.id,
        total_amount: '15.50',
        payment_method: 'card',
        sale_date: now
      })
      .execute();

    const result = await getSales();

    expect(result).toHaveLength(2);
    expect(result[0].total_amount).toEqual(15.50); // Most recent first (desc order)
    expect(result[1].total_amount).toEqual(29.99);
    expect(typeof result[0].total_amount).toBe('number');
    expect(result[0].cashier_id).toEqual(cashier.id);
    expect(result[0].customer_id).toEqual(customer.id);
    expect(result[0].payment_method).toEqual('card');
    expect(result[0].sale_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter by date range', async () => {
    // Create test cashier
    const [cashier] = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();

    // Create sales on different dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Insert sale for yesterday
    await db.insert(salesTable)
      .values({
        cashier_id: cashier.id,
        total_amount: '10.00',
        payment_method: 'cash',
        sale_date: yesterday
      })
      .execute();

    // Insert sale for today
    await db.insert(salesTable)
      .values({
        cashier_id: cashier.id,
        total_amount: '20.00',
        payment_method: 'card',
        sale_date: today
      })
      .execute();

    // Filter for today only
    const result = await getSales({
      start_date: today,
      end_date: tomorrow
    });

    expect(result).toHaveLength(1);
    expect(result[0].total_amount).toEqual(20.00);
    expect(result[0].sale_date >= today).toBe(true);
  });

  it('should filter by cashier', async () => {
    // Create test cashiers
    const [cashier1] = await db.insert(usersTable)
      .values({
        username: 'cashier1',
        email: 'cashier1@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();

    const [cashier2] = await db.insert(usersTable)
      .values({
        username: 'cashier2',
        email: 'cashier2@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();

    // Create sales for different cashiers
    await db.insert(salesTable)
      .values([
        {
          cashier_id: cashier1.id,
          total_amount: '100.00',
          payment_method: 'cash'
        },
        {
          cashier_id: cashier2.id,
          total_amount: '200.00',
          payment_method: 'card'
        }
      ])
      .execute();

    const result = await getSales({ cashier_id: cashier1.id });

    expect(result).toHaveLength(1);
    expect(result[0].cashier_id).toEqual(cashier1.id);
    expect(result[0].total_amount).toEqual(100.00);
  });

  it('should apply pagination', async () => {
    // Create test cashier
    const [cashier] = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();

    // Create multiple sales with different timestamps to ensure predictable ordering
    const baseTime = new Date();
    const salesData = Array.from({ length: 5 }, (_, i) => ({
      cashier_id: cashier.id,
      total_amount: `${(i + 1) * 10}.00`,
      payment_method: 'cash' as const,
      sale_date: new Date(baseTime.getTime() + i * 1000) // Each sale 1 second apart
    }));

    await db.insert(salesTable)
      .values(salesData)
      .execute();

    // Test pagination
    const page1 = await getSales({ limit: 2, offset: 0 });
    const page2 = await getSales({ limit: 2, offset: 2 });

    expect(page1).toHaveLength(2);
    expect(page2).toHaveLength(2);
    expect(page1[0].id).not.toEqual(page2[0].id);
  });

  it('should filter by payment method', async () => {
    // Create test cashier
    const [cashier] = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();

    // Create sales with different payment methods
    await db.insert(salesTable)
      .values([
        {
          cashier_id: cashier.id,
          total_amount: '50.00',
          payment_method: 'cash'
        },
        {
          cashier_id: cashier.id,
          total_amount: '75.00',
          payment_method: 'card'
        },
        {
          cashier_id: cashier.id,
          total_amount: '25.00',
          payment_method: 'digital'
        }
      ])
      .execute();

    const result = await getSales({ payment_method: 'card' });

    expect(result).toHaveLength(1);
    expect(result[0].payment_method).toEqual('card');
    expect(result[0].total_amount).toEqual(75.00);
  });

  it('should combine multiple filters', async () => {
    // Create test cashier
    const [cashier] = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Create sales with different combinations
    await db.insert(salesTable)
      .values([
        {
          cashier_id: cashier.id,
          total_amount: '100.00',
          payment_method: 'cash',
          sale_date: today
        },
        {
          cashier_id: cashier.id,
          total_amount: '200.00',
          payment_method: 'card',
          sale_date: today
        },
        {
          cashier_id: cashier.id,
          total_amount: '150.00',
          payment_method: 'cash',
          sale_date: yesterday
        }
      ])
      .execute();

    const result = await getSales({
      cashier_id: cashier.id,
      payment_method: 'cash',
      start_date: today
    });

    expect(result).toHaveLength(1);
    expect(result[0].payment_method).toEqual('cash');
    expect(result[0].total_amount).toEqual(100.00);
    expect(result[0].sale_date >= today).toBe(true);
  });
});
