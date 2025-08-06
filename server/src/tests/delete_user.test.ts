
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteUser } from '../handlers/delete_user';

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing user', async () => {
    // Create a test user first
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
        role: 'cashier'
      })
      .returning()
      .execute();

    // Delete the user
    const result = await deleteUser(user.id);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify user was actually deleted from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(users).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent user', async () => {
    // Try to delete a user that doesn't exist
    const result = await deleteUser(999);

    // Should return false when no user is found
    expect(result).toBe(false);
  });

  it('should not affect other users when deleting specific user', async () => {
    // Create multiple test users
    const [user1] = await db.insert(usersTable)
      .values({
        username: 'testuser1',
        email: 'test1@example.com',
        password_hash: 'hashedpassword123',
        role: 'cashier'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com',
        password_hash: 'hashedpassword456',
        role: 'admin'
      })
      .returning()
      .execute();

    // Delete only the first user
    const result = await deleteUser(user1.id);

    expect(result).toBe(true);

    // Verify first user is deleted
    const deletedUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user1.id))
      .execute();

    expect(deletedUsers).toHaveLength(0);

    // Verify second user still exists
    const remainingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user2.id))
      .execute();

    expect(remainingUsers).toHaveLength(1);
    expect(remainingUsers[0].username).toEqual('testuser2');
  });
});
