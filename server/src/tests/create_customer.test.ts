
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateCustomerInput = {
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '+1234567890'
};

// Test input with minimal required fields
const minimalTestInput: CreateCustomerInput = {
  name: 'Minimal Customer',
  email: null,
  phone: null
};

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer with all fields', async () => {
    const result = await createCustomer(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Customer');
    expect(result.email).toEqual('test@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a customer with minimal fields', async () => {
    const result = await createCustomer(minimalTestInput);

    // Basic field validation
    expect(result.name).toEqual('Minimal Customer');
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save customer to database', async () => {
    const result = await createCustomer(testInput);

    // Query using proper drizzle syntax
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('Test Customer');
    expect(customers[0].email).toEqual('test@example.com');
    expect(customers[0].phone).toEqual('+1234567890');
    expect(customers[0].created_at).toBeInstanceOf(Date);
    expect(customers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should allow multiple customers with same email', async () => {
    // Create first customer
    const first = await createCustomer({
      name: 'First Customer',
      email: 'same@example.com',
      phone: null
    });

    // Create second customer with same email - should succeed since no unique constraint
    const second = await createCustomer({
      name: 'Second Customer', 
      email: 'same@example.com',
      phone: null
    });

    expect(first.id).not.toEqual(second.id);
    expect(first.email).toEqual('same@example.com');
    expect(second.email).toEqual('same@example.com');
  });

  it('should allow multiple customers with null emails', async () => {
    // Create first customer with null email
    const first = await createCustomer({
      name: 'First Customer',
      email: null,
      phone: null
    });

    // Create second customer with null email - should succeed
    const second = await createCustomer({
      name: 'Second Customer',
      email: null,
      phone: null
    });

    expect(first.id).not.toEqual(second.id);
    expect(first.email).toBeNull();
    expect(second.email).toBeNull();
  });
});
