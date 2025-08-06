
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteUser(id: number): Promise<boolean> {
  try {
    const result = await db.delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning()
      .execute();

    // Return true if a user was deleted, false if no user was found
    return result.length > 0;
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
}
