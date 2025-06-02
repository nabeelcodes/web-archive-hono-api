import { Hono } from 'hono';

import { fetchCurrentUser, loginUser, registerUser } from './controllers/usersControllers';
import validateToken from './middleware/validateTokenHandler';
import { ENV, Variables } from './utils/types';

const app = new Hono<{ Bindings: ENV; Variables: Variables }>();

// USER ROUTES
app
	.post('/api/users/register', registerUser)
	.post('/api/users/login', loginUser)
	.use('/api/users/current', validateToken)
	.get('/api/users/current', fetchCurrentUser);

export default app;
