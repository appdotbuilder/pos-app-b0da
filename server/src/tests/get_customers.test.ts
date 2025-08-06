
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { getCustomers } from '../handlers/get_customers';

// Test customer data
const testCustomers: CreateCustomerInput[] = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com', 
    phone: null
  },
  {
    name: 'Bob Wilson',
    email: null,
    phone: '+1-555-0456'
  }
];

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getCustomers();

    expect(result).toEqual([]);
  });

  it('should return all customers', async () => {
    // Create test customers
    await db.insert(customersTable)
      .values(testCustomers)
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(3);
    
    // Check first customer
    const johnCustomer = result.find(c => c.name === 'John Doe');
    expect(johnCustomer).toBeDefined();
    expect(johnCustomer!.email).toEqual('john.doe@example.com');
    expect(johnCustomer!.phone).toEqual('+1-555-0123');
    expect(johnCustomer!.id).toBeDefined();
    expect(johnCustomer!.created_at).toBeInstanceOf(Date);
    expect(johnCustomer!.updated_at).toBeInstanceOf(Date);

    // Check customer with null email
    const bobCustomer = result.find(c => c.name === 'Bob Wilson');
    expect(bobCustomer).toBeDefined();
    expect(bobCustomer!.email).toBeNull();
    expect(bobCustomer!.phone).toEqual('+1-555-0456');

    // Check customer with null phone
    const janeCustomer = result.find(c => c.name === 'Jane Smith');
    expect(janeCustomer).toBeDefined();
    expect(janeCustomer!.email).toEqual('jane.smith@example.com');
    expect(janeCustomer!.phone).toBeNull();
  });

  it('should return customers in database insertion order', async () => {
    // Insert customers one by one to test order
    for (const customer of testCustomers) {
      await db.insert(customersTable)
        .values(customer)
        .execute();
    }

    const result = await getCustomers();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('John Doe');
    expect(result[1].name).toEqual('Jane Smith');
    expect(result[2].name).toEqual('Bob Wilson');
  });

  it('should include all required customer fields', async () => {
    await db.insert(customersTable)
      .values(testCustomers[0])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(1);
    const customer = result[0];
    
    // Verify all schema fields are present
    expect(typeof customer.id).toBe('number');
    expect(typeof customer.name).toBe('string');
    expect(customer.email === null || typeof customer.email === 'string').toBe(true);
    expect(customer.phone === null || typeof customer.phone === 'string').toBe(true);
    expect(customer.created_at).toBeInstanceOf(Date);
    expect(customer.updated_at).toBeInstanceOf(Date);
  });
});
