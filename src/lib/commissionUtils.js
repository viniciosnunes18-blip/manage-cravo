// Lógica de níveis e comissões Cravo Dourado
// JF = Juiz de Fora (tabela especial)

export const LEVELS_STANDARD = [
  { key: "bronze",  label: "Bronze",   min: 0,       max: 499.99,   commission: 20, color: "#CD7F32" },
  { key: "silver",  label: "Prata",    min: 500,     max: 999.99,   commission: 30, color: "#A8A9AD" },
  { key: "gold",    label: "Ouro",     min: 1000,    max: 2999.99,  commission: 40, color: "#C9A43A" },
  { key: "diamond", label: "Diamante", min: 3000,    max: Infinity, commission: 50, color: "#5BC0DE" },
];

export const LEVELS_JF = [
  { key: "bronze",  label: "Bronze",   min: 0,    max: 499.99,   commission: 20, color: "#CD7F32" },
  { key: "silver",  label: "Prata",    min: 500,  max: 999.99,   commission: 30, color: "#A8A9AD" },
  { key: "gold",    label: "Ouro",     min: 1000, max: 2999.99,  commission: 50, color: "#C9A43A" },
  { key: "diamond", label: "Diamante", min: 3000, max: Infinity, commission: 50, color: "#5BC0DE" },
];

export function getLevelTable(branch) {
  // Detecta filial JF pela commission_table ou nome
  if (branch?.commission_table === "special_jf" || branch?.city?.toLowerCase().includes("juiz de fora")) {
    return LEVELS_JF;
  }
  return LEVELS_STANDARD;
}

export function getCurrentLevel(totalSold, levels) {
  const table = levels || LEVELS_STANDARD;
  for (let i = table.length - 1; i >= 0; i--) {
    if (totalSold >= table[i].min) return table[i];
  }
  return table[0];
}

export function getNextLevel(currentLevelKey, levels) {
  const table = levels || LEVELS_STANDARD;
  const idx = table.findIndex(l => l.key === currentLevelKey);
  if (idx < table.length - 1) return table[idx + 1];
  return null;
}

export function getLevelProgress(totalSold, levels) {
  const table = levels || LEVELS_STANDARD;
  const current = getCurrentLevel(totalSold, table);
  const next = getNextLevel(current.key, table);

  if (!next) {
    return { current, next: null, progress: 100, remaining: 0 };
  }

  const rangeSize = next.min - current.min;
  const progress = Math.min(100, ((totalSold - current.min) / rangeSize) * 100);
  const remaining = Math.max(0, next.min - totalSold);

  return { current, next, progress, remaining };
}

export function calculateCommission(totalSold, levels) {
  const table = levels || LEVELS_STANDARD;
  const level = getCurrentLevel(totalSold, table);
  return (totalSold * level.commission) / 100;
}

export function getDaysRemaining(dueDateStr) {
  if (!dueDateStr) return null;
  const due = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((due - today) / (1000 * 60 * 60 * 24));
}

export function getDeadlineStyle(daysRemaining) {
  if (daysRemaining === null) return { bg: "#FAF8F4", color: "#6B7B6E", label: "—" };
  if (daysRemaining > 15)  return { bg: "#F0FAF4", color: "#2E7D5E", label: "✅ No prazo" };
  if (daysRemaining >= 8)  return { bg: "#FFFBEB", color: "#D97706", label: "⚠️ Atenção ao prazo" };
  if (daysRemaining >= 1)  return { bg: "#FEF2F2", color: "#DC2626", label: "🔴 Prazo urgente!" };
  return { bg: "#DC2626", color: "#FFFFFF", label: "❌ Prazo vencido!" };
}