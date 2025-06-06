import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq, like, or } from "drizzle-orm";

import { postsTable } from "../db/schema/posts";
import { tagsTable } from "../db/schema/tags";
import { deserializeTags, serializeTags } from "../utils/helpers";
import { HonoContext, PostCreate, PostUpdate } from "../utils/types";

// @desc: get all posts
// @route: GET /api/posts
// @access: public
export const getAllPosts = async (context: HonoContext) => {
  const db = drizzle(context.env.DB);

  try {
    // Extract query parameters
    const searchQuery = context.req.query("query");
    const tagsQuery = context.req.query("tags");
    const pageQuery = context.req.query("page");

    // Parse query parameters
    const searchValue = searchQuery ? searchQuery.trim() : "";
    const tags = tagsQuery ? tagsQuery.split(",") : [];
    const currentPage = Number(pageQuery) || 1;
    const postsPerPage = Number(context.env.POSTS_PER_PAGE);
    const skipPosts = (currentPage - 1) * postsPerPage;

    // Build where conditions for query based filtering
    const whereConditions = [];

    // Filtering for search query
    if (searchValue) {
      whereConditions.push(
        or(
          like(postsTable.title, `%${searchValue}%`),
          like(postsTable.description, `%${searchValue}%`)
        )
      );
    }

    // Filtering for tags query
    if (tags.length > 0) {
      // Filter out empty tags and trim whitespace
      const validTags = tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .map((tag) => tag.toLowerCase());

      if (validTags.length > 0) {
        // Create conditions for each tag
        // Using `like` to match tags(string[]) in the `posts.tags(JSON.stringify(string[]))` field
        const tagConditions = validTags.map((tag) => like(postsTable.tags, `%"${tag}"%`));
        whereConditions.push(and(...tagConditions));
      }
    }

    // Get total number of posts in the collection
    const totalPostsInDb = (await db.$count(postsTable)) || 0;
    const nextPageExists = totalPostsInDb > currentPage * postsPerPage;

    // Fetching filtered posts from db
    const allPostsFromDB = await db
      .select()
      .from(postsTable)
      .where(and(...whereConditions))
      .orderBy(desc(postsTable.createdAt))
      .limit(postsPerPage)
      .offset(skipPosts);

    // Transforming posts.tags(string) to an array of tags
    const transformedPosts = allPostsFromDB.map((post) => ({
      ...post,
      tags: deserializeTags(post.tags)
    }));

    context.status(200);
    return context.json({
      posts: transformedPosts,
      currentPage,
      nextPageExists,
      totalPages: Math.ceil(totalPostsInDb / postsPerPage)
    });
  } catch (error) {
    if (error instanceof Error) {
      context.status(400);
      return context.json({
        error: {
          title: error.name,
          message: error.message
        }
      });
    } else {
      context.status(500);
      return context.json({
        error: {
          title: "Internal Server Error",
          message: "An unexpected error occurred."
        }
      });
    }
  }
};

// @desc: get single post
// @route: GET /api/posts/:id
// @access: public
export const getSinglePost = async (context: HonoContext) => {
  const db = drizzle(context.env.DB);

  try {
    const id = context.req.param("id");
    const postId = Number(id);

    // Validate the post ID
    if (!id) {
      context.status(400);
      return context.json({
        error: {
          title: "Bad Request",
          message: "Post ID is required."
        }
      });
    }

    // Check if the ID is a valid number
    if (isNaN(postId)) {
      context.status(400);
      return context.json({
        error: {
          title: "Bad Request",
          message: "Post ID must be a number."
        }
      });
    }

    // Fetch the post by ID
    const postFromDb = await db.select().from(postsTable).where(eq(postsTable.id, postId));

    // If the post does not exist, return a 404 error
    if (postFromDb.length === 0) {
      context.status(404);
      return context.json({
        error: {
          title: "Not Found",
          message: "Post does not exists!"
        }
      });
    }

    // Transforming posts.tags(string) to an array of tags
    const transformedPost = postFromDb.map((post) => ({
      ...post,
      tags: deserializeTags(post.tags)
    }));

    context.status(200);
    return context.json(transformedPost[0]);
  } catch (error) {
    if (error instanceof Error) {
      context.status(400);
      return context.json({
        error: {
          title: error.name,
          message: error.message
        }
      });
    } else {
      context.status(500);
      return context.json({
        error: {
          title: "Internal Server Error",
          message: "An unexpected error occurred."
        }
      });
    }
  }
};

// @desc: create new post
// @route: POST /api/posts
// @access: private
export const createNewPost = async (context: HonoContext) => {
  const db = drizzle(context.env.DB);

  try {
    // Checking user authentication
    const loggedInUser = context.get("user");
    if (!loggedInUser?.id) {
      context.status(403);
      return context.json({
        error: {
          title: "Unauthorized",
          message: "User not logged in!"
        }
      });
    }

    const { title, description, link, image, tags } = await context.req.json<PostCreate>();

    // Validating all required fields
    const missingFields: string[] = [];

    if (!title) missingFields.push("title");
    if (!link) missingFields.push("link");
    if (!image) missingFields.push("image");
    if (!tags?.length) missingFields.push("tags");

    if (missingFields.length > 0) {
      context.status(400);
      return context.json({
        error: {
          title: "Validation Error",
          message: `Missing required fields: ${missingFields.join(", ")}`
        }
      });
    }

    // URL validation
    try {
      new URL(link);
      new URL(image);
    } catch {
      context.status(400);
      return context.json({
        error: {
          title: "Validation Error",
          message: "Invalid URL format for link or image"
        }
      });
    }

    // Create new post in db
    const newPost = await db
      .insert(postsTable)
      .values({
        creatorId: loggedInUser.id,
        title,
        description: description || null,
        link,
        image,
        tags: serializeTags(tags),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Insert new tags in db
    await Promise.all(
      tags.map((tag) =>
        db
          .insert(tagsTable)
          .values({
            name: tag.toLowerCase(),
            createdAt: new Date()
          })
          .onConflictDoNothing({ target: tagsTable.name })
      )
    );

    context.status(201);
    return context.json(newPost[0]);
  } catch (error) {
    if (error instanceof Error) {
      context.status(400);
      return context.json({
        error: {
          title: error.name,
          message: error.message
        }
      });
    } else {
      context.status(500);
      return context.json({
        error: {
          title: "Internal Server Error",
          message: "An unexpected error occurred."
        }
      });
    }
  }
};

// @desc: update a post
// @route: PUT /api/posts/:id
// @access: private
export const updateSinglePost = async (context: HonoContext) => {
  const db = drizzle(context.env.DB);

  try {
    // Checking user authentication
    const loggedInUser = context.get("user");
    if (!loggedInUser?.id) {
      context.status(403);
      return context.json({
        error: {
          title: "Unauthorized",
          message: "User not logged in!"
        }
      });
    }

    const id = context.req.param("id");
    const postId = Number(id);

    // Validate the post ID
    if (!id) {
      context.status(400);
      return context.json({
        error: {
          title: "Bad Request",
          message: "Post ID is required."
        }
      });
    }

    // Check if the ID is a valid number
    if (isNaN(postId)) {
      context.status(400);
      return context.json({
        error: {
          title: "Bad Request",
          message: "Post ID must be a number."
        }
      });
    }

    // Fetch the post by ID
    const existingPostFromDb = await db.select().from(postsTable).where(eq(postsTable.id, postId));

    // If the post does not exist, return a 404 error
    if (existingPostFromDb.length === 0) {
      context.status(404);
      return context.json({
        error: {
          title: "Not Found",
          message: "Post does not exists!"
        }
      });
    }

    const { title, description, image, tags } = await context.req.json<PostUpdate>();

    // Validating all required fields
    const missingFields: string[] = [];
    if (!title) missingFields.push("title");
    if (!image) missingFields.push("image");
    if (!tags?.length) missingFields.push("tags");

    if (missingFields.length > 0) {
      context.status(400);
      return context.json({
        error: {
          title: "Validation Error",
          message: `Missing required fields: ${missingFields.join(", ")}`
        }
      });
    }

    // URL validation
    try {
      new URL(image);
    } catch {
      context.status(400);
      return context.json({
        error: {
          title: "Validation Error",
          message: "Invalid URL format for link or image"
        }
      });
    }

    // Update the post in db
    const updatedPost = await db
      .update(postsTable)
      .set({
        title,
        description: description || null,
        image,
        tags: serializeTags(tags),
        updatedAt: new Date()
      })
      .where(eq(postsTable.id, postId))
      .returning();

    // Insert new unique tags in db
    await Promise.all(
      tags.map((tag) =>
        db
          .insert(tagsTable)
          .values({
            name: tag.toLowerCase(),
            createdAt: new Date()
          })
          .onConflictDoNothing({ target: tagsTable.name })
      )
    );

    context.status(200);
    return context.json(updatedPost[0]);
  } catch (error) {
    if (error instanceof Error) {
      context.status(400);
      return context.json({
        error: {
          title: error.name,
          message: error.message
        }
      });
    } else {
      context.status(500);
      return context.json({
        error: {
          title: "Internal Server Error",
          message: "An unexpected error occurred."
        }
      });
    }
  }
};

// @desc: delete a post
// @route: DELETE /api/posts/:id
// @access: private
export const deleteSinglePost = async (context: HonoContext) => {
  const db = drizzle(context.env.DB);

  try {
    // Checking user authentication
    const loggedInUser = context.get("user");
    if (!loggedInUser?.id) {
      context.status(403);
      return context.json({
        error: {
          title: "Unauthorized",
          message: "User not logged in!"
        }
      });
    }

    const id = context.req.param("id");
    const postId = Number(id);

    // Validate the post ID
    if (!id) {
      context.status(400);
      return context.json({
        error: {
          title: "Bad Request",
          message: "Post ID is required."
        }
      });
    }

    // Check if the ID is a valid number
    if (isNaN(postId)) {
      context.status(400);
      return context.json({
        error: {
          title: "Bad Request",
          message: "Post ID must be a number."
        }
      });
    }

    // Fetch the post by ID
    const existingPostFromDb = await db.select().from(postsTable).where(eq(postsTable.id, postId));

    // If the post does not exist, return a 404 error
    if (existingPostFromDb.length === 0) {
      context.status(404);
      return context.json({
        error: {
          title: "Not Found",
          message: "Post does not exists!"
        }
      });
    }

    // Delete the post from the database
    const deletedPost = await db.delete(postsTable).where(eq(postsTable.id, postId)).returning();

    context.status(200);
    return context.json(deletedPost[0]);
  } catch (error) {
    if (error instanceof Error) {
      context.status(400);
      return context.json({
        error: {
          title: error.name,
          message: error.message
        }
      });
    } else {
      context.status(500);
      return context.json({
        error: {
          title: "Internal Server Error",
          message: "An unexpected error occurred."
        }
      });
    }
  }
};
