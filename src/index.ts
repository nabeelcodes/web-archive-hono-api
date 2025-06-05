import { Hono } from "hono";

import validateToken from "./middleware/validateTokenHandler";
import corsHandler from "./middleware/cors";
import { ENV, Variables } from "./utils/types";
import { getAllTags } from "./controllers/tagsControllers";
import { fetchCurrentUser, loginUser, registerUser } from "./controllers/usersControllers";
import {
  getAllPosts,
  createNewPost,
  getSinglePost,
  updateSinglePost,
  deleteSinglePost
} from "./controllers/postsControllers";

const app = new Hono<{ Bindings: ENV; Variables: Variables }>();

// CORS configuration
app.use("/api/*", corsHandler);

// TAGS ROUTES
app.get("/api/tags", getAllTags);

// USER ROUTES
app.post("/api/users/register", registerUser).post("/api/users/login", loginUser);
app.use("/api/users/current", validateToken).get("/api/users/current", fetchCurrentUser); // Private route

// POSTS ROUTES (api/posts)
app.get("/api/posts", getAllPosts);
app.use("/api/posts", validateToken).post("/api/posts", createNewPost); // Private route
// POSTS ROUTES (api/posts/:id)
app.get("/api/posts/:id", getSinglePost);
app
  .use("/api/posts/:id", validateToken)
  .put("/api/posts/:id", updateSinglePost) // Private route
  .delete("/api/posts/:id", deleteSinglePost); // Private route

export default app;
