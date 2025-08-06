
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper to create a test user
const createTestUser = async (): Promise<number> => {
  const testUser: CreateUserInput = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'cashier'
  };

  const hashedPassword = await Bun.password.hash(testUser.password);
  
  const result = await db.insert(usersTable)
    .values({
      username: testUser.username,
      email: testUser.email,
      password_hash: hashedPassword,
      role: testUser.role
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update username only', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'newusername'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('newusername');
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.role).toEqual('cashier'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update email only', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      email: 'newemail@example.com'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('testuser'); // Should remain unchanged
    expect(result.email).toEqual('newemail@example.com');
    expect(result.role).toEqual('cashier'); // Should remain unchanged
  });

  it('should update password and hash it', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      password: 'newpassword456'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.password_hash).not.toEqual('newpassword456'); // Should be hashed
    
    // Verify password was hashed correctly
    const isValidPassword = await Bun.password.verify('newpassword456', result.password_hash);
    expect(isValidPassword).toBe(true);
  });

  it('should update role only', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      role: 'admin'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('testuser'); // Should remain unchanged
    expect(result.role).toEqual('admin');
  });

  it('should update multiple fields at once', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'updateduser',
      email: 'updated@example.com',
      role: 'admin'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('updateduser');
    expect(result.email).toEqual('updated@example.com');
    expect(result.role).toEqual('admin');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'dbuser',
      email: 'db@example.com'
    };

    await updateUser(updateInput);

    // Verify changes were persisted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('dbuser');
    expect(users[0].email).toEqual('db@example.com');
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999,
      username: 'nonexistent'
    };

    expect(updateUser(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update updated_at timestamp', async () => {
    const userId = await createTestUser();
    
    // Get original timestamp
    const originalUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();
    
    const originalTimestamp = originalUser[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'timestamptest'
    };

    const result = await updateUser(updateInput);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });
});
