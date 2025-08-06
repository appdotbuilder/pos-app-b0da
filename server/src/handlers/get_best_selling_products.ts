
import { db } from '../db';
import { salesTable, saleItemsTable, productsTable } from '../db/schema';
import { type ReportPeriodInput, type BestSellingProduct } from '../schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

export async function getBestSellingProducts(input: ReportPeriodInput): Promise<BestSellingProduct[]> {
  try {
    const results = await db
      .select({
        product_id: saleItemsTable.product_id,
        product_name: productsTable.name,
        total_quantity_sold: sql<string>`sum(${saleItemsTable.quantity})`.as('total_quantity_sold'),
        total_revenue: sql<string>`sum(${saleItemsTable.total_price})`.as('total_revenue')
      })
      .from(saleItemsTable)
      .innerJoin(salesTable, eq(saleItemsTable.sale_id, salesTable.id))
      .innerJoin(productsTable, eq(saleItemsTable.product_id, productsTable.id))
      .where(
        and(
          gte(salesTable.sale_date, input.start_date),
          lte(salesTable.sale_date, input.end_date)
        )
      )
      .groupBy(saleItemsTable.product_id, productsTable.name)
      .orderBy(desc(sql`sum(${saleItemsTable.quantity})`))
      .execute();

    return results.map(result => ({
      product_id: result.product_id,
      product_name: result.product_name,
      total_quantity_sold: parseInt(result.total_quantity_sold || '0'),
      total_revenue: parseFloat(result.total_revenue || '0')
    }));
  } catch (error) {
    console.error('Get best selling products failed:', error);
    throw error;
  }
}
