
import { db } from '../db';
import { salesTable, saleItemsTable, productsTable, customersTable, usersTable } from '../db/schema';
import { type Sale, type SaleItem } from '../schema';
import { eq } from 'drizzle-orm';

export interface SaleWithItems extends Sale {
    items: SaleItem[];
}

export async function getSaleWithItems(saleId: number): Promise<SaleWithItems | null> {
    try {
        // First get the sale record
        const saleResult = await db.select()
            .from(salesTable)
            .where(eq(salesTable.id, saleId))
            .execute();

        if (saleResult.length === 0) {
            return null;
        }

        // Get sale items for this sale
        const saleItemsResult = await db.select()
            .from(saleItemsTable)
            .where(eq(saleItemsTable.sale_id, saleId))
            .execute();

        // Convert sale data with numeric field conversions
        const sale = saleResult[0];
        const convertedSale: Sale = {
            ...sale,
            total_amount: parseFloat(sale.total_amount)
        };

        // Convert sale items data with numeric field conversions
        const convertedItems: SaleItem[] = saleItemsResult.map(item => ({
            ...item,
            unit_price: parseFloat(item.unit_price),
            total_price: parseFloat(item.total_price)
        }));

        return {
            ...convertedSale,
            items: convertedItems
        };
    } catch (error) {
        console.error('Get sale with items failed:', error);
        throw error;
    }
}
