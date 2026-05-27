import { useState, useEffect, useCallback } from 'react';
import { Check, X, AlertTriangle, Loader } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { Textarea, Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { EmptyState, PageSpinner } from '../components/ui/Spinner';
import { StatusBadge, PeriodoBadge } from '../components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { PERIODO_LABELS, fmtDate, fmtDatetime } from '../utils/constants';

function PendenciasAprovacaoPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRotina, setSelectedRotina] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectingMode, setIsRejectingMode] = useState(false);

  const loadAtividades = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch('/api/rotinas/para-aprovar');
    if (r?.ok) {
      setAtividades(r.data || []);
    } else {
      toast(r?.data?.erro || 'Erro ao carregar atividades', 'error');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadAtividades();
  }, [loadAtividades]);

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

  if (!['admin', 'sr'].includes(currentUser?.perfil)) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertTriangle}
          title="Acesso Negado"
          description="Apenas administradores e superintendentes podem aprovar atividades"
        />
      </div>
    );
  }

  if (loading) return <PageSpinner />;

  const pendentes = atividades.filter(a => a.status_aprovacao === 'pendente');
  const aprovadas = atividades.filter(a => a.status_aprovacao === 'aprovada');
  const reprovadas = atividades.filter(a => a.status_aprovacao === 'reprovada');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aprovação de Atividades</h1>
        <p className="text-gray-600 mt-1">Revise e aprove as atividades concluídas pelos usuários da sua regional</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aguardando Aprovação</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{pendentes.length}</p>
            </div>
            <AlertTriangle className="text-yellow-600" size={32} />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aprovadas</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{aprovadas.length}</p>
            </div>
            <Check className="text-green-600" size={32} />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reprovadas</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{reprovadas.length}</p>
            </div>
            <X className="text-red-600" size={32} />
          </CardBody>
        </Card>
      </div>

      {/* Pendentes */}
      {pendentes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Aguardando Sua Aprovação</h2>
          <div className="space-y-2">
            {pendentes.map(rotina => (
              <button
                key={rotina.id}
                onClick={() => {
                  setSelectedRotina(rotina);
                  setIsRejectingMode(false);
                  setRejectReason('');
                }}
                className="w-full text-left bg-white rounded-lg border-2 border-yellow-100 p-4 hover:border-yellow-300 hover:bg-yellow-50 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{rotina.atividade_nome}</p>
                    <p className="text-sm text-gray-600 mt-1">{rotina.usuario_nome}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <PeriodoBadge periodo={rotina.periodicidade} label={PERIODO_LABELS[rotina.periodicidade]} />
                      <span className="text-xs text-gray-500">{fmtDate(rotina.periodo_inicio)} → {fmtDate(rotina.periodo_fim)}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <AlertTriangle className="text-yellow-600" size={24} />
                  </div>
                </div>
                {rotina.comentario && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">{rotina.comentario}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Aprovadas */}
      {aprovadas.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Aprovadas</h2>
          <div className="space-y-2">
            {aprovadas.map(rotina => (
              <div
                key={rotina.id}
                className="w-full text-left bg-white rounded-lg border-2 border-green-100 p-4 bg-green-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{rotina.atividade_nome}</p>
                    <p className="text-sm text-gray-600 mt-1">{rotina.usuario_nome}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <PeriodoBadge periodo={rotina.periodicidade} label={PERIODO_LABELS[rotina.periodicidade]} />
                      <span className="text-xs text-gray-500">{fmtDate(rotina.periodo_inicio)} → {fmtDate(rotina.periodo_fim)}</span>
                    </div>
                    {rotina.data_aprovacao && (
                      <p className="text-xs text-green-600 mt-2">Aprovado em {fmtDatetime(rotina.data_aprovacao)} por {rotina.aprovador_nome}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <Check className="text-green-600" size={24} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reprovadas */}
      {reprovadas.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Reprovadas</h2>
          <div className="space-y-2">
            {reprovadas.map(rotina => (
              <div
                key={rotina.id}
                className="w-full text-left bg-white rounded-lg border-2 border-red-100 p-4 bg-red-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{rotina.atividade_nome}</p>
                    <p className="text-sm text-gray-600 mt-1">{rotina.usuario_nome}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <PeriodoBadge periodo={rotina.periodicidade} label={PERIODO_LABELS[rotina.periodicidade]} />
                      <span className="text-xs text-gray-500">{fmtDate(rotina.periodo_inicio)} → {fmtDate(rotina.periodo_fim)}</span>
                    </div>
                    {rotina.data_aprovacao && (
                      <p className="text-xs text-red-600 mt-2">Reprovado em {fmtDatetime(rotina.data_aprovacao)} por {rotina.aprovador_nome}</p>
                    )}
                    {rotina.motivo_reprovacao && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">Motivo: {rotina.motivo_reprovacao}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <X className="text-red-600" size={24} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {atividades.length === 0 && (
        <EmptyState
          icon={Check}
          title="Nenhuma atividade pendente"
          description="Todas as atividades foram processadas"
        />
      )}

      {/* Modal de Aprovação */}
      <Modal
        open={!!selectedRotina}
        onClose={() => {
          setSelectedRotina(null);
          setIsRejectingMode(false);
          setRejectReason('');
        }}
        title={selectedRotina?.atividade_nome}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedRotina(null);
                setIsRejectingMode(false);
                setRejectReason('');
              }}
            >
              Cancelar
            </Button>
            {!isRejectingMode ? (
              <>
                <Button
                  variant="danger"
                  onClick={() => setIsRejectingMode(true)}
                >
                  Reprovar
                </Button>
                <Button
                  onClick={handleAprovar}
                  loading={approveLoading}
                  icon={Check}
                >
                  Aprovar
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setIsRejectingMode(false)}
                >
                  Voltar
                </Button>
                <Button
                  variant="danger"
                  onClick={handleReprovar}
                  loading={approveLoading}
                  icon={X}
                >
                  Confirmar Reprovação
                </Button>
              </>
            )}
          </>
        }
      >
        {selectedRotina && (
          <div className="space-y-4">
            {/* Info */}
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

            {/* Comentário */}
            {selectedRotina.comentario && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Comentário</p>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  {selectedRotina.comentario}
                </div>
              </div>
            )}

            {/* Evidências */}
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

            {/* Rejeição */}
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
