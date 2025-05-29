import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

export type ENV = {
	DB: D1Database;
	POSTS_PER_PAGE: number;
	JWT_SECRET: string;
	ADMIN_SECRET: string;
	FRONTEND_URL: string;
	CORS_WHITELIST: string;
};

const app = new Hono<{ Bindings: ENV }>();

// @desc: get all posts
// @route: GET /api/posts
// @access: public
app.get('/api/posts', async (context) => {
	return context.text('Hello Hono!');
});

// @desc: create new post
// @route: POST /api/posts
// @access: private
app.post('/api/posts', async (context) => {
	return context.text('Hello Hono!');
});

// @desc: get single post
// @route: GET /api/posts/:id
// @access: public
app.get('/api/posts/:id', async (context) => {
	return context.text('Hello Hono!');
});

// @desc: update a post
// @route: PUT /api/posts/:id
// @access: private
app.put('/api/posts/:id', async (context) => {
	return context.text('Hello Hono!');
});

// @desc: delete a post
// @route: DELETE /api/posts/:id
// @access: private
app.delete('/api/posts/:id', async (context) => {
	return context.text('Hello Hono!');
});

export default app;
