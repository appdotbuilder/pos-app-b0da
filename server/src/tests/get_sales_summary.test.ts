
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, customersTable, salesTable } from '../db/schema';
import { type ReportPeriodInput } from '../schema';
import { getSalesSummary } from '../handlers/get_sales_summary';

// Test input for date range
const testPeriod: ReportPeriodInput = {
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-31')
};

describe('getSalesSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero values when no sales exist', async () => {
    const result = await getSalesSummary(testPeriod);

    expect(result.total_sales).toEqual(0);
    expect(result.total_amount).toEqual(0);
    expect(result.average_sale).toEqual(0);
    expect(result.period_start).toEqual(testPeriod.start_date);
    expect(result.period_end).toEqual(testPeriod.end_date);
  });

  it('should calculate sales summary for period with sales', async () => {
    // Create prerequisite data
    const [cashier] = await db.insert(usersTable)
      .values({
        username: 'cashier1',
        email: 'cashier@test.com',
        password_hash: 'hash123',
        role: 'cashier'
      })
      .returning()
      .execute();

    const [customer] = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '123-456-7890'
      })
      .returning()
      .execute();

    // Create test sales within the period
    await db.insert(salesTable)
      .values([
        {
          customer_id: customer.id,
          cashier_id: cashier.id,
          total_amount: '100.50',
          payment_method: 'cash',
          sale_date: new Date('2024-01-15')
        },
        {
          customer_id: customer.id,
          cashier_id: cashier.id,
          total_amount: '250.75',
          payment_method: 'card',
          sale_date: new Date('2024-01-20')
        },
        {
          customer_id: null, // Anonymous sale
          cashier_id: cashier.id,
          total_amount: '75.25',
          payment_method: 'digital',
          sale_date: new Date('2024-01-25')
        }
      ])
      .execute();

    const result = await getSalesSummary(testPeriod);

    expect(result.total_sales).toEqual(3);
    expect(result.total_amount).toBeCloseTo(426.50, 2);
    expect(result.average_sale).toBeCloseTo(142.17, 2);
    expect(result.period_start).toEqual(testPeriod.start_date);
    expect(result.period_end).toEqual(testPeriod.end_date);
  });

  it('should exclude sales outside the date range', async () => {
    // Create cashier
    const [cashier] = await db.insert(usersTable)
      .values({
        username: 'cashier1',
        email: 'cashier@test.com',
        password_hash: 'hash123',
        role: 'cashier'
      })
      .returning()
      .execute();

    // Create sales - some inside, some outside the period
    await db.insert(salesTable)
      .values([
        {
          customer_id: null,
          cashier_id: cashier.id,
          total_amount: '100.00',
          payment_method: 'cash',
          sale_date: new Date('2023-12-31') // Before period
        },
        {
          customer_id: null,
          cashier_id: cashier.id,
          total_amount: '200.00',
          payment_method: 'card',
          sale_date: new Date('2024-01-15') // Inside period
        },
        {
          customer_id: null,
          cashier_id: cashier.id,
          total_amount: '300.00',
          payment_method: 'digital',
          sale_date: new Date('2024-02-01') // After period
        }
      ])
      .execute();

    const result = await getSalesSummary(testPeriod);

    // Only the middle sale should be included
    expect(result.total_sales).toEqual(1);
    expect(result.total_amount).toBeCloseTo(200.00, 2);
    expect(result.average_sale).toBeCloseTo(200.00, 2);
  });

  it('should handle boundary dates correctly', async () => {
    // Create cashier
    const [cashier] = await db.insert(usersTable)
      .values({
        username: 'cashier1',
        email: 'cashier@test.com',
        password_hash: 'hash123',
        role: 'cashier'
      })
      .returning()
      .execute();

    // Create sales exactly on boundary dates
    await db.insert(salesTable)
      .values([
        {
          customer_id: null,
          cashier_id: cashier.id,
          total_amount: '100.00',
          payment_method: 'cash',
          sale_date: new Date('2024-01-01T08:00:00Z') // Start day
        },
        {
          customer_id: null,
          cashier_id: cashier.id,
          total_amount: '200.00',
          payment_method: 'card',
          sale_date: new Date('2024-01-31T20:30:00Z') // End day
        }
      ])
      .execute();

    const result = await getSalesSummary(testPeriod);

    expect(result.total_sales).toEqual(2);
    expect(result.total_amount).toBeCloseTo(300.00, 2);
    expect(result.average_sale).toBeCloseTo(150.00, 2);
  });
});
