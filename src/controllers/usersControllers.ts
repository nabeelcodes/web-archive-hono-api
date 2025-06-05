import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { sign } from "hono/jwt";

import { usersTable } from "../db/schema/users";
import { hashPassword, verifyPassword } from "../utils/helpers";
import { HonoContext, UserLogin, UserSignUp } from "../utils/types";

// @desc: register a new user
// @route: POST /api/users/register
// @access: public
export const registerUser = async (context: HonoContext) => {
  const db = drizzle(context.env.DB);

  try {
    const { username, email, password, secret } = await context.req.json<UserSignUp>();

    // missing fields validation
    if (!username || !email || !password || !secret) {
      context.status(400);
      throw new Error(`All fields are mandatory!`);
    }

    // checking ADMIN_SECRET
    if (typeof secret !== "string" || secret !== context.env.ADMIN_SECRET) {
      context.status(401);
      throw new Error(`Un-authorized access! Not an admin.`);
    }

    const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, email));

    // checking if user already exists
    if (existingUser.length > 0) {
      context.status(400);
      throw new Error(`User already exists!`);
    }

    // hashing password
    const hashedPassword = await hashPassword(password);

    // create new user
    const user = await db
      .insert(usersTable)
      .values({
        username,
        email,
        password: hashedPassword,
        createdAt: new Date()
      })
      .returning();

    if (user) {
      context.status(201);
      return context.json({
        message: `User created successfully!`,
        user: {
          id: user[0].id,
          username: user[0].username,
          email: user[0].email,
          createdAt: user[0].createdAt
        }
      });
    } else {
      context.status(400);
      throw new Error(`User not created! data invalid.`);
    }
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

// @desc: login an existing user
// @route: POST /api/users/login
// @access: public
export const loginUser = async (context: HonoContext) => {
  const db = drizzle(context.env.DB);

  try {
    const { email, password } = await context.req.json<UserLogin>();

    // missing fields validation
    if (!email || !password) {
      context.status(400);
      throw new Error(`All fields are mandatory!`);
    }

    const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, email));

    // checking if user exists
    if (existingUser.length === 0) {
      context.status(400);
      throw new Error(`User does not exist!`);
    }

    const isPasswordValid = await verifyPassword(password, existingUser[0].password);

    // checking if password is valid
    if (!isPasswordValid) {
      context.status(401);
      throw new Error(`Invalid credentials!`);
    }

    // generate access token
    const accessToken = await sign(
      {
        user: existingUser[0],
        exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour expiration
      },
      context.env.JWT_SECRET
    );

    context.status(200);
    return context.json({
      userData: {
        username: existingUser[0].username,
        email: existingUser[0].email
      },
      accessToken
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

// @desc: get details on an existing user
// @route: GET /api/users/current
// @access: private
export const fetchCurrentUser = async (context: HonoContext) => {
  const verifiedUser = context.get("user");

  context.status(200);
  return context.json({
    message: "User authorized!",
    user: {
      id: verifiedUser.id,
      username: verifiedUser.username,
      email: verifiedUser.email
    }
  });
};
