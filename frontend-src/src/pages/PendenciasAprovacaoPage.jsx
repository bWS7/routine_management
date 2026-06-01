import { useState, useEffect, useCallback } from 'react';
import { Check, X, AlertTriangle, Loader } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { EmptyState, PageSpinner } from '../components/ui/Spinner';
import { PeriodoBadge } from '../components/ui/Badge';
import { Card, CardBody } from '../components/ui/Card';
import { PERIODO_LABELS, fmtDate, fmtDatetime } from '../utils/constants';

const FILTROS = [
  { key: 'pendente',  label: 'Aguardando Aprovação', color: 'yellow', Icon: AlertTriangle },
  { key: 'aprovada',  label: 'Aprovadas',            color: 'green',  Icon: Check },
  { key: 'reprovada', label: 'Reprovadas',            color: 'red',    Icon: X },
];

const COLOR = {
  yellow: { card: 'border-yellow-200 bg-yellow-50', text: 'text-yellow-600', ring: 'ring-2 ring-yellow-400' },
  green:  { card: 'border-green-200 bg-green-50',   text: 'text-green-600',  ring: 'ring-2 ring-green-400' },
  red:    { card: 'border-red-200 bg-red-50',        text: 'text-red-600',    ring: 'ring-2 ring-red-400' },
};

function PendenciasAprovacaoPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [todas, setTodas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('pendente');

  const [selectedRotina, setSelectedRotina] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectingMode, setIsRejectingMode] = useState(false);

  const loadAtividades = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch('/api/rotinas/para-aprovar?status_aprovacao=todas');
    if (r?.ok) {
      setTodas(r.data || []);
    } else {
      toast(r?.data?.erro || 'Erro ao carregar atividades', 'error');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { loadAtividades(); }, [loadAtividades]);

  const handleAprovar = async () => {
    if (!selectedRotina) return;
    setApproveLoading(true);
    const r = await apiFetch(`/api/rotinas/${selectedRotina.id}/aprovar`, {
      method: 'POST',
      body: JSON.stringify({ motivo: '' })
    });
    if (r?.ok) {
      toast('Atividade aprovada com sucesso!', 'success');
      setSelectedRotina(null);
      loadAtividades();
    } else {
      toast(r?.data?.erro || 'Erro ao aprovar', 'error');
    }
    setApproveLoading(false);
  };

  const handleReprovar = async () => {
    if (!selectedRotina || !rejectReason.trim()) {
      toast('Informe o motivo da reprovação', 'error');
      return;
    }
    setApproveLoading(true);
    const r = await apiFetch(`/api/rotinas/${selectedRotina.id}/reprovar`, {
      method: 'POST',
      body: JSON.stringify({ motivo: rejectReason })
    });
    if (r?.ok) {
      toast('Atividade reprovada', 'success');
      setSelectedRotina(null);
      setRejectReason('');
      setIsRejectingMode(false);
      loadAtividades();
    } else {
      toast(r?.data?.erro || 'Erro ao reprovar', 'error');
    }
    setApproveLoading(false);
  };

  const closeModal = () => {
    setSelectedRotina(null);
    setIsRejectingMode(false);
    setRejectReason('');
  };

  if (!['admin', 'sr'].includes(currentUser?.perfil)) {
    return (
      <div className="p-6">
        <EmptyState icon={AlertTriangle} title="Acesso Negado" description="Apenas administradores e superintendentes podem aprovar atividades" />
      </div>
    );
  }

  if (loading) return <PageSpinner />;

  const counts = {
    pendente:  todas.filter(a => a.status_aprovacao === 'pendente').length,
    aprovada:  todas.filter(a => a.status_aprovacao === 'aprovada').length,
    reprovada: todas.filter(a => a.status_aprovacao === 'reprovada').length,
  };

  const lista = todas.filter(a => a.status_aprovacao === filtro);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aprovação de Atividades</h1>
        <p className="text-gray-600 mt-1">Revise e aprove as atividades concluídas pelos usuários da sua regional</p>
      </div>

      {/* Contadores clicáveis */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FILTROS.map(({ key, label, color, Icon }) => {
          const isActive = filtro === key;
          const c = COLOR[color];
          return (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              className={`
                text-left rounded-xl border-2 p-4 transition-all duration-150
                ${isActive ? `${c.card} ${c.ring}` : 'bg-white border-gray-200 hover:border-gray-300'}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{label}</p>
                  <p className={`text-3xl font-bold mt-1 ${isActive ? c.text : 'text-gray-800'}`}>
                    {counts[key]}
                  </p>
                </div>
                <Icon className={isActive ? c.text : 'text-gray-400'} size={32} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Lista filtrada */}
      {lista.length === 0 ? (
        <EmptyState
          icon={filtro === 'pendente' ? AlertTriangle : filtro === 'aprovada' ? Check : X}
          title={
            filtro === 'pendente' ? 'Nenhuma atividade aguardando aprovação'
            : filtro === 'aprovada' ? 'Nenhuma atividade aprovada ainda'
            : 'Nenhuma atividade reprovada'
          }
          description=""
        />
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {FILTROS.find(f => f.key === filtro)?.label} ({lista.length})
          </h2>
          <div className="space-y-2">
            {lista.map(rotina => {
              const c = COLOR[FILTROS.find(f => f.key === filtro)?.color];
              return (
                <button
                  key={rotina.id}
                  onClick={() => { setSelectedRotina(rotina); setIsRejectingMode(false); setRejectReason(''); }}
                  className={`
                    w-full text-left rounded-lg border-2 p-4 transition-all cursor-pointer
                    ${c.card}
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">{rotina.atividade_nome}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{rotina.usuario_nome}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <PeriodoBadge periodo={rotina.periodicidade} label={PERIODO_LABELS[rotina.periodicidade]} />
                        <span className="text-xs text-gray-500">
                          {fmtDate(rotina.periodo_inicio)} → {fmtDate(rotina.periodo_fim)}
                        </span>
                      </div>
                      {rotina.comentario && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{rotina.comentario}</p>
                      )}
                      {filtro === 'aprovada' && rotina.data_aprovacao && (
                        <p className="text-xs text-green-700 mt-2">
                          Aprovado em {fmtDatetime(rotina.data_aprovacao)} por {rotina.aprovador_nome}
                        </p>
                      )}
                      {filtro === 'reprovada' && (
                        <>
                          {rotina.data_aprovacao && (
                            <p className="text-xs text-red-700 mt-2">
                              Reprovado em {fmtDatetime(rotina.data_aprovacao)} por {rotina.aprovador_nome}
                            </p>
                          )}
                          {rotina.motivo_reprovacao && (
                            <p className="text-xs text-red-700 font-semibold mt-1">
                              Motivo: {rotina.motivo_reprovacao}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="shrink-0">
                      {filtro === 'pendente' && <AlertTriangle className="text-yellow-600" size={22} />}
                      {filtro === 'aprovada'  && <Check className="text-green-600" size={22} />}
                      {filtro === 'reprovada' && <X className="text-red-600" size={22} />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Aprovação */}
      <Modal
        open={!!selectedRotina}
        onClose={closeModal}
        title={selectedRotina?.atividade_nome}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Fechar</Button>
            {selectedRotina?.status_aprovacao === 'pendente' && (
              !isRejectingMode ? (
                <>
                  <Button variant="danger" onClick={() => setIsRejectingMode(true)}>Reprovar</Button>
                  <Button onClick={handleAprovar} loading={approveLoading} icon={Check}>Aprovar</Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => setIsRejectingMode(false)}>Voltar</Button>
                  <Button variant="danger" onClick={handleReprovar} loading={approveLoading} icon={X}>
                    Confirmar Reprovação
                  </Button>
                </>
              )
            )}
          </>
        }
      >
        {selectedRotina && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 font-medium">Usuário</p>
                <p className="text-sm text-gray-900 font-medium mt-1">{selectedRotina.usuario_nome}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Período</p>
                <p className="text-sm text-gray-900 font-medium mt-1">
                  {fmtDate(selectedRotina.periodo_inicio)} → {fmtDate(selectedRotina.periodo_fim)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Periodicidade</p>
                <p className="text-sm text-gray-900 font-medium mt-1">{PERIODO_LABELS[selectedRotina.periodicidade]}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Concluída em</p>
                <p className="text-sm text-gray-900 font-medium mt-1">{fmtDatetime(selectedRotina.data_conclusao)}</p>
              </div>
            </div>

            {selectedRotina.comentario && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Comentário</p>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">{selectedRotina.comentario}</div>
              </div>
            )}

            {selectedRotina.evidencias?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Evidências ({selectedRotina.evidencias.length})</p>
                <div className="space-y-2">
                  {selectedRotina.evidencias.map(e => (
                    <a
                      key={e.id}
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 bg-gray-50 rounded-lg text-sm text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      📎 {e.nome_arquivo}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selectedRotina.status_aprovacao === 'aprovada' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-700">
                  ✓ Aprovada em {fmtDatetime(selectedRotina.data_aprovacao)} por {selectedRotina.aprovador_nome}
                </p>
              </div>
            )}

            {selectedRotina.status_aprovacao === 'reprovada' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1">
                <p className="text-sm font-medium text-red-700">
                  ✗ Reprovada em {fmtDatetime(selectedRotina.data_aprovacao)} por {selectedRotina.aprovador_nome}
                </p>
                {selectedRotina.motivo_reprovacao && (
                  <p className="text-sm text-red-600">Motivo: {selectedRotina.motivo_reprovacao}</p>
                )}
              </div>
            )}

            {isRejectingMode && (
              <Textarea
                label="Motivo da Reprovação"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Explique por que a atividade foi reprovada..."
                rows={4}
                required
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PendenciasAprovacaoPage;
