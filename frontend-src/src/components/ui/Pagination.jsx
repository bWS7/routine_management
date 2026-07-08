import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Sequência de páginas a exibir (com reticências para muitos itens).
export function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const arr = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of arr) {
    if (p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

/**
 * Paginação no cliente sobre uma lista já carregada.
 * `resetKey` volta para a página 1 quando muda (ex.: troca de aba/filtro).
 */
export function usePagination(items, perPage = 20, resetKey) {
  const [page, setPage] = useState(1);
  const total = items?.length || 0;
  const pages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => { setPage(1); }, [resetKey]);
  useEffect(() => { if (page > pages) setPage(1); }, [pages, page]);

  const slice = useMemo(
    () => (items || []).slice((page - 1) * perPage, page * perPage),
    [items, page, perPage]
  );

  return { page, setPage, pages, total, perPage, slice };
}

/** Rodapé de paginação (números 1, 2, 3 … + Anterior/Próxima + contagem). */
export default function Pagination({ page, pages, total, perPage, onChange, className = '' }) {
  if (!total) return null;
  const inicio = (page - 1) * perPage + 1;
  const fim = Math.min(page * perPage, total);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 ${className}`}>
      <span className="text-xs text-gray-400">
        Mostrando {inicio}–{fim} de {total} registro{total === 1 ? '' : 's'}
      </span>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft size={16} />
          </button>
          {pageList(page, pages).map((p, i) => p === '…' ? (
            <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p)}
              className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
                p === page ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {p}
            </button>
          ))}
          <button onClick={() => onChange(Math.min(pages, page + 1))} disabled={page >= pages}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
