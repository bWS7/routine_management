import { STATUS_COLORS, PERIODO_COLORS, PERFIL_COLORS } from '../../utils/constants';

const BASE = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium';

export function StatusBadge({ status, label }) {
  return (
    <span className={`${BASE} ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {label || status}
    </span>
  );
}

export function PeriodoBadge({ periodo, label }) {
  return (
    <span className={`${BASE} ${PERIODO_COLORS[periodo] || 'bg-gray-100 text-gray-600'}`}>
      {label || periodo}
    </span>
  );
}

export function PerfilBadge({ perfil, label }) {
  return (
    <span className={`${BASE} ${PERFIL_COLORS[perfil] || 'bg-gray-100 text-gray-600'}`}>
      {label || perfil}
    </span>
  );
}

export default function Badge({ children, color = 'gray', className = '' }) {
  const colorMap = {
    gray:   'bg-gray-100 text-gray-700',
    blue:   'bg-blue-50 text-blue-700',
    green:  'bg-green-50 text-green-700',
    red:    'bg-red-50 text-red-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
  };
  return (
    <span className={`${BASE} ${colorMap[color] || colorMap.gray} ${className}`}>
      {children}
    </span>
  );
}
