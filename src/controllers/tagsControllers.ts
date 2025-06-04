import { drizzle } from "drizzle-orm/d1";

import { tags } from "../db/schema/tags";
import { HonoContext } from "../utils/types";

// @desc: get all tags
// @route: GET /api/tags
// @access: public
export const getAllTags = async (context: HonoContext) => {
  const db = drizzle(context.env.DB);

  try {
    // get all tags in the collection
    const allTags = await db.select({ name: tags.name }).from(tags);

    // Check if there are no tags
    // If no tags are found, return a 404 error
    if (allTags.length === 0) {
      context.status(404);
      throw new Error("No tags found");
    }

    const responseToClient = {
      allTags: allTags.map((tag) => tag.name)
    };

    context.status(200);
    context.json(responseToClient);
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
