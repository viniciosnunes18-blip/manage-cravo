const router = require('express').Router();
const pool = require('../database/pg');
const { requireAuth } = require('../middleware/auth');

function rowToRecord(r) {
  return {
    ...r.data,
    id: r.id,
    created_date: r.created_date,
    updated_date: r.updated_date,
    created_by_id: r.created_by_id,
  };
}

// List / filter — GET /entities/:type?q={...}&limit=&skip=&sort_by=
router.get('/:entityType', requireAuth, async (req, res) => {
  const { entityType } = req.params;
  const { q, limit = 500, skip = 0, sort_by } = req.query;

  try {
    const conditions = [`entity_type = $1`, `deleted_at IS NULL`];
    const values = [entityType];
    let idx = 2;

    if (q) {
      let filter;
      try { filter = JSON.parse(q); } catch { return res.status(400).json({ error: 'Invalid q param' }); }
      for (const [key, value] of Object.entries(filter)) {
        if (key === 'id') {
          conditions.push(`id::text = $${idx++}`);
          values.push(String(value));
        } else {
          conditions.push(`data->>'${key}' = $${idx++}`);
          values.push(String(value));
        }
      }
    }

    let orderClause = 'ORDER BY created_date DESC';
    if (sort_by) {
      const desc = sort_by.startsWith('-');
      const field = desc ? sort_by.slice(1) : sort_by;
      const safeField = field.replace(/[^a-zA-Z0-9_]/g, '');
      orderClause = `ORDER BY data->>'${safeField}' ${desc ? 'DESC' : 'ASC'} NULLS LAST`;
    }

    const sql = `
      SELECT id, data, created_date, updated_date, created_by_id
      FROM entities
      WHERE ${conditions.join(' AND ')}
      ${orderClause}
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    values.push(parseInt(limit), parseInt(skip));

    const result = await pool.query(sql, values);
    res.json(result.rows.map(rowToRecord));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Get by ID
router.get('/:entityType/:id', requireAuth, async (req, res) => {
  const { entityType, id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM entities WHERE id = $1 AND entity_type = $2 AND deleted_at IS NULL',
      [id, entityType]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rowToRecord(result.rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create
router.post('/:entityType', requireAuth, async (req, res) => {
  const { entityType } = req.params;
  // Strip auto fields from body
  const { id: _id, created_date: _cd, updated_date: _ud, created_by_id: _cbi, ...data } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO entities (entity_type, data, created_by_id) VALUES ($1, $2, $3) RETURNING *',
      [entityType, data, req.user.id]
    );
    res.json(rowToRecord(result.rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Update (merge patch)
router.put('/:entityType/:id', requireAuth, async (req, res) => {
  const { entityType, id } = req.params;
  const { id: _id, created_date: _cd, updated_date: _ud, created_by_id: _cbi, ...updates } = req.body;
  try {
    const current = await pool.query(
      'SELECT data FROM entities WHERE id = $1 AND entity_type = $2 AND deleted_at IS NULL',
      [id, entityType]
    );
    if (!current.rows[0]) return res.status(404).json({ error: 'Not found' });

    const merged = { ...current.rows[0].data, ...updates };
    const result = await pool.query(
      'UPDATE entities SET data = $1, updated_date = NOW() WHERE id = $2 RETURNING *',
      [merged, id]
    );
    res.json(rowToRecord(result.rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Soft delete
router.delete('/:entityType/:id', requireAuth, async (req, res) => {
  const { entityType, id } = req.params;
  try {
    await pool.query(
      'UPDATE entities SET deleted_at = NOW() WHERE id = $1 AND entity_type = $2',
      [id, entityType]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Restore
router.put('/:entityType/:id/restore', requireAuth, async (req, res) => {
  const { entityType, id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE entities SET deleted_at = NULL, updated_date = NOW() WHERE id = $1 AND entity_type = $2 RETURNING *',
      [id, entityType]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rowToRecord(result.rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Bulk create
router.post('/:entityType/bulk', requireAuth, async (req, res) => {
  const { entityType } = req.params;
  const items = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Array expected' });
  try {
    const created = [];
    for (const item of items) {
      const { id: _id, created_date: _cd, updated_date: _ud, created_by_id: _cbi, ...data } = item;
      const result = await pool.query(
        'INSERT INTO entities (entity_type, data, created_by_id) VALUES ($1, $2, $3) RETURNING *',
        [entityType, data, req.user.id]
      );
      created.push(rowToRecord(result.rows[0]));
    }
    res.json(created);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete many (by filter)
router.delete('/:entityType', requireAuth, async (req, res) => {
  const { entityType } = req.params;
  const filter = req.body;
  if (!filter || Object.keys(filter).length === 0) {
    return res.status(400).json({ error: 'Filter required — refusing to delete all records' });
  }
  try {
    const conditions = [`entity_type = $1`, `deleted_at IS NULL`];
    const values = [entityType];
    let idx = 2;
    for (const [key, value] of Object.entries(filter)) {
      if (key === 'id') {
        conditions.push(`id::text = $${idx++}`);
        values.push(String(value));
      } else {
        conditions.push(`data->>'${key}' = $${idx++}`);
        values.push(String(value));
      }
    }
    const result = await pool.query(
      `UPDATE entities SET deleted_at = NOW() WHERE ${conditions.join(' AND ')} RETURNING id`,
      values
    );
    res.json({ success: true, deleted: result.rowCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
