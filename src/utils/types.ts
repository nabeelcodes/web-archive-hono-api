import { BlankInput } from "hono/types";
import { Context } from "hono";
import type { D1Database } from "@cloudflare/workers-types";

export type HonoContext = Context<{ Bindings: ENV; Variables: Variables }, string, BlankInput>;

export type ENV = {
  DB: D1Database;
  POSTS_PER_PAGE: number;
  JWT_SECRET: string;
  ADMIN_SECRET: string;
  FRONTEND_URL: string;
  CORS_WHITELIST: string;
};

export type Variables = {
  user: Pick<User, "id" | "username" | "email">;
};

export type JWTPayload = {
  user: Pick<User, "id" | "username" | "email">;
  exp: number;
  iat: number;
};

export type Tag = {
  id: number;
  name: string;
  createdAt: Date;
};

export type User = {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
};

export type UserSignUp = {
  username: string;
  email: string;
  password: string;
  secret: string;
};

export type UserLogin = {
  email: string;
  password: string;
};

export type Post = {
  id: number;
  creatorId: number;
  title: string;
  description: string | null;
  link: string;
  image: string;
  tags: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PostCreate = {
  title: string;
  description: string | null;
  link: string;
  image: string;
  tags: string[];
};
