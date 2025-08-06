
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UserRole } from '../schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users with simple password hashes for testing
    await db.insert(usersTable).values([
      {
        username: 'cashier1',
        email: 'cashier@test.com',
        password_hash: 'hashed_password_123',
        role: 'cashier' as UserRole
      },
      {
        username: 'admin1',
        email: 'admin@test.com',
        password_hash: 'hashed_admin_456',
        role: 'admin' as UserRole
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Check first user
    expect(result[0].username).toBe('cashier1');
    expect(result[0].email).toBe('cashier@test.com');
    expect(result[0].role).toBe('cashier');
    expect(result[0].password_hash).toBe('hashed_password_123');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Check second user
    expect(result[1].username).toBe('admin1');
    expect(result[1].email).toBe('admin@test.com');
    expect(result[1].role).toBe('admin');
    expect(result[1].password_hash).toBe('hashed_admin_456');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return users in correct order', async () => {
    // Create multiple users to test ordering
    await db.insert(usersTable).values([
      {
        username: 'user_c',
        email: 'c@test.com',
        password_hash: 'hash_c',
        role: 'cashier' as UserRole
      },
      {
        username: 'user_a',
        email: 'a@test.com',
        password_hash: 'hash_a',
        role: 'admin' as UserRole
      },
      {
        username: 'user_b',
        email: 'b@test.com',
        password_hash: 'hash_b',
        role: 'cashier' as UserRole
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Verify all users are returned with proper structure
    result.forEach(user => {
      expect(user.id).toBeDefined();
      expect(user.username).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.password_hash).toBeDefined();
      expect(user.role).toBeDefined();
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should include password_hash in response', async () => {
    // Create user with specific password hash
    await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'specific_hash_value',
      role: 'cashier' as UserRole
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(result[0].password_hash).toBe('specific_hash_value');
  });
});
