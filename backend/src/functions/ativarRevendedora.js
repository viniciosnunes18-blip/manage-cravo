const pool = require('../database/pg');
const nodemailer = require('nodemailer');

// Cria transporter apenas se SMTP estiver configurado
function getMailer() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function templateAprovacao(reseller, senha, branchName) {
  return `
<div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FAF8F4; border: 1px solid #E8E2D8; border-radius: 16px; overflow: hidden;">
  <div style="background: #1F3D2E; padding: 32px; text-align: center;">
    <h2 style="color: #C9A43A; margin: 0;">🌹 Cravo Dourado</h2>
  </div>
  <div style="padding: 40px 32px;">
    <h1 style="color: #1F3D2E; font-size: 24px; margin-bottom: 8px;">Bem-vinda, ${reseller.full_name}! ✨</h1>
    <p style="color: #6B7B6E; margin-bottom: 24px;">Seu cadastro foi aprovado e seu acesso ao sistema já está ativo.</p>
    <div style="background: #1F3D2E; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="color: #C9A43A; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px;">Seus Dados de Acesso</h2>
      <p style="color: #FAF8F4; margin: 8px 0;"><strong>E-mail:</strong> ${reseller.email}</p>
      <p style="color: #FAF8F4; margin: 8px 0;"><strong>Senha provisória:</strong>
        <span style="background: rgba(201,164,58,0.2); padding: 4px 8px; border-radius: 4px; color: #C9A43A; font-family: monospace; font-size: 18px;">${senha}</span>
      </p>
      <p style="color: rgba(250,248,244,0.6); font-size: 12px; margin-top: 12px;">⚠️ Troque sua senha no primeiro acesso.</p>
    </div>
    <ul style="color: #6B7B6E; line-height: 2;">
      <li>✅ Sua pasta de produtos consignados</li>
      <li>✅ Registro de vendas e comissões</li>
      <li>✅ Sua vitrine digital</li>
      <li>✅ Materiais de divulgação</li>
      <li>✅ Área de aprendizado exclusiva</li>
    </ul>
  </div>
  <div style="background: #1F3D2E; padding: 20px 32px; text-align: center;">
    <p style="color: rgba(250,248,244,0.7); font-size: 12px; margin: 0;">Com carinho — Equipe Cravo Dourado · ${branchName}</p>
  </div>
</div>`.trim();
}

function templateRejeicao(reseller, branchPhone) {
  return `
<div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FAF8F4; border: 1px solid #E8E2D8; border-radius: 16px; overflow: hidden;">
  <div style="background: #1F3D2E; padding: 32px; text-align: center;">
    <h2 style="color: #C9A43A; margin: 0;">🌹 Cravo Dourado</h2>
  </div>
  <div style="padding: 40px 32px;">
    <h1 style="color: #1F3D2E; font-size: 24px; margin-bottom: 8px;">Olá, ${reseller.full_name}</h1>
    <p style="color: #6B7B6E; line-height: 1.8;">
      Analisamos seu cadastro na Cravo Dourado e, no momento, não foi possível aprová-lo.
    </p>
    ${branchPhone ? `<p style="color: #6B7B6E; margin-top: 16px;">Para mais informações, entre em contato: <strong>${branchPhone}</strong></p>` : ''}
    <p style="color: #6B7B6E; margin-top: 24px;">Obrigada pelo interesse! 💛</p>
  </div>
  <div style="background: #1F3D2E; padding: 20px 32px; text-align: center;">
    <p style="color: rgba(250,248,244,0.7); font-size: 12px; margin: 0;">Equipe Cravo Dourado</p>
  </div>
</div>`.trim();
}

function gerarSenhaProvisoria() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let senha = '';
  for (let i = 0; i < 8; i++) senha += chars[Math.floor(Math.random() * chars.length)];
  return senha;
}

module.exports = async function ativarRevendedora({ reseller_id, event_type } = {}) {
  if (!reseller_id) throw new Error('reseller_id required');

  const res = await pool.query(
    "SELECT id, data FROM entities WHERE id = $1 AND entity_type = 'Reseller' AND deleted_at IS NULL",
    [reseller_id]
  );
  if (!res.rows[0]) throw new Error('Reseller not found');
  const reseller = res.rows[0].data;

  // Busca dados da filial para nome e telefone
  let branchName = reseller.branch_name || 'Cravo Dourado';
  let branchPhone = '';
  if (reseller.branch_id) {
    const branchRes = await pool.query(
      "SELECT data FROM entities WHERE id = $1 AND entity_type = 'Branch' AND deleted_at IS NULL",
      [reseller.branch_id]
    );
    if (branchRes.rows[0]) {
      branchName = branchRes.rows[0].data.name || branchName;
      branchPhone = branchRes.rows[0].data.phone || '';
    }
  }

  // Cria notificação para o gestor
  if (reseller.branch_id) {
    const notifType = event_type === 'approved' ? 'revendedora_ativada' : 'cadastro_reprovado';
    const title = event_type === 'approved' ? 'Nova revendedora ativada! 🎉' : 'Cadastro reprovado';
    const message = event_type === 'approved'
      ? `${reseller.full_name} foi aprovada e já tem acesso ao sistema.`
      : `O cadastro de ${reseller.full_name} foi reprovado.`;

    await pool.query(
      "INSERT INTO entities (entity_type, data) VALUES ('Notification', $1)",
      [{ branch_id: reseller.branch_id, type: notifType, title, message, reseller_id, is_read: false }]
    );
  }

  // Log de auditoria
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

  // Envio de e-mail (apenas se SMTP configurado e revendedora tem e-mail)
  const mailer = getMailer();
  if (mailer && reseller.email) {
    try {
      const from = process.env.SMTP_FROM || `"Cravo Dourado" <${process.env.SMTP_USER}>`;

      if (event_type === 'approved') {
        const senha = gerarSenhaProvisoria();

        // Cria/atualiza usuário auth com senha provisória
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash(senha, 10);
        await pool.query(
          `INSERT INTO auth_users (email, full_name, password_hash, role, branch_id, branch_name, first_access)
           VALUES ($1, $2, $3, 'revendedora', $4, $5, true)
           ON CONFLICT (email) DO UPDATE SET
             full_name = EXCLUDED.full_name,
             password_hash = EXCLUDED.password_hash,
             role = 'revendedora',
             branch_id = EXCLUDED.branch_id,
             branch_name = EXCLUDED.branch_name,
             first_access = true`,
          [reseller.email.toLowerCase(), reseller.full_name, hash,
           reseller.branch_id || null, branchName]
        );

        await mailer.sendMail({
          from,
          to: reseller.email,
          subject: 'Bem-vinda à Cravo Dourado! ✨ Seu acesso está pronto',
          html: templateAprovacao(reseller, senha, branchName),
        });

      } else if (event_type === 'rejected') {
        await mailer.sendMail({
          from,
          to: reseller.email,
          subject: 'Sobre seu cadastro na Cravo Dourado',
          html: templateRejeicao(reseller, branchPhone),
        });
      }
    } catch (emailErr) {
      // E-mail falhou mas não deve bloquear o fluxo principal
      console.warn('[ativarRevendedora] Falha ao enviar e-mail:', emailErr.message);
    }
  }

  return { success: true };
};
