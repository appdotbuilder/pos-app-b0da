
import { db } from '../db';
import { salesTable } from '../db/schema';
import { type ReportPeriodInput, type SalesSummary } from '../schema';
import { gte, lt, and, count, sum, avg } from 'drizzle-orm';

export const getSalesSummary = async (input: ReportPeriodInput): Promise<SalesSummary> => {
  try {
    // Create end date that includes the entire end day
    const endDateInclusive = new Date(input.end_date);
    endDateInclusive.setDate(endDateInclusive.getDate() + 1); // Add one day to make it exclusive upper bound

    // Query sales within the date range
    const result = await db.select({
      total_sales: count(salesTable.id),
      total_amount: sum(salesTable.total_amount),
      average_sale: avg(salesTable.total_amount)
    })
    .from(salesTable)
    .where(
      and(
        gte(salesTable.sale_date, input.start_date),
        lt(salesTable.sale_date, endDateInclusive) // Use less than to exclude next day
      )
    )
    .execute();

    const row = result[0];

    return {
      total_sales: Number(row.total_sales) || 0,
      total_amount: parseFloat(row.total_amount || '0'),
      average_sale: parseFloat(row.average_sale || '0'),
      period_start: input.start_date,
      period_end: input.end_date
    };
  } catch (error) {
    console.error('Sales summary generation failed:', error);
    throw error;
  }
};
