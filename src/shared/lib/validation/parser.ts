import { z } from "zod";

export function parseJson<T>(jsonString: string, schema: z.ZodSchema<T>): T {
  try {
    const parsed = JSON.parse(jsonString);
    return schema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
}

export async function parseJsonFromRequest<T>(
  request: { json(): Promise<unknown> },
  schema: z.ZodSchema<T>,
): Promise<T> {
  try {
    const data = await request.json();
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    throw error;
  }
}

export function parseQuery<T>(query: Record<string, unknown>, schema: z.ZodSchema<T>): T {
  try {
    return schema.parse(query);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Query validation error: ${error.message}`);
    }
    throw error;
  }
}

export function parseParams<T>(params: Record<string, unknown>, schema: z.ZodSchema<T>): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Parameter validation error: ${error.message}`);
    }
    throw error;
  }
}
