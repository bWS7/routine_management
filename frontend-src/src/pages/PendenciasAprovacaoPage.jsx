import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Check, X, AlertTriangle, FileText, Paperclip, ExternalLink } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { EmptyState, PageSpinner } from '../components/ui/Spinner';
import { PeriodoBadge } from '../components/ui/Badge';
import Pagination, { usePagination } from '../components/ui/Pagination';
import { PERIODO_LABELS, fmtDate, fmtDatetime } from '../utils/constants';
import FormularioComercialModal from '../components/shared/FormularioComercialModal';

const APROVACAO_PER_PAGE = 20;

function PendenciasAprovacaoPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('pendente');
  const [selectedRotina, setSelectedRotina] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectingMode, setIsRejectingMode] = useState(false);
  const [showFormulario, setShowFormulario] = useState(false);
  const [formularioPreview, setFormularioPreview] = useState(null);
  const [loadingFormulario, setLoadingFormulario] = useState(false);
  const reviewStartRef = useRef(null);

  const loadAtividades = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch('/api/rotinas/para-aprovar?status_aprovacao=todas');
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

  const selectRotina = async (rotina) => {
    reviewStartRef.current = Date.now();
    setSelectedRotina(rotina);
    setIsRejectingMode(false);
    setRejectReason('');
    setFormularioPreview(null);
    setLoadingFormulario(true);
    const r = await apiFetch(`/api/rotinas/${rotina.id}/formulario`);
    if (r?.ok && r.data.formulario && Object.keys(r.data.formulario).length > 0) {
      setFormularioPreview(r.data.formulario);
    }
    setLoadingFormulario(false);
  };

  const getDuracaoRevisao = () => {
    if (!reviewStartRef.current) return undefined;
    return Math.floor((Date.now() - reviewStartRef.current) / 1000);
  };

  const closeModal = () => {
    setSelectedRotina(null);
    setIsRejectingMode(false);
    setRejectReason('');
    setFormularioPreview(null);
    setShowFormulario(false);
  };

  const handleAprovar = async () => {
    if (!selectedRotina) return;
    setApproveLoading(true);
    const r = await apiFetch(`/api/rotinas/${selectedRotina.id}/aprovar`, {
      method: 'POST',
      body: JSON.stringify({ motivo: '', duracao_revisao_segundos: getDuracaoRevisao() })
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
      body: JSON.stringify({ motivo: rejectReason, duracao_revisao_segundos: getDuracaoRevisao() })
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

  const pendentes = useMemo(() => atividades.filter(a => a.status_aprovacao === 'pendente'), [atividades]);
  const aprovadas = useMemo(() => atividades.filter(a => a.status_aprovacao === 'aprovada'), [atividades]);
  const reprovadas = useMemo(() => atividades.filter(a => a.status_aprovacao === 'reprovada'), [atividades]);

  const lista = filtro === 'pendente' ? pendentes : filtro === 'aprovada' ? aprovadas : reprovadas;
  const { page, setPage, pages, total, slice } = usePagination(lista, APROVACAO_PER_PAGE, filtro);

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aprovação de Atividades</h1>
        <p className="text-gray-600 mt-1">Revise e aprove as atividades concluídas pelos usuários da sua regional</p>
      </div>

      {/* Filtros clicáveis */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { key: 'pendente',  label: 'Aguardando Aprovação', count: pendentes.length,  Icon: AlertTriangle, active: 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300', inactive: 'bg-white border-gray-200 hover:border-gray-300', numColor: 'text-yellow-600', iconColor: 'text-yellow-500' },
          { key: 'aprovada',  label: 'Aprovadas',            count: aprovadas.length,  Icon: Check,         active: 'border-green-400 bg-green-50 ring-2 ring-green-300',   inactive: 'bg-white border-gray-200 hover:border-gray-300', numColor: 'text-green-600',  iconColor: 'text-green-500' },
          { key: 'reprovada', label: 'Reprovadas',           count: reprovadas.length, Icon: X,             active: 'border-red-400 bg-red-50 ring-2 ring-red-300',         inactive: 'bg-white border-gray-200 hover:border-gray-300', numColor: 'text-red-600',    iconColor: 'text-red-500' },
        ].map(({ key, label, count, Icon, active, inactive, numColor, iconColor }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className={`text-left rounded-xl border-2 p-4 transition-all duration-150 ${filtro === key ? active : inactive}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{label}</p>
                <p className={`text-3xl font-bold mt-1 ${filtro === key ? numColor : 'text-gray-800'}`}>{count}</p>
              </div>
              <Icon className={filtro === key ? iconColor : 'text-gray-400'} size={32} />
            </div>
          </button>
        ))}
      </div>

      {/* Lista filtrada */}
      {(() => {
        if (lista.length === 0) return (
          <EmptyState
            icon={filtro === 'pendente' ? AlertTriangle : filtro === 'aprovada' ? Check : X}
            title={filtro === 'pendente' ? 'Nenhuma atividade aguardando aprovação' : filtro === 'aprovada' ? 'Nenhuma atividade aprovada' : 'Nenhuma atividade reprovada'}
            description=""
          />
        );
        const borderClass = filtro === 'pendente' ? 'border-yellow-100 hover:border-yellow-300 hover:bg-yellow-50' : filtro === 'aprovada' ? 'border-green-100 bg-green-50 hover:border-green-300' : 'border-red-100 bg-red-50 hover:border-red-300';
        const Icon = filtro === 'pendente' ? AlertTriangle : filtro === 'aprovada' ? Check : X;
        const iconColor = filtro === 'pendente' ? 'text-yellow-600' : filtro === 'aprovada' ? 'text-green-600' : 'text-red-600';
        return (
          <div className="space-y-2">
            {slice.map(rotina => (
              <button
                key={rotina.id}
                onClick={() => selectRotina(rotina)}
                className={`w-full text-left bg-white rounded-lg border-2 p-4 transition-all cursor-pointer ${borderClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{rotina.atividade_nome}</p>
                    <p className="text-sm text-gray-600 mt-1">{rotina.usuario_nome}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <PeriodoBadge periodo={rotina.periodicidade} label={PERIODO_LABELS[rotina.periodicidade]} />
                      {rotina.periodo_label && (
                        <span className="text-xs font-semibold text-gray-700">{rotina.periodo_label}</span>
                      )}
                      <span className="text-xs text-gray-500">{fmtDate(rotina.periodo_inicio)} → {fmtDate(rotina.periodo_fim)}</span>
                    </div>
                    {rotina.comentario && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{rotina.comentario}</p>}
                    {filtro === 'aprovada' && rotina.data_aprovacao && (
                      <p className="text-xs text-green-700 mt-2">✓ Aprovado em {fmtDatetime(rotina.data_aprovacao)} por {rotina.aprovador_nome}</p>
                    )}
                    {filtro === 'reprovada' && (
                      <>
                        {rotina.data_aprovacao && <p className="text-xs text-red-700 mt-2">✗ Reprovado em {fmtDatetime(rotina.data_aprovacao)} por {rotina.aprovador_nome}</p>}
                        {rotina.motivo_reprovacao && <p className="text-xs text-red-700 font-semibold mt-1">Motivo: {rotina.motivo_reprovacao}</p>}
                      </>
                    )}
                  </div>
                  <div className="shrink-0"><Icon className={iconColor} size={22} /></div>
                </div>
              </button>
            ))}
            <Pagination page={page} pages={pages} total={total} perPage={APROVACAO_PER_PAGE} onChange={setPage} className="border-t-0 pt-1" />
          </div>
        );
      })()}

      {/* Modal de Aprovação */}
      <Modal
        open={!!selectedRotina}
        onClose={closeModal}
        title={selectedRotina?.atividade_nome}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Fechar</Button>
            {selectedRotina?.status_aprovacao === 'pendente' && (
              !isRejectingMode ? (
                <>
                  <Button variant="danger" onClick={() => setIsRejectingMode(true)} icon={X}>Reprovar</Button>
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
          <div className="space-y-5">

            {/* Info geral */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Usuário</p>
                <p className="text-sm text-gray-900 font-semibold">{selectedRotina.usuario_nome}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Período</p>
                {selectedRotina.periodo_label && (
                  <p className="text-sm text-gray-900 font-semibold">{selectedRotina.periodo_label}</p>
                )}
                <p className="text-sm text-gray-900">{fmtDate(selectedRotina.periodo_inicio)} → {fmtDate(selectedRotina.periodo_fim)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Periodicidade</p>
                <PeriodoBadge periodo={selectedRotina.periodicidade} label={PERIODO_LABELS[selectedRotina.periodicidade]} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Concluída em</p>
                <p className="text-sm text-gray-900">{fmtDatetime(selectedRotina.data_conclusao)}</p>
              </div>
            </div>

            {/* Comentário */}
            {selectedRotina.comentario && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {selectedRotina.status === 'nao_realizada' ? 'Justificativa do colaborador' : 'Comentário do colaborador'}
                </p>
                <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-700 border border-gray-100">
                  {selectedRotina.comentario}
                </div>
              </div>
            )}

            {/* Evidências */}
            {selectedRotina.evidencias?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Evidências anexadas ({selectedRotina.evidencias.length})
                </p>
                <div className="space-y-1.5">
                  {selectedRotina.evidencias.map(e => (
                    <a key={e.id} href={e.url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg text-sm text-primary-600 hover:text-primary-800 hover:bg-primary-50 transition-colors border border-gray-100">
                      <Paperclip size={13} className="shrink-0" />
                      <span className="truncate">{e.nome_arquivo}</span>
                      <ExternalLink size={12} className="shrink-0 ml-auto" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Relatório Comercial */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-primary-600" />
                  <span className="text-sm font-semibold text-gray-800">Relatório Comercial</span>
                  {selectedRotina.formulario_preenchido ? (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Preenchido</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600 font-medium">Não preenchido</span>
                  )}
                </div>
                {selectedRotina.formulario_preenchido && (
                  <Button variant="secondary" size="xs" icon={FileText} onClick={() => setShowFormulario(true)}>
                    Ver relatório completo
                  </Button>
                )}
              </div>

              {loadingFormulario ? (
                <div className="flex justify-center py-6">
                  <div className="h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : formularioPreview ? (
                <div className="p-4 space-y-4">

                  {/* Identificação */}
                  {(formularioPreview.categoria || formularioPreview.empreendimento || formularioPreview.data_execucao) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      {formularioPreview.categoria && (
                        <div><p className="text-xs text-gray-400">Categoria</p><p className="font-medium text-gray-800">{formularioPreview.categoria}</p></div>
                      )}
                      {formularioPreview.data_execucao && (
                        <div><p className="text-xs text-gray-400">Data execução</p><p className="font-medium text-gray-800">{fmtDate(formularioPreview.data_execucao)}</p></div>
                      )}
                      {formularioPreview.empreendimento && (
                        <div><p className="text-xs text-gray-400">Empreendimento</p><p className="font-medium text-gray-800">{formularioPreview.empreendimento}</p></div>
                      )}
                      {formularioPreview.hora_inicio && (
                        <div><p className="text-xs text-gray-400">Horário</p><p className="font-medium text-gray-800">{formularioPreview.hora_inicio}{formularioPreview.hora_termino ? ` → ${formularioPreview.hora_termino}` : ''}</p></div>
                      )}
                    </div>
                  )}

                  {/* Objetivo */}
                  {formularioPreview.objetivo && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Objetivo</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{formularioPreview.objetivo}</p>
                    </div>
                  )}

                  {/* Resumo */}
                  {formularioPreview.resumo_execucao && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Resumo da execução</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{formularioPreview.resumo_execucao}</p>
                    </div>
                  )}

                  {/* Resultados */}
                  {formularioPreview.resultados && Object.values(formularioPreview.resultados).some(r => r.resultado_atual) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Resultados / Indicadores</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[360px]">
                          <thead>
                            <tr className="border-b border-gray-100">
                              {['Indicador', 'Resultado', 'Meta', 'Status'].map(h => (
                                <th key={h} className="text-left text-gray-400 font-medium pb-1.5 pr-3">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(formularioPreview.resultados).filter(([, v]) => v.resultado_atual).map(([ind, v]) => (
                              <tr key={ind} className="border-b border-gray-50">
                                <td className="pr-3 py-1.5 font-medium text-gray-700">{ind}</td>
                                <td className="pr-3 py-1.5 text-gray-600">{v.resultado_atual}</td>
                                <td className="pr-3 py-1.5 text-gray-600">{v.meta || '—'}</td>
                                <td className="py-1.5">
                                  {v.status && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      v.status === 'OK' ? 'bg-green-100 text-green-700' :
                                      v.status === 'Atenção' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>{v.status}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Avaliação final */}
                  {formularioPreview.objetivo_atingido && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400 font-medium">Objetivo atingido?</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        formularioPreview.objetivo_atingido === 'Sim' ? 'bg-green-100 text-green-700' :
                        formularioPreview.objetivo_atingido === 'Parcialmente' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-600'
                      }`}>{formularioPreview.objetivo_atingido}</span>
                    </div>
                  )}

                  {/* Dificuldades */}
                  {formularioPreview.dificuldades && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Dificuldades identificadas</p>
                      <p className="text-sm text-gray-700 bg-yellow-50 rounded-lg p-3 border border-yellow-100">{formularioPreview.dificuldades}</p>
                    </div>
                  )}

                  {/* Próximos passos */}
                  {formularioPreview.proximos_passos && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Próximos passos</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{formularioPreview.proximos_passos}</p>
                    </div>
                  )}

                  <button onClick={() => setShowFormulario(true)}
                    className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium">
                    <FileText size={13} /> Ver relatório completo com todos os campos
                  </button>
                </div>
              ) : selectedRotina.formulario_preenchido ? (
                <div className="p-4 text-center text-sm text-gray-400">Carregando relatório...</div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-400">Nenhum relatório preenchido pelo colaborador.</div>
              )}
            </div>

            {/* Reprovação */}
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

      {/* Modal do relatório completo (read-only) */}
      {showFormulario && selectedRotina && (
        <FormularioComercialModal
          rotinaId={selectedRotina.id}
          rotina={selectedRotina}
          currentUser={currentUser}
          readOnly
          onClose={() => setShowFormulario(false)}
        />
      )}
    </div>
  );
}

export default PendenciasAprovacaoPage;
