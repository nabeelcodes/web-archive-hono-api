import { cors } from "hono/cors";
import { Next } from "hono";

import { HonoContext } from "../utils/types";

const corsHandler = async (context: HonoContext, next: Next) => {
  // Check if CORS_WHITELIST is set and contains valid domains
  if (!context.env.CORS_WHITELIST) {
    console.error("CORS_WHITELIST environment variable is not set.");
    context.status(500);
    return context.json({
      error: "CORS_WHITELIST environment variable is not set."
    });
  }

  const whitelistedDomains = context.env.CORS_WHITELIST.split(",");

  // Validate that the whitelist is not empty
  if (whitelistedDomains.length === 0) {
    console.error("CORS whitelist is not configured properly.");
    context.status(500);
    return context.json({
      error: "CORS whitelist is not configured properly."
    });
  }

  const corsMiddlewareHandler = cors({
    origin: whitelistedDomains,
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    maxAge: 3600, // Cache preflight response for 1 hour
    credentials: true // Allow cookies to be sent with requests if needed
  });

  return corsMiddlewareHandler(context, next);
};

export default corsHandler;
