
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const getProductBySku = async (sku: string): Promise<Product | null> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.sku, sku))
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    const product = results[0];
    return {
      ...product,
      price: parseFloat(product.price) // Convert numeric field back to number
    };
  } catch (error) {
    console.error('Product lookup by SKU failed:', error);
    throw error;
  }
};
