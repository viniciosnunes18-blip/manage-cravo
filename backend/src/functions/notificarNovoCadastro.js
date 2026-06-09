const pool = require('../database/pg');

module.exports = async function notificarNovoCadastro({ reseller_id } = {}) {
  if (!reseller_id) return { success: false, error: 'reseller_id required' };

  const res = await pool.query(
    "SELECT data FROM entities WHERE id = $1 AND entity_type = 'Reseller' AND deleted_at IS NULL",
    [reseller_id]
  );
  if (!res.rows[0]) return { success: false };
  const reseller = res.rows[0].data;

  await pool.query(
    "INSERT INTO entities (entity_type, data) VALUES ('Notification', $1)",
    [{
      branch_id: reseller.branch_id,
      type: 'novo_cadastro',
      title: 'Novo cadastro pendente',
      message: `${reseller.full_name}${reseller.city ? ` de ${reseller.city}` : ''} solicitou cadastro.`,
      reseller_id,
      is_read: false,
    }]
  );

  return { success: true };
};
