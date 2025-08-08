const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
  const router = express.Router();

  // User registration
  router.post('/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role`,
        [username, email, hashedPassword]
      );

      const user = result.rows[0];
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'dfinance-secret',
        { expiresIn: '1h' }
      );

      res.status(201).json({ token, user });
    } catch (err) {
      console.error('Error registering user:', err);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // User login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'dfinance-secret',
        { expiresIn: '1h' }
      );

      res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (err) {
      console.error('Error logging in:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  return router;
};

