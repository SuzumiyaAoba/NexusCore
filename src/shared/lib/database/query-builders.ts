import { type SQL, sql } from "drizzle-orm";

export function buildInClause<T>(values: T[]): SQL {
  return sql`IN (${sql.join(
    values.map((v) => sql`${v}`),
    sql`, `,
  )})`;
}

export function buildCountQuery(tableName: string, conditions?: SQL): SQL {
  const baseQuery = sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`;
  return conditions ? sql`${baseQuery} WHERE ${conditions}` : baseQuery;
}

export function buildPaginationQuery(baseQuery: SQL, limit: number, offset: number): SQL {
  return sql`${baseQuery} LIMIT ${limit} OFFSET ${offset}`;
}
