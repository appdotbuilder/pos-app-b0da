
import { db } from '../db';
import { salesTable, saleItemsTable, productsTable, usersTable, customersTable } from '../db/schema';
import { type CreateSaleInput, type Sale } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const createSale = async (input: CreateSaleInput): Promise<Sale> => {
  try {
    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Verify cashier exists
      const cashier = await tx.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.cashier_id))
        .execute();
      
      if (cashier.length === 0) {
        throw new Error(`Cashier with ID ${input.cashier_id} not found`);
      }

      // Verify customer exists if provided
      if (input.customer_id) {
        const customer = await tx.select()
          .from(customersTable)
          .where(eq(customersTable.id, input.customer_id))
          .execute();
        
        if (customer.length === 0) {
          throw new Error(`Customer with ID ${input.customer_id} not found`);
        }
      }

      // Verify all products exist and have sufficient stock
      for (const item of input.items) {
        const product = await tx.select()
          .from(productsTable)
          .where(eq(productsTable.id, item.product_id))
          .execute();

        if (product.length === 0) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }

        if (product[0].stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ID ${item.product_id}. Available: ${product[0].stock_quantity}, Required: ${item.quantity}`);
        }
      }

      // Create sale record
      const saleResult = await tx.insert(salesTable)
        .values({
          customer_id: input.customer_id,
          cashier_id: input.cashier_id,
          total_amount: input.total_amount.toString(),
          payment_method: input.payment_method
        })
        .returning()
        .execute();

      const sale = saleResult[0];

      // Create sale items and update stock quantities
      for (const item of input.items) {
        const totalPrice = item.quantity * item.unit_price;

        // Insert sale item
        await tx.insert(saleItemsTable)
          .values({
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price.toString(),
            total_price: totalPrice.toString()
          })
          .execute();

        // Update product stock using SQL expression
        await tx.update(productsTable)
          .set({
            stock_quantity: sql`${productsTable.stock_quantity} - ${item.quantity}`
          })
          .where(eq(productsTable.id, item.product_id))
          .execute();
      }

      return sale;
    });

    // Convert numeric fields back to numbers
    return {
      ...result,
      total_amount: parseFloat(result.total_amount)
    };
  } catch (error) {
    console.error('Sale creation failed:', error);
    throw error;
  }
};
