// Helper function to convert tags array to JSON string for storage
export const serializeTags = (tags: string[]) => JSON.stringify(tags);

// Helper function to parse tags JSON string back to array
export const deserializeTags = (tagsString: string): string[] => JSON.parse(tagsString);

// import { eq } from 'drizzle-orm';
// import { db } from './db';
// import { posts } from './schema';

// export async function updatePostTimestamp(postId: number) {
//   return await db
//     .update(posts)
//     .set({
//       updatedAt: Math.floor(Date.now() / 1000) // Convert current time to Unix timestamp
//     })
//     .where(eq(posts.id, postId));
// }
