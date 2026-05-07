const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, first_name, last_name, phone } = req.body;

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existing = await db.query('SELECT id FROM customers WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = await db.query(
      `INSERT INTO customers (email, first_name, last_name, phone, password_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name`,
      [email, first_name, last_name, phone || null, password_hash]
    );

    const customer = result.rows[0];
    const token = jwt.sign(
      { id: customer.id, email: customer.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, customer });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await db.query(
      'SELECT id, email, first_name, last_name, password_hash FROM customers WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const customer = result.rows[0];
    const valid = await bcrypt.compare(password, customer.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: customer.id, email: customer.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...customerData } = customer;
    res.json({ token, customer: customerData });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
