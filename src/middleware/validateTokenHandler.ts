import { verify } from 'hono/jwt';
import { Next } from 'hono';

import { HonoContext, JWTPayload, Variables } from '../utils/types';

const validateToken = async (context: HonoContext, next: Next) => {
	try {
		// Extracting the Authorization header
		let authHeader = context.req.header('Authorization') || context.req.header('authorization');

		if (authHeader && authHeader.startsWith('Bearer ')) {
			const token = authHeader.split(' ')[1];

			// checking if token(jwt) is present
			if (!token) {
				context.status(400);
				throw new Error(`Bearer token missing!`);
			}

			// verify and decode the token in one step
			const decodedPayload = (await verify(token, context.env.JWT_SECRET)) as JWTPayload;

			// attaching user data to context
			const verifiedUser: Variables['user'] = {
				username: decodedPayload.user.username,
				email: decodedPayload.user.email,
				id: decodedPayload.user.id
			};
			context.set('user', verifiedUser);
			await next();
		} else {
			context.status(400);
			throw new Error(`Auth header not set!`);
		}
	} catch (error) {
		if (error instanceof Error) {
			context.status(401);
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
					title: 'Internal Server Error',
					message: 'An unexpected error occurred.'
				}
			});
		}
	}
};

export default validateToken;
