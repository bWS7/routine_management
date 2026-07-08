import { useState, useEffect, useCallback, useMemo } from 'react';
import { Shield, X } from 'lucide-react';
import { apiFetch } from '../api/client';
import { Card } from '../components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table';
import { EmptyState, PageSpinner } from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import Pagination from '../components/ui/Pagination';
import { fmtDatetime, formatAuditDetails } from '../utils/constants';

const PER_PAGE = 50;

const ACTION_COLORS = {
  CREATE: 'blue', CRIAR: 'blue',
  UPDATE: 'purple', ATUALIZAR: 'purple',
  DELETE: 'red', EXCLUIR: 'red',
  LOGIN: 'green',
};

const EMPTY_FILTERS = { data_inicio: '', data_fim: '', usuario_id: '', acao: '', entidade: '', busca: '' };

export default function AuditoriaPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [facets, setFacets] = useState({ usuarios: [], acoes: [], entidades: [] });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [buscaInput, setBuscaInput] = useState('');
  const [page, setPage] = useState(1);

  // Debounce da busca por texto.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => (f.busca === buscaInput ? f : { ...f, busca: buscaInput }));
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [buscaInput]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    const r = await apiFetch(`/api/rotinas/audit-log?${params.toString()}`);
    if (r?.ok) {
      setItems(r.data.items || []);
      setTotal(r.data.total || 0);
      setPages(r.data.pages || 1);
      if (r.data.facets) setFacets(r.data.facets);
    }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(1); };
  const limpar = () => { setFilters(EMPTY_FILTERS); setBuscaInput(''); setPage(1); };

  const hasFilters = useMemo(
    () => Object.values(filters).some(Boolean) || !!buscaInput,
    [filters, buscaInput]
  );

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input type="date" label="Data início" value={filters.data_inicio}
            onChange={e => setFilter('data_inicio', e.target.value)} />
          <Input type="date" label="Data fim" value={filters.data_fim}
            onChange={e => setFilter('data_fim', e.target.value)} />
          <Select label="Usuário" value={filters.usuario_id} onChange={e => setFilter('usuario_id', e.target.value)}>
            <option value="">Todos</option>
            {facets.usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </Select>
          <Select label="Ação" value={filters.acao} onChange={e => setFilter('acao', e.target.value)}>
            <option value="">Todas</option>
            {facets.acoes.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Select label="Entidade" value={filters.entidade} onChange={e => setFilter('entidade', e.target.value)}>
            <option value="">Todas</option>
            {facets.entidades.map(e => <option key={e} value={e}>{e}</option>)}
          </Select>
          <Input label="Busca" placeholder="Buscar nos detalhes, usuário..." value={buscaInput}
            onChange={e => setBuscaInput(e.target.value)} />
        </div>
        {hasFilters && (
          <div className="mt-3">
            <button onClick={limpar}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-error transition-colors">
              <X size={13} /> Limpar filtros
            </button>
          </div>
        )}
      </Card>

      {loading ? <PageSpinner /> : (
        <Card>
          {items.length === 0 ? (
            <EmptyState icon={Shield} title="Nenhum log encontrado"
              description={hasFilters ? 'Ajuste os filtros para ver mais resultados.' : undefined} />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>Quando</Th>
                    <Th>Usuário</Th>
                    <Th>Entidade</Th>
                    <Th>Ação</Th>
                    <Th>Detalhes</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {items.map(log => (
                    <Tr key={log.id}>
                      <Td className="text-xs text-gray-500 whitespace-nowrap">{fmtDatetime(log.criado_em)}</Td>
                      <Td className="font-medium text-gray-800">{log.usuario_nome || 'Sistema'}</Td>
                      <Td className="text-sm text-gray-600">
                        {log.entidade} {log.entidade_id ? <span className="text-gray-400 font-mono text-xs">#{log.entidade_id}</span> : ''}
                      </Td>
                      <Td>
                        <Badge color={ACTION_COLORS[log.acao?.toUpperCase()] || 'gray'}>{log.acao}</Badge>
                      </Td>
                      <Td className="text-xs text-gray-500 max-w-[300px] truncate">{formatAuditDetails(log.detalhes)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              <Pagination page={page} pages={pages} total={total} perPage={PER_PAGE} onChange={setPage} />
            </>
          )}
        </Card>
      )}
    </div>
  );
}
