import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, Download, Eye, Edit } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table';
import Button from '../components/ui/Button';
import { EmptyState, PageSpinner } from '../components/ui/Spinner';
import { StatusBadge } from '../components/ui/Badge';
import { STATUS_LABELS, fmtDate } from '../utils/constants';
import RotinaModal from '../components/shared/RotinaModal';

export default function PendenciasPage() {
  const { toast } = useToast();
  const [pendencias, setPendencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch('/api/rotinas/pendencias');
    if (r?.ok) setPendencias(r.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
        <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-800">O que são pendências?</p>
          <p className="text-sm text-red-700 mt-0.5">
            Atividades obrigatórias que ultrapassaram o prazo sem conclusão.
            Todo não-atingimento exige justificativa e plano de ação do responsável.
          </p>
        </div>
      </div>

      {loading ? (
        <PageSpinner />
      ) : pendencias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="p-5 rounded-2xl bg-green-50 mb-4">
            <CheckCircle size={40} className="text-success" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Nenhuma pendência!</p>
          <p className="text-sm text-gray-400 mt-1">Todas as atividades obrigatórias estão em dia.</p>
        </div>
      ) : (
        <Card>
          <Table>
            <Thead>
              <tr>
                <Th>Usuário</Th>
                <Th>Atividade</Th>
                <Th>Prazo Limite</Th>
                <Th>Status</Th>
                <Th>Justificativa</Th>
                <Th></Th>
              </tr>
            </Thead>
            <Tbody>
              {pendencias.map(r => (
                <Tr key={r.id}>
                  <Td className="font-medium text-gray-800">{r.usuario_nome}</Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-700">{r.atividade_nome}</span>
                      {r.atividade_obrigatoria && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-error" title="Obrigatória" />
                      )}
                    </div>
                  </Td>
                  <Td className="text-error font-semibold text-xs">{fmtDate(r.periodo_fim)}</Td>
                  <Td><StatusBadge status={r.status} label={STATUS_LABELS[r.status]} /></Td>
                  <Td className="text-xs text-gray-500 max-w-[200px] truncate">{r.justificativa || '—'}</Td>
                  <Td>
                    <button
                      onClick={() => setOpenId(r.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Registrar plano de ação"
                    >
                      <Edit size={15} />
                    </button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      <RotinaModal rotinaId={openId} onClose={() => setOpenId(null)} onSaved={load} />
    </div>
  );
}
