
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  createProductInputSchema,
  updateProductInputSchema,
  createCustomerInputSchema,
  createSaleInputSchema,
  reportPeriodInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { getProductById } from './handlers/get_product_by_id';
import { getProductBySku } from './handlers/get_product_by_sku';
import { updateProduct } from './handlers/update_product';
import { deleteProduct } from './handlers/delete_product';
import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { createSale } from './handlers/create_sale';
import { getSales } from './handlers/get_sales';
import { getSalesByCashier } from './handlers/get_sales_by_cashier';
import { getSaleWithItems } from './handlers/get_sale_with_items';
import { getSalesSummary } from './handlers/get_sales_summary';
import { getBestSellingProducts } from './handlers/get_best_selling_products';
import { getInventoryReport } from './handlers/get_inventory_report';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),
  
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  
  deleteUser: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteUser(input.id)),

  // Product management routes
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  
  getProducts: publicProcedure
    .query(() => getProducts()),
  
  getProductById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getProductById(input.id)),
  
  getProductBySku: publicProcedure
    .input(z.object({ sku: z.string() }))
    .query(({ input }) => getProductBySku(input.sku)),
  
  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),
  
  deleteProduct: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteProduct(input.id)),

  // Customer management routes
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),
  
  getCustomers: publicProcedure
    .query(() => getCustomers()),

  // Sales transaction routes
  createSale: publicProcedure
    .input(createSaleInputSchema)
    .mutation(({ input }) => createSale(input)),
  
  getSales: publicProcedure
    .query(() => getSales()),
  
  getSalesByCashier: publicProcedure
    .input(z.object({ cashierId: z.number() }))
    .query(({ input }) => getSalesByCashier(input.cashierId)),
  
  getSaleWithItems: publicProcedure
    .input(z.object({ saleId: z.number() }))
    .query(({ input }) => getSaleWithItems(input.saleId)),

  // Reporting routes
  getSalesSummary: publicProcedure
    .input(reportPeriodInputSchema)
    .query(({ input }) => getSalesSummary(input)),
  
  getBestSellingProducts: publicProcedure
    .input(reportPeriodInputSchema)
    .query(({ input }) => getBestSellingProducts(input)),
  
  getInventoryReport: publicProcedure
    .query(() => getInventoryReport()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC POS server listening at port: ${port}`);
}

start();
