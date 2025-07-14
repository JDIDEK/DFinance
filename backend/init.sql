-- DFinance Database Schema
-- Advanced Personal Finance Tracker

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  color VARCHAR(7) DEFAULT '#FF6B00',
  icon VARCHAR(50) DEFAULT '💰',
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  payment_method VARCHAR(20) DEFAULT 'cash',
  notes TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goals table for financial objectives
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  target_amount NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) DEFAULT 0,
  target_date DATE,
  category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budgets table for monthly limits
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  monthly_limit NUMERIC(12,2) NOT NULL,
  spent_amount NUMERIC(12,2) DEFAULT 0,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, month, year, user_id)
);

-- Insert default categories
INSERT INTO categories (name, type, color, icon, user_id) VALUES
('Salary', 'income', '#00FF88', '💰', NULL),
('Freelance', 'income', '#00DD77', '💻', NULL),
('Investment', 'income', '#00BB66', '📈', NULL),
('Gift', 'income', '#009955', '🎁', NULL),
('Food & Groceries', 'expense', '#FF6B00', '🍕', NULL),
('Transport', 'expense', '#FF8C00', '🚗', NULL),
('Housing & Utilities', 'expense', '#FF4500', '🏠', NULL),
('Entertainment', 'expense', '#FF2D00', '🎬', NULL),
('Health', 'expense', '#E6001A', '🏥', NULL),
('Shopping', 'expense', '#CC0015', '🛍️', NULL),
('Education', 'expense', '#B30012', '📚', NULL),
('Technology', 'expense', '#99000F', '💻', NULL)
ON CONFLICT DO NOTHING;

-- Insert sample data for demo
INSERT INTO transactions (type, description, amount, date, category, payment_method, notes, user_id) VALUES
('income', 'Monthly Salary', 3500.00, '2025-01-01', 'Salary', 'bank_transfer', 'January salary payment', NULL),
('expense', 'Grocery Shopping', 85.50, '2025-01-02', 'Food & Groceries', 'credit_card', 'Weekly groceries', NULL),
('expense', 'Gas Station', 65.00, '2025-01-03', 'Transport', 'credit_card', 'Full tank', NULL),
('expense', 'Netflix Subscription', 15.99, '2025-01-04', 'Entertainment', 'credit_card', 'Monthly subscription', NULL),
('income', 'Freelance Project', 800.00, '2025-01-05', 'Freelance', 'bank_transfer', 'Web development project', NULL),
('expense', 'Restaurant Dinner', 45.00, '2025-01-06', 'Food & Groceries', 'credit_card', 'Date night', NULL),
('expense', 'Electricity Bill', 120.00, '2025-01-07', 'Housing & Utilities', 'bank_transfer', 'Monthly electricity', NULL)
ON CONFLICT DO NOTHING;

-- Insert sample goals
INSERT INTO goals (title, description, target_amount, current_amount, target_date, category, user_id) VALUES
('Emergency Fund', 'Build an emergency fund for unexpected expenses', 5000.00, 1200.00, '2025-12-31', 'Savings', NULL),
('Vacation Fund', 'Save for summer vacation in Italy', 2500.00, 450.00, '2025-06-30', 'Travel', NULL),
('New Laptop', 'Save for a new MacBook Pro', 2000.00, 600.00, '2025-04-30', 'Technology', NULL)
ON CONFLICT DO NOTHING;

-- Insert sample budgets for current month
INSERT INTO budgets (category, monthly_limit, spent_amount, month, year, user_id) VALUES
('Food & Groceries', 400.00, 130.50, 1, 2025, NULL),
('Transport', 200.00, 65.00, 1, 2025, NULL),
('Entertainment', 150.00, 15.99, 1, 2025, NULL),
('Housing & Utilities', 800.00, 120.00, 1, 2025, NULL),
('Shopping', 300.00, 0.00, 1, 2025, NULL)
ON CONFLICT DO NOTHING;