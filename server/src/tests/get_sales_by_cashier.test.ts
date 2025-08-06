
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, salesTable, customersTable } from '../db/schema';
import { getSalesByCashier } from '../handlers/get_sales_by_cashier';

describe('getSalesByCashier', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return sales for specific cashier', async () => {
    // Create test users (cashiers)
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'cashier1',
          email: 'cashier1@test.com',
          password_hash: 'hash1',
          role: 'cashier'
        },
        {
          username: 'cashier2', 
          email: 'cashier2@test.com',
          password_hash: 'hash2',
          role: 'cashier'
        }
      ])
      .returning()
      .execute();

    const cashier1Id = users[0].id;
    const cashier2Id = users[1].id;

    // Create test customer
    const customers = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'customer@test.com'
      })
      .returning()
      .execute();

    const customerId = customers[0].id;

    // Create sales for both cashiers
    await db.insert(salesTable)
      .values([
        {
          customer_id: customerId,
          cashier_id: cashier1Id,
          total_amount: '25.99',
          payment_method: 'cash'
        },
        {
          customer_id: customerId,
          cashier_id: cashier1Id,
          total_amount: '15.50',
          payment_method: 'card'
        },
        {
          customer_id: customerId,
          cashier_id: cashier2Id,
          total_amount: '99.99',
          payment_method: 'digital'
        }
      ])
      .execute();

    const result = await getSalesByCashier(cashier1Id);

    expect(result).toHaveLength(2);
    
    // Verify all sales belong to the correct cashier
    result.forEach(sale => {
      expect(sale.cashier_id).toBe(cashier1Id);
    });

    // Verify numeric conversion
    expect(typeof result[0].total_amount).toBe('number');
    expect(typeof result[1].total_amount).toBe('number');

    // Verify sales are ordered by date (most recent first)
    expect(result[0].sale_date >= result[1].sale_date).toBe(true);

    // Verify specific amounts
    const amounts = result.map(s => s.total_amount).sort();
    expect(amounts).toEqual([15.50, 25.99]);
  });

  it('should return empty array for cashier with no sales', async () => {
    // Create test cashier
    const users = await db.insert(usersTable)
      .values({
        username: 'emptycashier',
        email: 'empty@test.com',
        password_hash: 'hash',
        role: 'cashier'
      })
      .returning()
      .execute();

    const result = await getSalesByCashier(users[0].id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent cashier', async () => {
    const result = await getSalesByCashier(99999);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle sales with null customer_id', async () => {
    // Create test cashier
    const users = await db.insert(usersTable)
      .values({
        username: 'cashier3',
        email: 'cashier3@test.com',
        password_hash: 'hash3',
        role: 'cashier'
      })
      .returning()
      .execute();

    const cashierId = users[0].id;

    // Create sale without customer
    await db.insert(salesTable)
      .values({
        customer_id: null,
        cashier_id: cashierId,
        total_amount: '12.34',
        payment_method: 'cash'
      })
      .execute();

    const result = await getSalesByCashier(cashierId);

    expect(result).toHaveLength(1);
    expect(result[0].customer_id).toBeNull();
    expect(result[0].cashier_id).toBe(cashierId);
    expect(result[0].total_amount).toBe(12.34);
  });
});
