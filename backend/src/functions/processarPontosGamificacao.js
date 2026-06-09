const pool = require('../database/pg');

module.exports = async function processarPontosGamificacao({ reseller_id, action, points, description, branch_id } = {}) {
  if (!reseller_id || action === undefined || points === undefined) {
    throw new Error('reseller_id, action e points são obrigatórios');
  }

  const existing = await pool.query(
    "SELECT id, data FROM entities WHERE entity_type = 'GamificationPoints' AND data->>'reseller_id' = $1 AND deleted_at IS NULL LIMIT 1",
    [reseller_id]
  );

  const entry = { action, points, description: description || action, date: new Date().toISOString() };

  if (existing.rows[0]) {
    const cur = existing.rows[0].data;
    const newTotal = (cur.points || 0) + points;
    const history = Array.isArray(cur.points_history) ? [...cur.points_history, entry] : [entry];
    await pool.query(
      'UPDATE entities SET data = $1, updated_date = NOW() WHERE id = $2',
      [{ ...cur, points: newTotal, points_history: history }, existing.rows[0].id]
    );
  } else {
    await pool.query(
      "INSERT INTO entities (entity_type, data) VALUES ('GamificationPoints', $1)",
      [{ reseller_id, branch_id: branch_id || null, points, points_history: [entry] }]
    );
  }

  return { success: true };
};
