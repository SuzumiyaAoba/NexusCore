import type { Context } from "hono";

export interface TypedContext<TBody = unknown, TQuery = unknown, TParams = unknown> extends Context {
  get<K extends "validatedBody">(key: K): TBody;
  get<K extends "validatedQuery">(key: K): TQuery;
  get<K extends "validatedParams">(key: K): TParams;
}

export type Handler<TBody = unknown, TQuery = unknown, TParams = unknown> = (
  c: TypedContext<TBody, TQuery, TParams>,
) => Promise<Response> | Response;

export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
};
