import type { VercelRequest, VercelResponse } from '@vercel/node';
import initSqlJs, { type Database } from 'sql.js';
import path from 'path';

// ─── Types ───────────────────────────────────────────────────────────
interface ChartConfig {
  xKey: string;
  yKey: string;
  chartType: 'bar' | 'line' | 'pie';
}

type DisplayType = 'text' | 'table' | 'chart' | 'kpi';

interface LlmResponse {
  sql: string;
  displayType: DisplayType;
  chartConfig?: ChartConfig;
  answerTemplate: string;
}

// ─── SQL Validator ───────────────────────────────────────────────────
const ALLOWED_TABLES = ['branches', 'customers', 'onboarding_applications', 'transactions'];
const DANGEROUS_KEYWORDS = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'ATTACH', 'DETACH', 'REPLACE', 'TRUNCATE'];

function validateSql(sql: string): { valid: boolean; sanitizedSql: string; error?: string } {
  if (!sql || sql.trim().length === 0) return { valid: false, sanitizedSql: '', error: 'Empty SQL' };

  let trimmed = sql.trim();
  if (trimmed.endsWith(';')) trimmed = trimmed.slice(0, -1).trim();
  if (trimmed.includes(';')) return { valid: false, sanitizedSql: '', error: 'Multiple statements not allowed' };
  if (!trimmed.toUpperCase().startsWith('SELECT')) return { valid: false, sanitizedSql: '', error: 'Only SELECT allowed' };

  for (const kw of DANGEROUS_KEYWORDS) {
    const regex = new RegExp(`(?<![_a-zA-Z])${kw}(?![_a-zA-Z])`, 'i');
    if (regex.test(trimmed)) return { valid: false, sanitizedSql: '', error: `Forbidden: ${kw}` };
  }

  const tableRegex = /\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(trimmed)) !== null) {
    if (!ALLOWED_TABLES.includes(match[1].toLowerCase())) {
      return { valid: false, sanitizedSql: '', error: `Table not allowed: ${match[1]}` };
    }
  }

  if (!/\bLIMIT\b/i.test(trimmed)) trimmed += ' LIMIT 100';
  return { valid: true, sanitizedSql: trimmed };
}

// ─── Mock LLM ────────────────────────────────────────────────────────
interface Pattern { keywords: string[]; response: LlmResponse }

const patterns: Pattern[] = [
  { keywords: ['monthly', 'onboarding', 'segment'], response: { sql: `SELECT c.segment, strftime('%Y-%m', oa.submitted_at) as month, COUNT(*) as applications FROM onboarding_applications oa JOIN customers c ON oa.customer_id = c.id GROUP BY c.segment, month ORDER BY month, c.segment`, displayType: 'chart', chartConfig: { xKey: 'month', yKey: 'applications', chartType: 'bar' }, answerTemplate: 'Monthly onboarding applications grouped by customer segment:' } },
  { keywords: ['monthly', 'onboarding'], response: { sql: `SELECT strftime('%Y-%m', submitted_at) as month, COUNT(*) as applications FROM onboarding_applications GROUP BY month ORDER BY month`, displayType: 'chart', chartConfig: { xKey: 'month', yKey: 'applications', chartType: 'line' }, answerTemplate: 'Monthly onboarding application trends:' } },
  { keywords: ['rejection', 'rate'], response: { sql: `SELECT b.branch_name, COUNT(*) as total_applications, SUM(CASE WHEN oa.status = 'rejected' THEN 1 ELSE 0 END) as rejected, ROUND(SUM(CASE WHEN oa.status = 'rejected' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as rejection_rate FROM onboarding_applications oa JOIN customers c ON oa.customer_id = c.id JOIN branches b ON c.branch_id = b.id GROUP BY b.branch_name ORDER BY rejection_rate DESC`, displayType: 'table', answerTemplate: 'Branch rejection rates for onboarding applications:' } },
  { keywords: ['compare', 'retail', 'sme'], response: { sql: `SELECT c.segment, COUNT(*) as total_applications, SUM(CASE WHEN oa.status = 'approved' THEN 1 ELSE 0 END) as approved, SUM(CASE WHEN oa.status = 'rejected' THEN 1 ELSE 0 END) as rejected FROM onboarding_applications oa JOIN customers c ON oa.customer_id = c.id WHERE c.segment IN ('retail', 'SME') GROUP BY c.segment`, displayType: 'chart', chartConfig: { xKey: 'segment', yKey: 'total_applications', chartType: 'bar' }, answerTemplate: 'Comparison of retail vs SME onboarding volumes:' } },
  { keywords: ['retail', 'sme'], response: { sql: `SELECT c.segment, COUNT(*) as total_applications FROM onboarding_applications oa JOIN customers c ON oa.customer_id = c.id WHERE c.segment IN ('retail', 'SME') GROUP BY c.segment`, displayType: 'chart', chartConfig: { xKey: 'segment', yKey: 'total_applications', chartType: 'bar' }, answerTemplate: 'Retail and SME onboarding volumes:' } },
  { keywords: ['top', 'customer', 'transaction'], response: { sql: `SELECT c.first_name || ' ' || c.last_name as customer_name, c.segment, SUM(t.amount) as total_value, COUNT(*) as transaction_count FROM transactions t JOIN customers c ON t.customer_id = c.id GROUP BY c.id ORDER BY total_value DESC LIMIT 5`, displayType: 'table', answerTemplate: 'Top 5 customers by transaction value:' } },
  { keywords: ['how many', 'customer'], response: { sql: 'SELECT COUNT(*) as total_customers FROM customers', displayType: 'kpi', answerTemplate: 'Total customers: {total_customers}' } },
  { keywords: ['count', 'customer'], response: { sql: 'SELECT COUNT(*) as total_customers FROM customers', displayType: 'kpi', answerTemplate: 'Total customers: {total_customers}' } },
  { keywords: ['list', 'customer'], response: { sql: `SELECT c.first_name, c.last_name, c.email, c.segment, b.branch_name FROM customers c JOIN branches b ON c.branch_id = b.id ORDER BY c.last_name LIMIT 20`, displayType: 'table', answerTemplate: 'Customer listing ({rowCount} shown):' } },
  { keywords: ['show', 'customer'], response: { sql: `SELECT c.first_name, c.last_name, c.email, c.segment, b.branch_name FROM customers c JOIN branches b ON c.branch_id = b.id ORDER BY c.last_name LIMIT 20`, displayType: 'table', answerTemplate: 'Customer listing ({rowCount} shown):' } },
  { keywords: ['customer', 'branch'], response: { sql: `SELECT b.branch_name, COUNT(*) as customer_count FROM customers c JOIN branches b ON c.branch_id = b.id GROUP BY b.branch_name ORDER BY customer_count DESC`, displayType: 'chart', chartConfig: { xKey: 'branch_name', yKey: 'customer_count', chartType: 'bar' }, answerTemplate: 'Customer distribution across branches:' } },
  { keywords: ['transaction', 'volume'], response: { sql: 'SELECT COUNT(*) as total_transactions, ROUND(SUM(amount), 2) as total_volume FROM transactions', displayType: 'kpi', answerTemplate: 'Total transaction volume: ₹{total_volume} across {total_transactions} transactions' } },
  { keywords: ['average', 'transaction'], response: { sql: 'SELECT ROUND(AVG(amount), 2) as avg_amount FROM transactions', displayType: 'kpi', answerTemplate: 'Average transaction amount: ₹{avg_amount}' } },
  { keywords: ['transaction', 'type'], response: { sql: `SELECT type, COUNT(*) as count, ROUND(SUM(amount), 2) as total_amount FROM transactions GROUP BY type ORDER BY total_amount DESC`, displayType: 'chart', chartConfig: { xKey: 'type', yKey: 'total_amount', chartType: 'bar' }, answerTemplate: 'Transaction breakdown by type:' } },
  { keywords: ['recent', 'transaction'], response: { sql: `SELECT t.transaction_date, c.first_name || ' ' || c.last_name as customer, t.type, t.amount, t.description FROM transactions t JOIN customers c ON t.customer_id = c.id ORDER BY t.transaction_date DESC LIMIT 10`, displayType: 'table', answerTemplate: 'Most recent transactions:' } },
  { keywords: ['application', 'status'], response: { sql: `SELECT status, COUNT(*) as count FROM onboarding_applications GROUP BY status ORDER BY count DESC`, displayType: 'chart', chartConfig: { xKey: 'status', yKey: 'count', chartType: 'pie' }, answerTemplate: 'Onboarding application status breakdown:' } },
  { keywords: ['pending', 'application'], response: { sql: `SELECT c.first_name || ' ' || c.last_name as customer, oa.application_type, oa.submitted_at FROM onboarding_applications oa JOIN customers c ON oa.customer_id = c.id WHERE oa.status = 'pending' ORDER BY oa.submitted_at DESC`, displayType: 'table', answerTemplate: 'Pending onboarding applications ({rowCount} found):' } },
  { keywords: ['branch'], response: { sql: 'SELECT branch_name, city, state, opened_date FROM branches ORDER BY branch_name', displayType: 'table', answerTemplate: 'All branches:' } },
  { keywords: ['segment'], response: { sql: `SELECT segment, COUNT(*) as count FROM customers GROUP BY segment ORDER BY count DESC`, displayType: 'chart', chartConfig: { xKey: 'segment', yKey: 'count', chartType: 'pie' }, answerTemplate: 'Customer distribution by segment:' } },
];

function mockLlm(question: string): LlmResponse | null {
  const lower = question.toLowerCase();
  for (const p of patterns) {
    if (p.keywords.every((kw) => lower.includes(kw.toLowerCase()))) return { ...p.response };
  }
  return null;
}

// ─── Database Setup ──────────────────────────────────────────────────
let dbInstance: Database | null = null;

async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs({
    locateFile: (file: string) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
  });
  const db = new SQL.Database();

  // Schema
  db.run(`
    CREATE TABLE branches (id INTEGER PRIMARY KEY AUTOINCREMENT, branch_name TEXT NOT NULL, city TEXT NOT NULL, state TEXT NOT NULL, opened_date TEXT NOT NULL);
    CREATE TABLE customers (id INTEGER PRIMARY KEY AUTOINCREMENT, first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, segment TEXT NOT NULL, branch_id INTEGER NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE onboarding_applications (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL, application_type TEXT NOT NULL, status TEXT NOT NULL, submitted_at TEXT NOT NULL, decided_at TEXT);
    CREATE TABLE transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL, type TEXT NOT NULL, amount REAL NOT NULL, description TEXT, transaction_date TEXT NOT NULL);
  `);

  // Seed branches
  const branches = [
    ['Downtown Central', 'Mumbai', 'Maharashtra', '2019-03-15'],
    ['Westside Plaza', 'Delhi', 'Delhi', '2020-06-01'],
    ['Tech Park', 'Bangalore', 'Karnataka', '2018-11-20'],
    ['Harbor View', 'Chennai', 'Tamil Nadu', '2021-01-10'],
    ['Green Valley', 'Pune', 'Maharashtra', '2022-04-05'],
  ];
  for (const b of branches) db.run('INSERT INTO branches (branch_name, city, state, opened_date) VALUES (?,?,?,?)', b);

  // Seed customers
  const firstNames = ['Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Ayaan','Krishna','Ishaan','Priya','Ananya','Diya','Meera','Saanvi','Aisha','Kavya','Riya','Neha','Pooja','Rohan','Kunal','Amit','Suresh','Vikram','Deepak','Rahul','Nikhil','Manish','Rajesh'];
  const lastNames = ['Sharma','Patel','Singh','Kumar','Gupta','Reddy','Nair','Joshi','Verma','Mehta','Das','Iyer','Chopra','Malhotra','Bhat','Rao','Pillai','Kulkarni','Deshmukh','Banerjee','Agarwal','Mishra','Saxena','Kapoor','Tiwari','Chauhan','Pandey','Dubey','Srivastava','Goyal'];
  const segments = ['retail', 'SME', 'corporate'];
  const customerDates = ['2023-01-15','2023-02-20','2023-03-10','2023-04-05','2023-05-12','2023-06-18','2023-07-22','2023-08-30','2023-09-14','2023-10-25','2023-11-08','2023-12-03','2024-01-17','2024-02-28','2024-03-11','2024-04-22','2024-05-06','2024-06-19','2024-07-31','2024-08-14','2024-09-02','2024-10-16','2024-11-27','2024-12-09','2025-01-13','2025-02-24','2025-03-07','2025-04-18','2025-05-30','2025-06-11'];

  for (let i = 0; i < 30; i++) {
    db.run('INSERT INTO customers (first_name, last_name, email, segment, branch_id, created_at) VALUES (?,?,?,?,?,?)',
      [firstNames[i], lastNames[i], `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@email.com`, segments[i % 3], (i % 5) + 1, customerDates[i]]);
  }

  // Seed applications
  const appTypes = ['savings', 'checking', 'loan', 'credit_card'];
  const statuses = ['pending', 'approved', 'rejected', 'withdrawn'];
  const months = ['2024-01','2024-02','2024-03','2024-04','2024-05','2024-06','2024-07','2024-08','2024-09','2024-10','2024-11','2024-12'];

  for (let i = 0; i < 50; i++) {
    const day = String((i % 28) + 1).padStart(2, '0');
    const status = statuses[i % 4];
    const decidedAt = status === 'pending' ? null : `${months[i % 12]}-${Math.min(parseInt(day) + 5, 28).toString().padStart(2, '0')}`;
    db.run('INSERT INTO onboarding_applications (customer_id, application_type, status, submitted_at, decided_at) VALUES (?,?,?,?,?)',
      [(i % 30) + 1, appTypes[i % 4], status, `${months[i % 12]}-${day}`, decidedAt]);
  }

  // Seed transactions
  const txnTypes = ['deposit', 'withdrawal', 'transfer', 'payment'];
  const descriptions = ['Salary credit','ATM withdrawal','Online transfer','Bill payment','Vendor payment','Rent deposit','Insurance premium','Loan EMI','Investment transfer','Utility bill','Grocery purchase','Fuel expense','Subscription fee','Refund credit','Cash deposit','Wire transfer','Tax payment','Dividend credit','Service charge','Maintenance fee'];
  const amounts = [1500,2500,5000,7500,10000,12500,15000,20000,25000,30000,35000,40000,45000,50000,75000,100000,125000,150000,200000,500000];

  for (let i = 0; i < 100; i++) {
    const day = String((i % 28) + 1).padStart(2, '0');
    db.run('INSERT INTO transactions (customer_id, type, amount, description, transaction_date) VALUES (?,?,?,?,?)',
      [(i % 30) + 1, txnTypes[i % 4], amounts[i % 20], descriptions[i % 20], `${months[i % 12]}-${day}`]);
  }

  dbInstance = db;
  return db;
}

// ─── Handler ─────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ answer: 'Method not allowed', displayType: 'text' });

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ answer: 'Please provide a valid question.', displayType: 'text', error: 'Empty message' });
    }
    if (message.length > 500) {
      return res.status(400).json({ answer: 'Question too long. Keep it under 500 characters.', displayType: 'text', error: 'Too long' });
    }

    const llmResult = mockLlm(message.trim());
    if (!llmResult) {
      return res.json({ answer: "I couldn't understand that question. Try asking about customers, transactions, branches, onboarding applications, or segments.", displayType: 'text' });
    }

    const validation = validateSql(llmResult.sql);
    if (!validation.valid) {
      return res.status(400).json({ answer: 'Query could not be validated.', displayType: 'text', error: validation.error });
    }

    const db = await getDb();
    const results = db.exec(validation.sanitizedSql);

    let columns: string[] = [];
    let rows: Record<string, unknown>[] = [];

    if (results.length > 0) {
      columns = results[0].columns;
      rows = results[0].values.map((row) => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
    }

    // Format answer
    let answer = llmResult.answerTemplate;
    if (rows.length > 0) {
      for (const [key, value] of Object.entries(rows[0])) {
        answer = answer.replace(`{${key}}`, String(value ?? 'N/A'));
      }
      answer = answer.replace('{rowCount}', String(rows.length));
    }

    const response: Record<string, unknown> = { answer, displayType: llmResult.displayType, sql: validation.sanitizedSql, data: rows, columns };

    if (llmResult.displayType === 'kpi' && rows.length > 0) {
      response.kpiValue = Object.values(rows[0])[0];
    }
    if (llmResult.chartConfig) {
      response.chartConfig = llmResult.chartConfig;
    }

    return res.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return res.status(500).json({ answer: 'Something went wrong.', displayType: 'text', error: msg });
  }
}
