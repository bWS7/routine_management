import { useState, useEffect, useCallback } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import { apiFetch, downloadExport } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table';
import { Select } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { EmptyState, PageSpinner } from '../components/ui/Spinner';
import { StatusBadge, PeriodoBadge, PerfilBadge } from '../components/ui/Badge';
import { STATUS_LABELS, PERIODO_LABELS, PERFIL_LABELS, fmtDate, fmtDatetime } from '../utils/constants';
import RotinaModal from '../components/shared/RotinaModal';

export default function AcompanhamentoPage() {
  const { toast } = useToast();
  const [rotinas, setRotinas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('semanal');
  const [usuarioId, setUsuarioId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    let url = `/api/rotinas/?periodo=${periodo}`;
    if (usuarioId) url += `&usuario_id=${usuarioId}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    const [r, ur] = await Promise.all([apiFetch(url), apiFetch('/api/usuarios/?status=ativo')]);
    if (r?.ok) setRotinas(r.data);
    if (ur?.ok) setUsuarios(ur.data);
    setLoading(false);
  }, [periodo, usuarioId, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const exportar = () => {
    let url = `/api/rotinas/export?periodo=${periodo}`;
    if (usuarioId) url += `&usuario_id=${usuarioId}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    downloadExport(url, `acompanhamento_${periodo}.csv`).catch(() => toast('Erro ao exportar', 'error'));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={periodo} onChange={e => setPeriodo(e.target.value)} className="w-36">
          <option value="semanal">Semanal</option>
          <option value="quinzenal">Quinzenal</option>
          <option value="mensal">Mensal</option>
        </Select>
        <Select value={usuarioId} onChange={e => setUsuarioId(e.target.value)} className="w-52">
          <option value="">Todos os Usuários</option>
          {usuarios.map(u => (
            <option key={u.id} value={u.id}>{u.nome} ({PERFIL_LABELS[u.perfil] || u.perfil})</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-44">
          <option value="">Todos os Status</option>
          <option value="nao_iniciada">Não Iniciada</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="concluida">Concluída</option>
          <option value="nao_realizada">Não Realizada</option>
        </Select>
        <Button variant="secondary" icon={Download} onClick={exportar} className="ml-auto">Exportar CSV</Button>
      </div>

      {loading ? (
        <PageSpinner />
      ) : (
        <Card>
          {rotinas.length === 0 ? (
            <EmptyState icon={TrendingUp} title="Nenhuma rotina encontrada" description="Ajuste os filtros para visualizar as atividades." />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Usuário</Th>
                  <Th>Atividade</Th>
                  <Th>Periodicidade</Th>
                  <Th>Período</Th>
                  <Th>Status</Th>
                  <Th>Conclusão</Th>
                  <Th></Th>
                </tr>
              </Thead>
              <Tbody>
                {rotinas.map(r => (
                  <Tr key={r.id} onClick={() => setOpenId(r.id)}>
                    <Td>
                      <div className="font-medium text-gray-800">{r.usuario_nome}</div>
                      <PerfilBadge perfil={r.perfil} label={PERFIL_LABELS[r.perfil] || r.perfil} />
                    </Td>
                    <Td className="max-w-[200px]">
                      <span className="font-medium text-gray-700 line-clamp-2">{r.atividade_nome}</span>
                    </Td>
                    <Td><PeriodoBadge periodo={r.periodicidade} label={PERIODO_LABELS[r.periodicidade]} /></Td>
                    <Td><span className="text-xs text-gray-500">{fmtDate(r.periodo_inicio)}</span></Td>
                    <Td><StatusBadge status={r.status} label={STATUS_LABELS[r.status]} /></Td>
                    <Td><span className="text-xs text-gray-500">{r.data_conclusao ? fmtDatetime(r.data_conclusao) : '—'}</span></Td>
                    <Td>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-primary-400 transition-colors" />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      <RotinaModal rotinaId={openId} onClose={() => setOpenId(null)} onSaved={load} />
    </div>
  );
}
