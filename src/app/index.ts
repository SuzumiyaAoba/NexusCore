import { setupTaskRoutes } from "@/features/task-management/api/routes-typed";
import { setupUserRoutes } from "@/features/user-management/api/routes-typed";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";
import { ZodError } from "zod";

// Create main app with complete type inference
const app = new Hono();

// Global error handler for validation errors
app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: err.errors.map((error) => ({
            field: error.path.join("."),
            message: error.message,
          })),
        },
      },
      400,
    );
  }

  console.error("Unhandled error:", err);
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      },
    },
    500,
  );
});

// Register typed routes
setupTaskRoutes(app);
setupUserRoutes(app);
// Basic API documentation endpoint
app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "NexusCore API",
        version: "1.0.0",
        description: "TODO management system API with complete type safety",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Local development server",
        },
      ],
    },
  }),
);

app.get("/docs", Scalar({ url: "/openapi" }));

// Health check endpoint
app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  }),
);

export default app;
