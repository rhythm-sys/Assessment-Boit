import { ValidationResult } from '../types';

const ALLOWED_TABLES = ['branches', 'customers', 'onboarding_applications', 'transactions'];

const DANGEROUS_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE',
  'ATTACH', 'DETACH', 'REPLACE', 'TRUNCATE', 'GRANT', 'REVOKE',
];

export function validateSql(sql: string): ValidationResult {
  if (!sql || typeof sql !== 'string' || sql.trim().length === 0) {
    return { valid: false, sanitizedSql: '', error: 'Empty SQL query' };
  }

  let trimmed = sql.trim();

  // Remove trailing semicolon if present
  if (trimmed.endsWith(';')) {
    trimmed = trimmed.slice(0, -1).trim();
  }

  // Check for multiple statements (semicolon injection)
  if (trimmed.includes(';')) {
    return { valid: false, sanitizedSql: '', error: 'Multiple SQL statements are not allowed' };
  }

  // Must start with SELECT
  if (!trimmed.toUpperCase().startsWith('SELECT')) {
    return { valid: false, sanitizedSql: '', error: 'Only SELECT queries are allowed' };
  }

  // Check for dangerous keywords
  const upperSql = trimmed.toUpperCase();
  for (const keyword of DANGEROUS_KEYWORDS) {
    // Match as whole word to avoid false positives (e.g., "CREATED_AT" matching "CREATE")
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(upperSql)) {
      // Double-check it's not part of a column/table name
      // Allow keywords that appear in identifiers like "created_at"
      const standaloneRegex = new RegExp(`(?<![_a-zA-Z])${keyword}(?![_a-zA-Z])`, 'i');
      if (standaloneRegex.test(trimmed)) {
        return { valid: false, sanitizedSql: '', error: `Forbidden keyword: ${keyword}` };
      }
    }
  }

  // Extract table names from FROM and JOIN clauses
  const tableRegex = /\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(trimmed)) !== null) {
    const tableName = match[1].toLowerCase();
    if (!ALLOWED_TABLES.includes(tableName)) {
      return { valid: false, sanitizedSql: '', error: `Table not allowed: ${tableName}` };
    }
  }

  // Append LIMIT if not present
  if (!/\bLIMIT\b/i.test(trimmed)) {
    trimmed += ' LIMIT 100';
  }

  return { valid: true, sanitizedSql: trimmed };
}
