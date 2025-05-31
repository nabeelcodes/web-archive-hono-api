import { BlankInput } from 'hono/types';
import { Context } from 'hono';
import { ENV } from '../index';

export type HonoContext = Context<{ Bindings: ENV }, string, BlankInput>;

export interface Tag {
	id: number;
	name: string;
	createdAt: Date;
}

export interface User {
	id: number;
	username: string;
	email: string;
	password: string;
	createdAt: Date;
}

export interface Post {
	id: number;
	creatorId: number;
	title: string;
	description: string | null;
	link: string;
	image: string;
	tags: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserSignUp {
	username: string;
	email: string;
	password: string;
	secret: string;
}

export interface UserLogin {
	email: string;
	password: string;
}
