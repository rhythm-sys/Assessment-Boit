import db from './connection';

// Clear existing data
db.exec('DELETE FROM transactions');
db.exec('DELETE FROM onboarding_applications');
db.exec('DELETE FROM customers');
db.exec('DELETE FROM branches');

// Seed branches
const branches = [
  { name: 'Downtown Central', city: 'Mumbai', state: 'Maharashtra', opened: '2019-03-15' },
  { name: 'Westside Plaza', city: 'Delhi', state: 'Delhi', opened: '2020-06-01' },
  { name: 'Tech Park', city: 'Bangalore', state: 'Karnataka', opened: '2018-11-20' },
  { name: 'Harbor View', city: 'Chennai', state: 'Tamil Nadu', opened: '2021-01-10' },
  { name: 'Green Valley', city: 'Pune', state: 'Maharashtra', opened: '2022-04-05' },
];

const insertBranch = db.prepare(
  'INSERT INTO branches (branch_name, city, state, opened_date) VALUES (?, ?, ?, ?)'
);
for (const b of branches) {
  insertBranch.run(b.name, b.city, b.state, b.opened);
}

// Seed customers
const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Priya', 'Ananya', 'Diya', 'Meera', 'Saanvi', 'Aisha', 'Kavya', 'Riya', 'Neha', 'Pooja',
  'Rohan', 'Kunal', 'Amit', 'Suresh', 'Vikram', 'Deepak', 'Rahul', 'Nikhil', 'Manish', 'Rajesh'];
const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Nair', 'Joshi', 'Verma', 'Mehta',
  'Das', 'Iyer', 'Chopra', 'Malhotra', 'Bhat', 'Rao', 'Pillai', 'Kulkarni', 'Deshmukh', 'Banerjee',
  'Agarwal', 'Mishra', 'Saxena', 'Kapoor', 'Tiwari', 'Chauhan', 'Pandey', 'Dubey', 'Srivastava', 'Goyal'];
const segments: Array<'retail' | 'SME' | 'corporate'> = ['retail', 'SME', 'corporate'];

const insertCustomer = db.prepare(
  'INSERT INTO customers (first_name, last_name, email, segment, branch_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
);

const customerDates = [
  '2023-01-15', '2023-02-20', '2023-03-10', '2023-04-05', '2023-05-12',
  '2023-06-18', '2023-07-22', '2023-08-30', '2023-09-14', '2023-10-25',
  '2023-11-08', '2023-12-03', '2024-01-17', '2024-02-28', '2024-03-11',
  '2024-04-22', '2024-05-06', '2024-06-19', '2024-07-31', '2024-08-14',
  '2024-09-02', '2024-10-16', '2024-11-27', '2024-12-09', '2025-01-13',
  '2025-02-24', '2025-03-07', '2025-04-18', '2025-05-30', '2025-06-11',
];

for (let i = 0; i < 30; i++) {
  const fn = firstNames[i];
  const ln = lastNames[i];
  const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@email.com`;
  const segment = segments[i % 3];
  const branchId = (i % 5) + 1;
  const createdAt = customerDates[i];
  insertCustomer.run(fn, ln, email, segment, branchId, createdAt);
}

// Seed onboarding applications
const appTypes: Array<'savings' | 'checking' | 'loan' | 'credit_card'> = ['savings', 'checking', 'loan', 'credit_card'];
const statuses: Array<'pending' | 'approved' | 'rejected' | 'withdrawn'> = ['pending', 'approved', 'rejected', 'withdrawn'];

const insertApp = db.prepare(
  'INSERT INTO onboarding_applications (customer_id, application_type, status, submitted_at, decided_at) VALUES (?, ?, ?, ?, ?)'
);

const appMonths = [
  '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
  '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
];

for (let i = 0; i < 50; i++) {
  const customerId = (i % 30) + 1;
  const appType = appTypes[i % 4];
  const status = statuses[i % 4];
  const month = appMonths[i % 12];
  const day = String((i % 28) + 1).padStart(2, '0');
  const submittedAt = `${month}-${day}`;
  const decidedAt = status === 'pending' ? null : `${month}-${Math.min(parseInt(day) + 5, 28).toString().padStart(2, '0')}`;
  insertApp.run(customerId, appType, status, submittedAt, decidedAt);
}

// Seed transactions
const txnTypes: Array<'deposit' | 'withdrawal' | 'transfer' | 'payment'> = ['deposit', 'withdrawal', 'transfer', 'payment'];
const descriptions = [
  'Salary credit', 'ATM withdrawal', 'Online transfer', 'Bill payment',
  'Vendor payment', 'Rent deposit', 'Insurance premium', 'Loan EMI',
  'Investment transfer', 'Utility bill', 'Grocery purchase', 'Fuel expense',
  'Subscription fee', 'Refund credit', 'Cash deposit', 'Wire transfer',
  'Tax payment', 'Dividend credit', 'Service charge', 'Maintenance fee',
];

const amounts = [
  1500, 2500, 5000, 7500, 10000, 12500, 15000, 20000, 25000, 30000,
  35000, 40000, 45000, 50000, 75000, 100000, 125000, 150000, 200000, 500000,
];

const insertTxn = db.prepare(
  'INSERT INTO transactions (customer_id, type, amount, description, transaction_date) VALUES (?, ?, ?, ?, ?)'
);

for (let i = 0; i < 100; i++) {
  const customerId = (i % 30) + 1;
  const txnType = txnTypes[i % 4];
  const amount = amounts[i % 20];
  const desc = descriptions[i % 20];
  const month = appMonths[i % 12];
  const day = String((i % 28) + 1).padStart(2, '0');
  const txnDate = `${month}-${day}`;
  insertTxn.run(customerId, txnType, amount, desc, txnDate);
}

console.log('Database seeded successfully!');
const count = (table: string) =>
  (db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number }).c;
console.log(`  Branches: ${count('branches')}`);
console.log(`  Customers: ${count('customers')}`);
console.log(`  Applications: ${count('onboarding_applications')}`);
console.log(`  Transactions: ${count('transactions')}`);

process.exit(0);
