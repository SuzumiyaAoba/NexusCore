import app from "./app";

const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3000;

console.log(`Starting server on port ${port}`);
console.log("API documentation available at:");
console.log(`  Swagger UI: http://localhost:${port}/swagger`);
console.log(`  Scalar Reference: http://localhost:${port}/reference`);
console.log(`  OpenAPI spec: http://localhost:${port}/doc`);

export default {
  port,
  fetch: app.fetch,
};
