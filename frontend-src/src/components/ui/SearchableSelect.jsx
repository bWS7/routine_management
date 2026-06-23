import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Dropdown com pesquisa integrada (combobox). Padrão usado para o campo
 * "Empreendimento" e outros campos de seleção pesquisável.
 *
 * Props:
 *  - value: valor selecionado (string)
 *  - onChange: (value) => void
 *  - options: array de { value, label } ou de strings
 *  - label, placeholder, required, disabled, error
 *  - allowClear: exibe botão para limpar a seleção (default true)
 *  - emptyMessage: texto quando não há opções/resultados
 */
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  label,
  placeholder = 'Selecione...',
  required = false,
  disabled = false,
  error,
  allowClear = true,
  emptyMessage = 'Nenhuma opção encontrada',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const normOptions = useMemo(
    () => options.map(o => (typeof o === 'string' ? { value: o, label: o } : o)),
    [options]
  );

  const selected = normOptions.find(o => String(o.value) === String(value));
  // Suporta valores legados (texto livre) que não estão na lista cadastrada.
  const selectedLabel = selected?.label ?? (value ? String(value) : '');

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return normOptions;
    return normOptions.filter(o => normalize(o.label).includes(q));
  }, [normOptions, query]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 0); }
  }, [open]);

  const pick = (val) => { onChange?.(val); setOpen(false); };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1 font-bold">*</span>}
        </label>
      )}
      <div className="relative" ref={wrapRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          className={`
            w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left bg-white border rounded-lg
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            ${error ? 'border-error focus:ring-error' : 'border-gray-200'}
            ${className}
          `}
        >
          <span className={`truncate ${selectedLabel ? 'text-gray-900' : 'text-gray-400'}`}>
            {selectedLabel || placeholder}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {allowClear && selectedLabel && !disabled && (
              <X
                size={14}
                className="text-gray-400 hover:text-error"
                onClick={(e) => { e.stopPropagation(); pick(''); }}
              />
            )}
            <ChevronDown size={15} className="text-gray-400" />
          </span>
        </button>

        {open && !disabled && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full text-sm focus:outline-none placeholder-gray-400"
              />
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400">{emptyMessage}</div>
              ) : (
                filtered.map(o => {
                  const active = String(o.value) === String(value);
                  return (
                    <button
                      type="button"
                      key={o.value}
                      onClick={() => pick(o.value)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left
                        hover:bg-primary-50 transition-colors
                        ${active ? 'text-primary-700 font-medium bg-primary-50/50' : 'text-gray-700'}`}
                    >
                      <span className="truncate">{o.label}</span>
                      {active && <Check size={14} className="shrink-0 text-primary-600" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
