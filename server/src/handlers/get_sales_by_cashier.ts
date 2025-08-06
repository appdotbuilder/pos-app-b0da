
import { db } from '../db';
import { salesTable } from '../db/schema';
import { type Sale } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getSalesByCashier(cashierId: number): Promise<Sale[]> {
  try {
    const results = await db.select()
      .from(salesTable)
      .where(eq(salesTable.cashier_id, cashierId))
      .orderBy(desc(salesTable.sale_date))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(sale => ({
      ...sale,
      total_amount: parseFloat(sale.total_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch sales by cashier:', error);
    throw error;
  }
}
