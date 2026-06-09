import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Suporta chamada direta ou via automação de entidade
    let reseller_id = body.reseller_id;
    if (!reseller_id && body.event) {
      reseller_id = body.event?.entity_id || body.data?.id;
    }

    if (!reseller_id) {
      return Response.json({ skipped: true, reason: 'Sem reseller_id' });
    }

    const resellers = await base44.asServiceRole.entities.Reseller.filter({ id: reseller_id });
    const revendedora = resellers[0];

    if (!revendedora || revendedora.status !== 'pending') {
      return Response.json({ skipped: true, reason: 'Não é pendente' });
    }

    await base44.asServiceRole.entities.Notification.create({
      branch_id: revendedora.branch_id,
      type: "novo_cadastro",
      title: "Nova solicitação de cadastro",
      message: `${revendedora.full_name} — ${revendedora.city || ""}`,
      reseller_id: revendedora.id,
      is_read: false,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Erro em notificarNovoCadastro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});