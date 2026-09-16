import db from '../db/connection';
import { QueryResult } from '../types';

export function executeQuery(sql: string): QueryResult {
  try {
    const stmt = db.prepare(sql);
    const rows = stmt.all() as Record<string, unknown>[];

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return { columns, rows };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Query execution failed';
    throw new Error(`Database error: ${message}`);
  }
}
