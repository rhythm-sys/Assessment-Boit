import { LlmResponse } from '../../types';

interface Pattern {
  keywords: string[];
  response: LlmResponse;
}

const patterns: Pattern[] = [
  // Monthly onboarding applications by segment
  {
    keywords: ['monthly', 'onboarding', 'segment'],
    response: {
      table: 'onboarding_applications',
      sql: `SELECT c.segment, strftime('%Y-%m', oa.submitted_at) as month, COUNT(*) as applications
FROM onboarding_applications oa
JOIN customers c ON oa.customer_id = c.id
GROUP BY c.segment, month
ORDER BY month, c.segment`,
      displayType: 'chart',
      chartConfig: { xKey: 'month', yKey: 'applications', chartType: 'bar' },
      answerTemplate: 'Monthly onboarding applications grouped by customer segment:',
    },
  },
  // Monthly onboarding applications
  {
    keywords: ['monthly', 'onboarding'],
    response: {
      table: 'onboarding_applications',
      sql: `SELECT strftime('%Y-%m', submitted_at) as month, COUNT(*) as applications
FROM onboarding_applications
GROUP BY month
ORDER BY month`,
      displayType: 'chart',
      chartConfig: { xKey: 'month', yKey: 'applications', chartType: 'line' },
      answerTemplate: 'Monthly onboarding application trends:',
    },
  },
  // Rejection rate by branch
  {
    keywords: ['rejection', 'rate'],
    response: {
      table: 'onboarding_applications',
      sql: `SELECT b.branch_name,
  COUNT(*) as total_applications,
  SUM(CASE WHEN oa.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
  ROUND(SUM(CASE WHEN oa.status = 'rejected' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as rejection_rate
FROM onboarding_applications oa
JOIN customers c ON oa.customer_id = c.id
JOIN branches b ON c.branch_id = b.id
GROUP BY b.branch_name
ORDER BY rejection_rate DESC`,
      displayType: 'table',
      chartConfig: undefined,
      answerTemplate: 'Branch rejection rates for onboarding applications:',
    },
  },
  // Compare retail and SME
  {
    keywords: ['compare', 'retail', 'sme'],
    response: {
      table: 'onboarding_applications',
      sql: `SELECT c.segment, COUNT(*) as total_applications,
  SUM(CASE WHEN oa.status = 'approved' THEN 1 ELSE 0 END) as approved,
  SUM(CASE WHEN oa.status = 'rejected' THEN 1 ELSE 0 END) as rejected
FROM onboarding_applications oa
JOIN customers c ON oa.customer_id = c.id
WHERE c.segment IN ('retail', 'SME')
GROUP BY c.segment`,
      displayType: 'chart',
      chartConfig: { xKey: 'segment', yKey: 'total_applications', chartType: 'bar' },
      answerTemplate: 'Comparison of retail vs SME onboarding volumes:',
    },
  },
  // Retail and SME volumes (without "compare")
  {
    keywords: ['retail', 'sme'],
    response: {
      table: 'onboarding_applications',
      sql: `SELECT c.segment, COUNT(*) as total_applications
FROM onboarding_applications oa
JOIN customers c ON oa.customer_id = c.id
WHERE c.segment IN ('retail', 'SME')
GROUP BY c.segment`,
      displayType: 'chart',
      chartConfig: { xKey: 'segment', yKey: 'total_applications', chartType: 'bar' },
      answerTemplate: 'Retail and SME onboarding volumes:',
    },
  },
  // Top customers by transaction value
  {
    keywords: ['top', 'customer', 'transaction'],
    response: {
      table: 'transactions',
      sql: `SELECT c.first_name || ' ' || c.last_name as customer_name, c.segment,
  SUM(t.amount) as total_value, COUNT(*) as transaction_count
FROM transactions t
JOIN customers c ON t.customer_id = c.id
GROUP BY c.id
ORDER BY total_value DESC
LIMIT 5`,
      displayType: 'table',
      chartConfig: undefined,
      answerTemplate: 'Top 5 customers by transaction value:',
    },
  },
  // How many customers / total customers
  {
    keywords: ['how many', 'customer'],
    response: {
      table: 'customers',
      sql: 'SELECT COUNT(*) as total_customers FROM customers',
      displayType: 'kpi',
      answerTemplate: 'Total customers: {total_customers}',
    },
  },
  // Customer count
  {
    keywords: ['count', 'customer'],
    response: {
      table: 'customers',
      sql: 'SELECT COUNT(*) as total_customers FROM customers',
      displayType: 'kpi',
      answerTemplate: 'Total customers: {total_customers}',
    },
  },
  // List/show customers
  {
    keywords: ['list', 'customer'],
    response: {
      table: 'customers',
      sql: `SELECT c.first_name, c.last_name, c.email, c.segment, b.branch_name
FROM customers c JOIN branches b ON c.branch_id = b.id
ORDER BY c.last_name LIMIT 20`,
      displayType: 'table',
      answerTemplate: 'Customer listing ({rowCount} shown):',
    },
  },
  {
    keywords: ['show', 'customer'],
    response: {
      table: 'customers',
      sql: `SELECT c.first_name, c.last_name, c.email, c.segment, b.branch_name
FROM customers c JOIN branches b ON c.branch_id = b.id
ORDER BY c.last_name LIMIT 20`,
      displayType: 'table',
      answerTemplate: 'Customer listing ({rowCount} shown):',
    },
  },
  // Customers by branch
  {
    keywords: ['customer', 'branch'],
    response: {
      table: 'customers',
      sql: `SELECT b.branch_name, COUNT(*) as customer_count
FROM customers c JOIN branches b ON c.branch_id = b.id
GROUP BY b.branch_name
ORDER BY customer_count DESC`,
      displayType: 'chart',
      chartConfig: { xKey: 'branch_name', yKey: 'customer_count', chartType: 'bar' },
      answerTemplate: 'Customer distribution across branches:',
    },
  },
  // Transaction volume / total transactions
  {
    keywords: ['transaction', 'volume'],
    response: {
      table: 'transactions',
      sql: 'SELECT COUNT(*) as total_transactions, ROUND(SUM(amount), 2) as total_volume FROM transactions',
      displayType: 'kpi',
      answerTemplate: 'Total transaction volume: ₹{total_volume} across {total_transactions} transactions',
    },
  },
  // Average transaction
  {
    keywords: ['average', 'transaction'],
    response: {
      table: 'transactions',
      sql: 'SELECT ROUND(AVG(amount), 2) as avg_amount FROM transactions',
      displayType: 'kpi',
      answerTemplate: 'Average transaction amount: ₹{avg_amount}',
    },
  },
  // Transactions by type
  {
    keywords: ['transaction', 'type'],
    response: {
      table: 'transactions',
      sql: `SELECT type, COUNT(*) as count, ROUND(SUM(amount), 2) as total_amount
FROM transactions GROUP BY type ORDER BY total_amount DESC`,
      displayType: 'chart',
      chartConfig: { xKey: 'type', yKey: 'total_amount', chartType: 'bar' },
      answerTemplate: 'Transaction breakdown by type:',
    },
  },
  // Recent transactions
  {
    keywords: ['recent', 'transaction'],
    response: {
      table: 'transactions',
      sql: `SELECT t.transaction_date, c.first_name || ' ' || c.last_name as customer,
  t.type, t.amount, t.description
FROM transactions t JOIN customers c ON t.customer_id = c.id
ORDER BY t.transaction_date DESC LIMIT 10`,
      displayType: 'table',
      answerTemplate: 'Most recent transactions:',
    },
  },
  // Application status / onboarding status
  {
    keywords: ['application', 'status'],
    response: {
      table: 'onboarding_applications',
      sql: `SELECT status, COUNT(*) as count FROM onboarding_applications GROUP BY status ORDER BY count DESC`,
      displayType: 'chart',
      chartConfig: { xKey: 'status', yKey: 'count', chartType: 'pie' },
      answerTemplate: 'Onboarding application status breakdown:',
    },
  },
  // Pending applications
  {
    keywords: ['pending', 'application'],
    response: {
      table: 'onboarding_applications',
      sql: `SELECT c.first_name || ' ' || c.last_name as customer, oa.application_type, oa.submitted_at
FROM onboarding_applications oa
JOIN customers c ON oa.customer_id = c.id
WHERE oa.status = 'pending'
ORDER BY oa.submitted_at DESC`,
      displayType: 'table',
      answerTemplate: 'Pending onboarding applications ({rowCount} found):',
    },
  },
  // List/show branches
  {
    keywords: ['branch'],
    response: {
      table: 'branches',
      sql: 'SELECT branch_name, city, state, opened_date FROM branches ORDER BY branch_name',
      displayType: 'table',
      answerTemplate: 'All branches:',
    },
  },
  // Customers by segment
  {
    keywords: ['segment'],
    response: {
      table: 'customers',
      sql: `SELECT segment, COUNT(*) as count FROM customers GROUP BY segment ORDER BY count DESC`,
      displayType: 'chart',
      chartConfig: { xKey: 'segment', yKey: 'count', chartType: 'pie' },
      answerTemplate: 'Customer distribution by segment:',
    },
  },
];

export function mockLlm(question: string): LlmResponse | null {
  const lower = question.toLowerCase();

  for (const pattern of patterns) {
    const allMatch = pattern.keywords.every((kw) => lower.includes(kw.toLowerCase()));
    if (allMatch) {
      return { ...pattern.response };
    }
  }

  return null;
}
