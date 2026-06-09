const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../database/pg');
const { requireAuth } = require('../middleware/auth');

function safeUser(u) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    branch_id: u.branch_id || null,
    branch_name: u.branch_name || null,
    first_access: u.first_access || false,
  };
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

  try {
    const result = await pool.query('SELECT * FROM auth_users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token, user: safeUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json(safeUser(req.user));
});

router.post('/logout', (req, res) => res.json({ success: true }));

// Create or update auth user (admin only)
router.post('/users', requireAuth, async (req, res) => {
  if (req.user.role !== 'matriz' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { email, full_name, password, role, branch_id, branch_name } = req.body;
  if (!email || !full_name || !password) {
    return res.status(400).json({ error: 'email, full_name e password são obrigatórios' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO auth_users (email, full_name, password_hash, role, branch_id, branch_name, first_access)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (email) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         branch_id = EXCLUDED.branch_id,
         branch_name = EXCLUDED.branch_name
       RETURNING *`,
      [email.toLowerCase(), full_name, hash, role || 'user', branch_id || null, branch_name || null]
    );
    res.json(safeUser(result.rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/users', requireAuth, async (req, res) => {
  if (req.user.role !== 'matriz' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const result = await pool.query('SELECT * FROM auth_users ORDER BY created_at DESC');
    res.json(result.rows.map(safeUser));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
