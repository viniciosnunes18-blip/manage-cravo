import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Processa pontos de gamificação para dois eventos:
 *  - "sale_registered": nova venda registrada → pontos por valor vendido
 *  - "bag_settled": pasta acertada → pontos por acerto no prazo ou penalidade por atraso
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Suporte a chamada direta ou via automação de entidade
    let event_type = body.event_type;
    let entityData = body.data || {};
    let entityId = body.event?.entity_id || entityData.id;

    // Suporte a evento de indicação aprovada
    if (!event_type && body.event_type) {
      event_type = body.event_type;
      entityData = body.data || {};
    }

    // Inferir event_type via automação de entidade (Sale ou ConsignmentBag)
    if (!event_type && body.event) {
      const entityName = body.event?.entity_name;
      if (entityName === "Sale") {
        event_type = "sale_registered";
        entityData = body.data || {};
        entityId = body.event?.entity_id;
      } else if (entityName === "ConsignmentBag") {
        const newStatus = body.data?.status;
        const oldStatus = body.old_data?.status;
        // Só processa quando o status muda para "settled"
        if (newStatus === "settled" && oldStatus !== "settled") {
          event_type = "bag_settled";
        }
      }
    }

    if (!event_type) {
      return Response.json({ skipped: true, reason: "Evento não requer pontos" });
    }

    // Buscar regras de gamificação
    const rules = await base44.asServiceRole.entities.GamificationRules.list();
    // Preferir regra da filial, fallback para regra global (sem branch_id)
    const branchId = entityData.branch_id;
    const rule = rules.find(r => r.branch_id === branchId) || rules.find(r => !r.branch_id) || {
      points_per_amount: 2,
      points_per_amount_threshold: 20,
      early_settlement_points: 20,
      late_settlement_points: -20,
    };

    const resellerId = entityData.reseller_id;
    if (!resellerId) {
      return Response.json({ skipped: true, reason: "reseller_id não encontrado nos dados" });
    }

    // Buscar ou criar registro de pontos da revendedora
    let pointsRecords = await base44.asServiceRole.entities.GamificationPoints.filter({ reseller_id: resellerId });
    let pointsRecord = pointsRecords[0];

    if (!pointsRecord) {
      pointsRecord = await base44.asServiceRole.entities.GamificationPoints.create({
        reseller_id: resellerId,
        reseller_name: entityData.reseller_name || "",
        branch_id: branchId || "",
        points: 0,
        points_history: [],
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
    }

    let pointsDelta = 0;
    let description = "";

    // ── Evento: Venda registrada ──────────────────────────────────────────────
    if (event_type === "sale_registered") {
      const salePrice = entityData.sale_price || 0;
      const threshold = rule.points_per_amount_threshold || 20;
      const pointsPerBlock = rule.points_per_amount || 2;
      pointsDelta = Math.floor(salePrice / threshold) * pointsPerBlock;
      description = `Venda de R$ ${salePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} — ${entityData.product_name || "produto"}`;
    }

    // ── Evento: Indicação aprovada ────────────────────────────────────────────
    if (event_type === "referral_approved") {
      pointsDelta = rule.referral_approved_points ?? 100;
      description = `Indicação aprovada: ${entityData.referred_name || "nova revendedora"} 🎉`;
    }

    // ── Evento: Pasta acertada ────────────────────────────────────────────────
    if (event_type === "bag_settled") {
      const settlementDate = entityData.settlement_date ? new Date(entityData.settlement_date) : new Date();
      const dueDate = entityData.settlement_due_date ? new Date(entityData.settlement_due_date) : null;

      if (dueDate) {
        const isOnTime = settlementDate <= dueDate;
        pointsDelta = isOnTime
          ? (rule.early_settlement_points || 20)
          : (rule.late_settlement_points || -20);
        description = isOnTime
          ? "Acerto realizado no prazo ✅"
          : `Acerto realizado com atraso ⚠️`;
      } else {
        pointsDelta = rule.early_settlement_points || 20;
        description = "Acerto de pasta realizado";
      }
    }

    if (pointsDelta === 0) {
      return Response.json({ skipped: true, reason: "Nenhum ponto a atribuir" });
    }

    const newTotal = Math.max(0, (pointsRecord.points || 0) + pointsDelta);
    const historyEntry = {
      action: event_type,
      points: pointsDelta,
      description,
      date: new Date().toISOString(),
    };

    await base44.asServiceRole.entities.GamificationPoints.update(pointsRecord.id, {
      points: newTotal,
      points_history: [...(pointsRecord.points_history || []), historyEntry],
    });

    // Log
    await base44.asServiceRole.entities.Log.create({
      type: "pontos_gamificacao",
      reseller_id: resellerId,
      branch_id: branchId,
      details: `${pointsDelta > 0 ? "+" : ""}${pointsDelta} pts — ${description}`,
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      reseller_id: resellerId,
      points_delta: pointsDelta,
      new_total: newTotal,
      description,
    });

  } catch (error) {
    console.error("Erro em processarPontosGamificacao:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});