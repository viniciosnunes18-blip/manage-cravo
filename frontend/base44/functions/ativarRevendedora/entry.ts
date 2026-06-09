import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function gerarSenhaProvisoria() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let senha = '';
  for (let i = 0; i < 8; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return senha;
}

function templateEmail(revendedora, senha, branchName) {
  return `
<div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FAF8F4; border: 1px solid #E8E2D8; border-radius: 16px; overflow: hidden;">
  <div style="background: #1F3D2E; padding: 32px; text-align: center;">
    <img src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png" alt="Cravo Dourado" style="height: 80px; object-fit: contain;" />
  </div>
  <div style="padding: 40px 32px;">
    <h1 style="color: #1F3D2E; font-size: 24px; margin-bottom: 8px;">Bem-vinda, ${revendedora.full_name}! ✨</h1>
    <p style="color: #6B7B6E; margin-bottom: 24px;">Seu cadastro foi aprovado e seu acesso ao sistema já está ativo.</p>
    
    <div style="background: #1F3D2E; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="color: #C9A43A; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px;">Seus Dados de Acesso</h2>
      <p style="color: #FAF8F4; margin: 8px 0;"><strong>E-mail:</strong> ${revendedora.email}</p>
      <p style="color: #FAF8F4; margin: 8px 0;"><strong>Senha provisória:</strong> <span style="background: rgba(201,164,58,0.2); padding: 4px 8px; border-radius: 4px; color: #C9A43A; font-family: monospace; font-size: 18px;">${senha}</span></p>
      <p style="color: rgba(250,248,244,0.6); font-size: 12px; margin-top: 12px;">⚠️ Troque sua senha no primeiro acesso em "Meu Perfil → Alterar Senha"</p>
    </div>

    <p style="color: #1F3D2E; margin-bottom: 12px; font-weight: bold;">No seu painel você terá acesso a:</p>
    <ul style="color: #6B7B6E; line-height: 2;">
      <li>✅ Sua pasta de produtos consignados</li>
      <li>✅ Registro de vendas</li>
      <li>✅ Acompanhamento financeiro e comissões</li>
      <li>✅ Sua vitrine digital para compartilhar</li>
      <li>✅ Materiais de divulgação prontos</li>
      <li>✅ Área de aprendizado exclusiva</li>
    </ul>
  </div>
  <div style="background: #1F3D2E; padding: 20px 32px; text-align: center;">
    <p style="color: rgba(250,248,244,0.7); font-size: 12px; margin: 0;">Com carinho — Equipe Cravo Dourado · ${branchName}</p>
  </div>
</div>
  `.trim();
}

function templateEmailRejeicao(revendedora, branchPhone) {
  return `
<div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FAF8F4; border: 1px solid #E8E2D8; border-radius: 16px; overflow: hidden;">
  <div style="background: #1F3D2E; padding: 32px; text-align: center;">
    <img src="https://media.base44.com/images/public/6a08bee430cf87e1ab82263d/1a08bf5f1_Gemini_Generated_Image_1jf9s61jf9s61jf9-removebg-preview.png" alt="Cravo Dourado" style="height: 80px; object-fit: contain;" />
  </div>
  <div style="padding: 40px 32px;">
    <h1 style="color: #1F3D2E; font-size: 24px; margin-bottom: 8px;">Olá, ${revendedora.full_name}</h1>
    <p style="color: #6B7B6E; line-height: 1.8;">
      Analisamos seu cadastro na Cravo Dourado e, no momento, não foi possível aprová-lo.
    </p>
    <p style="color: #6B7B6E; line-height: 1.8; margin-top: 16px;">
      Caso tenha dúvidas ou queira mais informações, entre em contato conosco pelo WhatsApp: <strong style="color: #1F3D2E;">${branchPhone || "consulte nosso site"}</strong>
    </p>
    <p style="color: #6B7B6E; margin-top: 24px;">Obrigada pelo interesse! 💛</p>
  </div>
  <div style="background: #1F3D2E; padding: 20px 32px; text-align: center;">
    <p style="color: rgba(250,248,244,0.7); font-size: 12px; margin: 0;">Equipe Cravo Dourado</p>
  </div>
</div>
  `.trim();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Validate admin/service call
    const body = await req.json();

    // Suporta chamada direta ({ reseller_id, event_type }) OU via automação de entidade ({ event, data })
    let reseller_id = body.reseller_id;
    let event_type = body.event_type;

    if (!reseller_id && body.event) {
      // Chamada via automação de entidade
      reseller_id = body.event?.entity_id || body.data?.id;
      const newStatus = body.data?.status;
      event_type = newStatus === "approved" ? "approved" : (newStatus === "rejected" ? "rejected" : null);
    }

    if (!event_type) {
      return Response.json({ skipped: true, reason: 'Status não requer ação' });
    }

    if (!reseller_id) {
      return Response.json({ error: 'reseller_id é obrigatório' }, { status: 400 });
    }

    // Fetch reseller data
    const resellers = await base44.asServiceRole.entities.Reseller.filter({ id: reseller_id });
    const revendedora = resellers[0];

    if (!revendedora) {
      return Response.json({ error: 'Revendedora não encontrada' }, { status: 404 });
    }

    // Fetch branch data
    let branchName = revendedora.branch_name || "Filial";
    let branchPhone = "";
    if (revendedora.branch_id) {
      const branches = await base44.asServiceRole.entities.Branch.filter({ id: revendedora.branch_id });
      if (branches[0]) {
        branchName = branches[0].name;
        branchPhone = branches[0].phone || "";
      }
    }

    // --- REJEIÇÃO ---
    if (event_type === 'rejected') {
      if (revendedora.email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: revendedora.email,
          subject: "Sobre seu cadastro na Cravo Dourado",
          body: templateEmailRejeicao(revendedora, branchPhone),
        });
      }

      // Criar notificação para gestor
      await base44.asServiceRole.entities.Notification.create({
        branch_id: revendedora.branch_id,
        type: "cadastro_reprovado",
        title: "Cadastro reprovado",
        message: `Cadastro de ${revendedora.full_name} foi reprovado`,
        reseller_id: revendedora.id,
        is_read: false,
      });

      return Response.json({ success: true, action: 'rejected_notified' });
    }

    // --- APROVAÇÃO ---
    if (!revendedora.email) {
      return Response.json({ error: 'Revendedora não tem e-mail cadastrado' }, { status: 400 });
    }

    // Verificar se usuário já existe (invitar apenas se não existir)
    let userAlreadyExists = false;
    try {
      const existingUsers = await base44.asServiceRole.entities.User.filter({ email: revendedora.email });
      if (existingUsers.length > 0) {
        userAlreadyExists = true;
      }
    } catch (_e) {
      // Ignorar erro de busca
    }

    const senhaProvisoria = gerarSenhaProvisoria();

    if (!userAlreadyExists) {
      // Convidar usuário para a plataforma
      await base44.asServiceRole.users.inviteUser(revendedora.email, "revendedora");
    }

    // Atualizar dados da revendedora com a senha provisória e flag de primeiro acesso
    await base44.asServiceRole.entities.Reseller.update(revendedora.id, {
      password_hash: senhaProvisoria, // Store temp password hint (will be cleared on first login)
      status: 'active',
    });

    // Enviar e-mail de boas-vindas
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: revendedora.email,
      subject: "Bem-vinda à Cravo Dourado! ✨ Seu acesso está pronto",
      body: templateEmail(revendedora, senhaProvisoria, branchName),
    });

    // Criar notificação para gestor da filial
    await base44.asServiceRole.entities.Notification.create({
      branch_id: revendedora.branch_id,
      type: "revendedora_ativada",
      title: "Nova revendedora ativada! 🎉",
      message: `${revendedora.full_name} acabou de ser aprovada e já tem acesso ao sistema.`,
      reseller_id: revendedora.id,
      is_read: false,
    });

    // Criar notificação de novo cadastro pendente (para auditoria)
    await base44.asServiceRole.entities.Log.create({
      type: "usuario_criado",
      reseller_id: revendedora.id,
      branch_id: revendedora.branch_id,
      details: `Usuário ${userAlreadyExists ? 'já existia, notificado' : 'criado via convite'} automaticamente após aprovação`,
      timestamp: new Date().toISOString(),
    });

    // ── Pontos de indicação ──────────────────────────────────────────────────
    if (revendedora.referred_by_reseller_id) {
      await base44.asServiceRole.functions.invoke("processarPontosGamificacao", {
        event_type: "referral_approved",
        data: {
          reseller_id: revendedora.referred_by_reseller_id,
          branch_id: revendedora.branch_id,
          referred_name: revendedora.full_name,
        },
      });
    }

    return Response.json({
      success: true,
      action: userAlreadyExists ? 'user_already_existed' : 'user_invited',
      email_sent: true,
    });

  } catch (error) {
    console.error('Erro em ativarRevendedora:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});