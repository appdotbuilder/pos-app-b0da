
import { db } from '../db';
import { salesTable } from '../db/schema';
import { type Sale } from '../schema';
import { eq, gte, lte, and, desc, SQL } from 'drizzle-orm';

export interface GetSalesFilters {
  start_date?: Date;
  end_date?: Date;
  cashier_id?: number;
  customer_id?: number;
  payment_method?: 'cash' | 'card' | 'digital';
  limit?: number;
  offset?: number;
}

export async function getSales(filters: GetSalesFilters = {}): Promise<Sale[]> {
  try {
    // Default pagination values
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (filters.start_date) {
      conditions.push(gte(salesTable.sale_date, filters.start_date));
    }

    if (filters.end_date) {
      conditions.push(lte(salesTable.sale_date, filters.end_date));
    }

    if (filters.cashier_id) {
      conditions.push(eq(salesTable.cashier_id, filters.cashier_id));
    }

    if (filters.customer_id) {
      conditions.push(eq(salesTable.customer_id, filters.customer_id));
    }

    if (filters.payment_method) {
      conditions.push(eq(salesTable.payment_method, filters.payment_method));
    }

    // Build the complete query in one go
    const baseQuery = db.select().from(salesTable);
    
    const finalQuery = conditions.length > 0
      ? baseQuery
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(salesTable.sale_date))
          .limit(limit)
          .offset(offset)
      : baseQuery
          .orderBy(desc(salesTable.sale_date))
          .limit(limit)
          .offset(offset);

    const results = await finalQuery.execute();

    // Convert numeric fields back to numbers
    return results.map(sale => ({
      ...sale,
      total_amount: parseFloat(sale.total_amount)
    }));
  } catch (error) {
    console.error('Get sales failed:', error);
    throw error;
  }
}
