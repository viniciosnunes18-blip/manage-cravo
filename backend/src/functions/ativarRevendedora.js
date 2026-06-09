const pool = require('../database/pg');

module.exports = async function ativarRevendedora({ reseller_id, event_type } = {}) {
  if (!reseller_id) throw new Error('reseller_id required');

  const res = await pool.query(
    "SELECT id, data FROM entities WHERE id = $1 AND entity_type = 'Reseller' AND deleted_at IS NULL",
    [reseller_id]
  );
  if (!res.rows[0]) throw new Error('Reseller not found');
  const reseller = res.rows[0].data;

  if (reseller.branch_id) {
    const notifType = event_type === 'approved' ? 'revendedora_ativada' : 'cadastro_reprovado';
    const title = event_type === 'approved' ? 'Revendedora ativada' : 'Cadastro reprovado';
    const message = event_type === 'approved'
      ? `${reseller.full_name} foi aprovada e está ativa.`
      : `O cadastro de ${reseller.full_name} foi reprovado.`;

    await pool.query(
      "INSERT INTO entities (entity_type, data) VALUES ('Notification', $1)",
      [{ branch_id: reseller.branch_id, type: notifType, title, message, reseller_id, is_read: false }]
    );
  }

  await pool.query(
    "INSERT INTO entities (entity_type, data) VALUES ('Log', $1)",
    [{
      type: event_type === 'approved' ? 'cadastro_aprovado' : 'cadastro_reprovado',
      reseller_id,
      branch_id: reseller.branch_id,
      details: `Revendedora ${reseller.full_name} — ${event_type}`,
      timestamp: new Date().toISOString(),
    }]
  );

  return { success: true };
};
