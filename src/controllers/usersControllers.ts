import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';

import { users } from '../db/schema/users';
import { hashPassword } from '../utils/helpers';
import { HonoContext, UserSignUp } from '../utils/types';

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
		if (typeof secret !== 'string' || secret !== context.env.ADMIN_SECRET) {
			context.status(401);
			throw new Error(`Un-authorized access! Not an admin.`);
		}

		const existingUser = await db.select().from(users).where(eq(users.email, email));

		// checking if user already exists
		if (existingUser.length > 0) {
			context.status(400);
			throw new Error(`User already exists!`);
		}

		// hashing password
		const hashedPassword = await hashPassword(password);

		// create new user
		const user = await db
			.insert(users)
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
		}
	}
};
