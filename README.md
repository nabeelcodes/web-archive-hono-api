# Web archive REST API

This api uses Cloudflare-worker, Hono, Cloudflare-D1 database(sqlite), typescript and drizzle-orm to do CRUD operations for web-archive web-app.

## Manual Installation

Clone the repo:

```bash
git clone git@github.com:nabeelcodes/web-archive-hono-api.git
cd web-archive-hono-api
```

Install the dependencies:

```bash
pnpm install
```

Set the environment variables:

```bash
cp .dev.vars.example .dev.vars
# open .dev.vars and modify the environment variables
```

## Table of Contents

- [Commands](#commands)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)

## Commands

Running in development:

```bash
pnpm run dev
```

Running in production:

```bash
# deploy to cloudflare
pnpm run deploy
```

## Environment Variables

The environment variables can be found and modified in the `.env` file.

```bash
# number of articles in a page
POSTS_PER_PAGE=

# JWT secret
JWT_SECRET=

# new user sign up secret
ADMIN_SECRET=

# URL frontend (localhost for development)
FRONTEND_URL=

# cors whitelist urls
CORS_WHITELIST=
```

## Project Structure

```
api
 |--src/index.ts        # App entry point
 |--src/db/schema       # database schema
 |--src/middleware/     # custom middlewares
 |--src/controllers/    # controllers(functions)
 |--src/utils/          # Utility classes and functions
```

### API Endpoints

List of available routes:

**User routes**:

```
`POST   api/users/register` - Create a user
`POST   api/users/login`    - Login user
`GET    api/users/current`  - Get current user(private route)
```

**Post routes**:

```
`GET    api/posts`          - Fetch all posts
`GET    api/posts/:id`      - Fetch single post
`POST   api/posts`          - Create new post(private route)
`PUT    api/posts/:id`      - Update a post(private route)
`DELETE api/posts/:id`      - Delete a post(private route)
```

**Tag routes**:

```
`GET    api/tags`           - Fetch all tags
```

## License

[MIT](LICENSE)
