import type { Hono, MiddlewareHandler } from "hono";
import type { z } from "zod";
import { validateJson, validateParams, validateQuery } from "./middleware";
import type { Handler } from "./types";

export class RouteBuilder {
  private app: Hono;

  constructor(app: Hono) {
    this.app = app;
  }

  get<TQuery = undefined, TParams = undefined>(
    path: string,
    options: {
      query?: z.ZodSchema<TQuery>;
      params?: z.ZodSchema<TParams>;
      handler: Handler<undefined, TQuery, TParams>;
    },
  ) {
    const middlewares: MiddlewareHandler[] = [];

    if (options.query) {
      middlewares.push(validateQuery(options.query));
    }

    if (options.params) {
      middlewares.push(validateParams(options.params));
    }

    this.app.get(path, ...middlewares, options.handler);
    return this;
  }

  post<TBody, TQuery = undefined, TParams = undefined>(
    path: string,
    options: {
      body: z.ZodSchema<TBody>;
      query?: z.ZodSchema<TQuery>;
      params?: z.ZodSchema<TParams>;
      handler: Handler<TBody, TQuery, TParams>;
    },
  ) {
    const middlewares: MiddlewareHandler[] = [];

    middlewares.push(validateJson(options.body));

    if (options.query) {
      middlewares.push(validateQuery(options.query));
    }

    if (options.params) {
      middlewares.push(validateParams(options.params));
    }

    this.app.post(path, ...middlewares, options.handler);
    return this;
  }

  put<TBody, TQuery = undefined, TParams = undefined>(
    path: string,
    options: {
      body: z.ZodSchema<TBody>;
      query?: z.ZodSchema<TQuery>;
      params?: z.ZodSchema<TParams>;
      handler: Handler<TBody, TQuery, TParams>;
    },
  ) {
    const middlewares: MiddlewareHandler[] = [];

    middlewares.push(validateJson(options.body));

    if (options.query) {
      middlewares.push(validateQuery(options.query));
    }

    if (options.params) {
      middlewares.push(validateParams(options.params));
    }

    this.app.put(path, ...middlewares, options.handler);
    return this;
  }

  delete<TQuery = undefined, TParams = undefined>(
    path: string,
    options: {
      query?: z.ZodSchema<TQuery>;
      params?: z.ZodSchema<TParams>;
      handler: Handler<undefined, TQuery, TParams>;
    },
  ) {
    const middlewares: MiddlewareHandler[] = [];

    if (options.query) {
      middlewares.push(validateQuery(options.query));
    }

    if (options.params) {
      middlewares.push(validateParams(options.params));
    }

    this.app.delete(path, ...middlewares, options.handler);
    return this;
  }
}
