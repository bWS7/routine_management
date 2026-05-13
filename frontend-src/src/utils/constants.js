// Shared constants for the whole app
export const PERFIL_LABELS = {
  admin: 'Administrador',
  sr:    'Superintendente',
  gv:    'Gerente de Vendas',
  cd:    'Coordenador de Produto',
  sp:    'Supervisor de Parceria',
};

export const STATUS_LABELS = {
  nao_iniciada:  'Não Iniciada',
  em_andamento:  'Em Andamento',
  concluida:     'Concluída',
  nao_realizada: 'Não Realizada',
};

export const PERIODO_LABELS = {
  semanal:   'Semanal',
  quinzenal: 'Quinzenal',
  mensal:    'Mensal',
};

export const STATUS_COLORS = {
  nao_iniciada:  'bg-gray-100 text-gray-600',
  em_andamento:  'bg-warning-light text-warning-dark',
  concluida:     'bg-success-light text-success-dark',
  nao_realizada: 'bg-error-light text-error-dark',
};

export const PERIODO_COLORS = {
  semanal:   'bg-blue-50 text-blue-700',
  quinzenal: 'bg-purple-50 text-purple-700',
  mensal:    'bg-orange-50 text-orange-700',
};

export const PERFIL_COLORS = {
  admin: 'bg-gray-900 text-white',
  sr:    'bg-primary-100 text-primary-800',
  gv:    'bg-green-100 text-green-800',
  cd:    'bg-purple-100 text-purple-800',
  sp:    'bg-orange-100 text-orange-800',
};

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + (d.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('pt-BR');
}

export function fmtDatetime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatAuditDetails(details) {
  if (!details) return '—';
  try {
    const parsed = typeof details === 'string' ? JSON.parse(details) : details;
    return Object.entries(parsed)
      .map(([key, value]) => {
        if (value && typeof value === 'object' && 'antes' in value && 'depois' in value) {
          return `${key}: ${value.antes ?? '—'} → ${value.depois ?? '—'}`;
        }
        return `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`;
      })
      .join(' | ');
  } catch {
    return String(details);
  }
}
