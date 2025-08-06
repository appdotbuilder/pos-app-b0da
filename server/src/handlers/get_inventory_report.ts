
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type InventoryReportItem } from '../schema';

export async function getInventoryReport(): Promise<InventoryReportItem[]> {
  try {
    const results = await db.select({
      product_id: productsTable.id,
      product_name: productsTable.name,
      current_stock: productsTable.stock_quantity,
      sku: productsTable.sku,
      price: productsTable.price
    })
      .from(productsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      current_stock: item.current_stock,
      sku: item.sku,
      price: parseFloat(item.price) // Convert string back to number
    }));
  } catch (error) {
    console.error('Inventory report generation failed:', error);
    throw error;
  }
}
