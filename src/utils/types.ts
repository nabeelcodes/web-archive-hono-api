export interface Tag {
	id: number;
	name: string;
	createdAt: number;
}

export interface User {
	id: number;
	username: string;
	email: string;
	password: string;
	createdAt: number;
}

export interface Post {
	id: number;
	userId: string;
	title: string;
	description: string | null;
	link: string;
	image: string;
	tags: string; // JSON string
	createdAt: number;
	updatedAt: number;
}
