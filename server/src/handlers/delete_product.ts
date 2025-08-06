
import { db } from '../db';
import { productsTable, saleItemsTable } from '../db/schema';
import { eq, count } from 'drizzle-orm';

export async function deleteProduct(id: number): Promise<boolean> {
  try {
    // Check if product exists in sale items (has associated sales)
    const saleItemsCount = await db
      .select({ count: count() })
      .from(saleItemsTable)
      .where(eq(saleItemsTable.product_id, id))
      .execute();

    // If product has associated sales, prevent deletion
    if (saleItemsCount[0].count > 0) {
      throw new Error('Cannot delete product: product has associated sales');
    }

    // Delete the product
    const result = await db
      .delete(productsTable)
      .where(eq(productsTable.id, id))
      .returning()
      .execute();

    // Return true if product was deleted (result has entries), false if product didn't exist
    return result.length > 0;
  } catch (error) {
    console.error('Product deletion failed:', error);
    throw error;
  }
}
