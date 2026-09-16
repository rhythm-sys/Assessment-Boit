import { describe, it, expect } from 'vitest';
import { validateSql } from '../src/services/sqlValidator';

describe('sqlValidator', () => {
  it('accepts valid SELECT statements', () => {
    const result = validateSql('SELECT * FROM customers');
    expect(result.valid).toBe(true);
    expect(result.sanitizedSql).toContain('SELECT * FROM customers');
  });

  it('appends LIMIT 100 when no LIMIT present', () => {
    const result = validateSql('SELECT * FROM customers');
    expect(result.sanitizedSql).toBe('SELECT * FROM customers LIMIT 100');
  });

  it('preserves existing LIMIT', () => {
    const result = validateSql('SELECT * FROM customers LIMIT 10');
    expect(result.sanitizedSql).toBe('SELECT * FROM customers LIMIT 10');
  });

  it('rejects INSERT statements', () => {
    const result = validateSql("INSERT INTO customers VALUES (1, 'test')");
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Only SELECT');
  });

  it('rejects DELETE statements', () => {
    const result = validateSql('DELETE FROM customers');
    expect(result.valid).toBe(false);
  });

  it('rejects DROP statements', () => {
    const result = validateSql('DROP TABLE customers');
    expect(result.valid).toBe(false);
  });

  it('rejects UPDATE statements', () => {
    const result = validateSql("UPDATE customers SET name = 'x'");
    expect(result.valid).toBe(false);
  });

  it('rejects tables not in allowlist', () => {
    const result = validateSql('SELECT * FROM secret_data');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('rejects multi-statement SQL (semicolon injection)', () => {
    const result = validateSql('SELECT * FROM customers; DROP TABLE customers');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Multiple');
  });

  it('rejects empty input', () => {
    const result = validateSql('');
    expect(result.valid).toBe(false);
  });

  it('handles case-insensitive keywords', () => {
    const result = validateSql('select * from CUSTOMERS');
    expect(result.valid).toBe(true);
  });

  it('allows JOIN queries with allowed tables', () => {
    const result = validateSql(
      'SELECT c.first_name FROM customers c JOIN branches b ON c.branch_id = b.id'
    );
    expect(result.valid).toBe(true);
  });

  it('rejects JOIN with disallowed table', () => {
    const result = validateSql(
      'SELECT * FROM customers JOIN admin_users ON customers.id = admin_users.id'
    );
    expect(result.valid).toBe(false);
  });

  it('strips trailing semicolon', () => {
    const result = validateSql('SELECT * FROM customers;');
    expect(result.valid).toBe(true);
    expect(result.sanitizedSql).not.toContain(';');
  });
});
