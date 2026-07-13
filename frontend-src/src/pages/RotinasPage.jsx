import { useState, useEffect, useCallback, useRef } from 'react';
import { ClipboardList, Download, ExternalLink, Trash2, Paperclip, Clock, CheckCircle, AlertCircle, XCircle, AlertTriangle, Check, X, RefreshCw, FileText, Info, UploadCloud } from 'lucide-react';
import FormularioComercialModal from '../components/shared/FormularioComercialModal';
import { apiFetch, downloadExport } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { Select, Textarea, Input } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import { EmptyState, PageSpinner } from '../components/ui/Spinner';
import { StatusBadge, PeriodoBadge } from '../components/ui/Badge';
import {
  STATUS_LABELS, PERIODO_LABELS, fmtDate, fmtDatetime,
} from '../utils/constants';

// ─── Rotina Card ─────────────────────────────────────────────
const STATUS_CARD_STYLES = {
  nao_iniciada:  'border-l-gray-300',
  em_andamento:  'border-l-warning',
  concluida:     'border-l-success',
  nao_realizada: 'border-l-error',
};

const STATUS_ICONS = {
  nao_iniciada:  { Icon: Clock,         color: 'text-gray-400' },
  em_andamento:  { Icon: AlertCircle,   color: 'text-warning' },
  concluida:     { Icon: CheckCircle,   color: 'text-success' },
  nao_realizada: { Icon: XCircle,       color: 'text-error' },
};

const STATUS_APROVACAO_ICONS = {
  pendente:    { Icon: AlertTriangle, color: 'text-warning', label: 'Pendente de Aprovação' },
  aprovada:    { Icon: Check,         color: 'text-success', label: 'Aprovada' },
  reprovada:   { Icon: X,             color: 'text-error',   label: 'Reprovada' },
};

function RotinaCard({ rotina, onClick }) {
  // Atividade obrigatória vencida (pendência) é exibida como "Não Realizada".
  const displayStatus = rotina.pendente_prazo ? 'nao_realizada' : rotina.status;
  const { Icon, color } = STATUS_ICONS[displayStatus] || STATUS_ICONS.nao_iniciada;
  // Reprovada reabre a rotina em 'em_andamento' (para correção), então o status
  // sozinho não basta para decidir se mostra o badge de aprovação.
  const aprovacao = (rotina.status === 'concluida' || rotina.status_aprovacao === 'reprovada')
    ? STATUS_APROVACAO_ICONS[rotina.status_aprovacao]
    : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-xl border border-gray-100 border-l-4 ${STATUS_CARD_STYLES[displayStatus]}
                  shadow-card hover:shadow-card-md transition-all duration-150 p-4 group`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Icon size={18} className={`mt-0.5 shrink-0 ${color}`} />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate">
              {rotina.atividade_nome}
            </div>
            {rotina.atividade_descricao && (
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">{rotina.atividade_descricao}</div>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <PeriodoBadge periodo={rotina.periodicidade} label={PERIODO_LABELS[rotina.periodicidade]} />
              <StatusBadge status={displayStatus} label={STATUS_LABELS[displayStatus]} />
              {rotina.atividade_obrigatoria && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-600 font-medium">Obrigatória</span>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right min-w-[110px]">
          {rotina.periodo_label && (
            <div className="text-xs font-semibold text-gray-700">{rotina.periodo_label}</div>
          )}
          <div className="text-xs text-gray-400">{fmtDate(rotina.periodo_inicio)} → {fmtDate(rotina.periodo_fim)}</div>
          {rotina.data_conclusao && (
            <div className="text-xs text-success-dark mt-1">✓ {fmtDatetime(rotina.data_conclusao)}</div>
          )}
          {aprovacao && (
            <div className={`flex items-center justify-end gap-1 mt-1.5 ${aprovacao.color}`}>
              <aprovacao.Icon size={13} className="shrink-0" />
              <span className="text-[11px] font-semibold">{aprovacao.label}</span>
            </div>
          )}
        </div>
      </div>
      {rotina.comentario && (
        <div className="mt-2.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">
          {rotina.comentario}
        </div>
      )}
      {rotina.status_aprovacao === 'reprovada' && rotina.motivo_reprovacao && (
        <div className="mt-2.5 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <div className="line-clamp-2"><strong>Motivo da reprovação:</strong> {rotina.motivo_reprovacao}</div>
          {rotina.prazo_reenvio && (
            <div className="mt-1 text-red-500">Prazo para reenvio: {fmtDate(rotina.prazo_reenvio)}</div>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Rotina Modal ─────────────────────────────────────────────
function EvidenciasList({ evidencias, rotinaId, canEdit, onReload }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  // Upload imediato ao selecionar ou soltar arquivos (sem botão extra).
  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    let ok = 0;
    for (const f of files) {
      const form = new FormData();
      form.append('arquivo', f);
      const r = await apiFetch(`/api/rotinas/${rotinaId}/evidencias`, { method: 'POST', body: form });
      if (r?.ok) ok += 1;
      else toast(r?.data?.erro || `Erro ao anexar ${f.name}`, 'error');
    }
    if (ok > 0) { toast(ok > 1 ? `${ok} evidências anexadas!` : 'Evidência anexada!', 'success'); onReload(); }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (!canEdit || uploading) return;
    uploadFiles(e.dataTransfer.files);
  };

  const remove = async (eid) => {
    if (!confirm('Remover esta evidência?')) return;
    const r = await apiFetch(`/api/rotinas/evidencias/${eid}`, { method: 'DELETE' });
    if (r?.ok) { toast('Removida!', 'success'); onReload(); }
  };

  return (
    <div>
      {evidencias?.length > 0 ? (
        <div className="space-y-2 mb-3">
          {evidencias.map(e => (
            <div key={e.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <a href={e.url} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800 truncate">
                <Paperclip size={13} />
                <span className="truncate">{e.nome_arquivo}</span>
                <ExternalLink size={12} className="shrink-0" />
              </a>
              {canEdit && (
                <button onClick={() => remove(e.id)} className="ml-2 p-1 text-gray-400 hover:text-error transition-colors shrink-0">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-3">Nenhuma evidência anexada.</p>
      )}
      {canEdit && (
        <>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={e => uploadFiles(e.target.files)} />
          <div
            role="button"
            tabIndex={0}
            onClick={() => !uploading && inputRef.current?.click()}
            onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !uploading) inputRef.current?.click(); }}
            onDragOver={e => { e.preventDefault(); if (!uploading) setDragActive(true); }}
            onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center gap-1.5 px-4 py-5 rounded-xl border-2 border-dashed
              cursor-pointer transition-colors text-center
              ${dragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}
              ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
          >
            {uploading ? (
              <>
                <div className="h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500">Enviando...</span>
              </>
            ) : (
              <>
                <UploadCloud size={22} className="text-primary-500" />
                <span className="text-sm text-gray-600 font-medium">Arraste arquivos aqui ou clique para anexar</span>
                <span className="text-[11px] text-gray-400">Salva automaticamente ao selecionar — pode escolher vários</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function HistoricoList({ historico }) {
  if (!historico?.length) return <p className="text-sm text-gray-400">Nenhum histórico registrado.</p>;
  return (
    <div className="space-y-3">
      {historico.map(h => (
        <div key={h.id} className="flex gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
          <div>
            <div className="text-sm font-medium text-gray-700">{(h.acao || '').replace(/_/g, ' ')}</div>
            <div className="text-xs text-gray-400">{h.usuario_nome || 'Sistema'} · {fmtDatetime(h.criado_em)}</div>
            {h.observacao && <div className="text-xs text-gray-500 mt-0.5">{h.observacao}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function RotinaModal({ rotinaId, onClose, onSaved }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [rotina, setRotina] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFormulario, setShowFormulario] = useState(false);

  // form fields
  const [status, setStatus] = useState('');
  const [comentario, setComentario] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [acaoCorretiva, setAcaoCorretiva] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [novoPrazo, setNovoPrazo] = useState('');
  const [planoSemana, setPlanoSemana] = useState('');
  const [checklist, setChecklist] = useState('');
  const [relatorio, setRelatorio] = useState('');
  const [visitas, setVisitas] = useState('');
  const [resultados, setResultados] = useState('');
  const [carteira, setCarteira] = useState('');
  const [metas, setMetas] = useState('');

  const loadRotina = useCallback(async (onlyMetadata = false) => {
    if (!rotinaId) return;
    if (!onlyMetadata) setLoading(true);
    const [r, h] = await Promise.all([
      apiFetch(`/api/rotinas/${rotinaId}`),
      apiFetch(`/api/rotinas/${rotinaId}/historico`),
    ]);
    if (r?.ok) {
      const d = r.data;
      setRotina(d);

      if (!onlyMetadata) {
        // Atividade obrigatória vencida (pendência) já entra como "Não Realizada":
        // o colaborador só precisa registrar justificativa e plano de ação.
        const vencidaPendente = d.pendente_prazo && ['nao_iniciada', 'em_andamento'].includes(d.status);
        setStatus(vencidaPendente ? 'nao_realizada' : d.status);
        setComentario(d.comentario || '');
        setJustificativa(d.justificativa || '');
        setAcaoCorretiva(d.acao_corretiva || '');
        setResponsavel(d.responsavel_acao || '');
        setNovoPrazo(d.novo_prazo || '');
        setPlanoSemana(d.plano_semana || '');
        setChecklist(d.checklist || '');
        setRelatorio(d.relatorio || '');
        setVisitas(d.visitas_ativacoes || '');
        setResultados(d.resultados_visita || '');
        setCarteira(d.carteira_ativa || '');
        setMetas(d.metas_canal || '');
      }
    }
    if (h?.ok) setHistorico(h.data);
    setLoading(false);
  }, [rotinaId]);

  useEffect(() => { loadRotina(); }, [loadRotina]);

  if (!rotinaId) return null;

  const isOverdue = !!rotina?.pendente_prazo;
  // Pendência: obrigatória vencida (qualquer status) ou já "Não Realizada".
  // Tratada como não realizada: sem relatório, sem evidência obrigatória.
  const isPendencia = !!rotina?.vencida || status === 'nao_realizada';
  // Apenas o admin e o próprio dono podem preencher/editar. O Superintendente
  // pode visualizar e aprovar, mas nunca preencher o relatório de terceiros.
  const canEdit = currentUser?.perfil === 'admin' ||
                  rotina?.usuario_id === currentUser?.id;
  const canFill = canEdit && !isOverdue;
  const canRegisterOverdue = canEdit && isOverdue;
  // Em pendência (não realizada) o relatório não pode ser preenchido.
  const canFillReport = canEdit && !isPendencia;

  const prazoReenvioExpirado = rotina?.prazo_reenvio && new Date(rotina.prazo_reenvio + 'T23:59:59') < new Date();
  const canReenviar = rotina?.status_aprovacao === 'reprovada' &&
                      !prazoReenvioExpirado &&
                      (rotina?.usuario_id === currentUser?.id || currentUser?.perfil === 'admin');

  const reenviar = async () => {
    setSaving(true);
    const r = await apiFetch(`/api/rotinas/${rotinaId}/reenviar`, { method: 'POST' });
    if (r?.ok) { toast('Atividade reenviada para aprovação!', 'success'); onSaved?.(); onClose(); }
    else toast(r?.data?.erro || 'Erro ao reenviar', 'error');
    setSaving(false);
  };

  const planoObrigatorio = status === 'nao_realizada';

  const save = async () => {
    if (isOverdue && status !== 'nao_realizada') {
      toast('Atividade vencida. Registre como Não Realizada e preencha o Plano de Ação.', 'error');
      return;
    }
    if (!comentario || !comentario.trim()) {
      toast(planoObrigatorio ? 'A justificativa é obrigatória.' : 'O comentário é obrigatório.', 'error');
      return;
    }
    if (planoObrigatorio && !planoSemana.trim()) {
      toast('O Plano de Ação é obrigatório quando a atividade não foi realizada.', 'error');
      return;
    }
    if (status === 'concluida' && (!rotina?.evidencias || rotina.evidencias.length === 0)) {
      toast('Anexe pelo menos uma evidência antes de concluir a atividade', 'error');
      return;
    }
    if (status === 'concluida' && !rotina?.formulario_preenchido) {
      toast('Preencha o Relatório Comercial antes de concluir a atividade', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      status, comentario, justificativa, acao_corretiva: acaoCorretiva,
      responsavel_acao: responsavel, novo_prazo: novoPrazo || null,
      plano_semana: planoSemana, checklist, relatorio,
      visitas_ativacoes: visitas, resultados_visita: resultados,
      carteira_ativa: carteira, metas_canal: metas,
    };
    const r = await apiFetch(`/api/rotinas/${rotinaId}`, { method: 'PUT', body: JSON.stringify(payload) });
    if (r?.ok) { toast('Rotina atualizada!', 'success'); onSaved?.(); onClose(); }
    else toast(r?.data?.erro || 'Erro ao salvar', 'error');
    setSaving(false);
  };

  return (
    <>
    <Modal
      open={!!rotinaId}
      onClose={onClose}
      title={loading ? 'Carregando...' : rotina?.atividade_nome}
      size="lg"
      footer={
        !loading ? (
          <>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            {canReenviar && (
              <Button icon={RefreshCw} onClick={reenviar} loading={saving} className="bg-amber-500 hover:bg-amber-600 text-white">
                Reenviar para Aprovação
              </Button>
            )}
            <Button
              variant={rotina?.formulario_preenchido ? 'secondary' : 'primary'}
              icon={FileText}
              onClick={() => setShowFormulario(true)}
              disabled={!canFillReport && !rotina?.formulario_preenchido}
            >
              {rotina?.formulario_preenchido ? 'Ver Relatório' : 'Preencher Relatório'}
            </Button>
            {canEdit && (
              <Button onClick={save} loading={saving}>Salvar Alterações</Button>
            )}
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
        )
      }
    >
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : rotina && (
        <div className="space-y-5">
          {isPendencia && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-700 border border-red-200">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>Atividade vencida, registrada como Não Realizada. Preencha a justificativa e o plano de ação.</span>
            </div>
          )}
          {/* Formulário obrigatório alert */}
          {!rotina.formulario_preenchido && !isPendencia && (
            <div className="flex items-start gap-2 p-3 bg-warning-light rounded-xl text-sm text-warning-dark border border-yellow-200">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>O <strong>Relatório Comercial</strong> é obrigatório. Preencha-o antes de concluir a atividade.</span>
            </div>
          )}
          {rotina.formulario_preenchido && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-sm text-success-dark border border-green-100">
              <FileText size={16} />
              Relatório Comercial preenchido
            </div>
          )}

          {(!rotina.evidencias || rotina.evidencias.length === 0) && !isPendencia && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-xl text-sm text-orange-700 border border-orange-200">
              <Info size={16} className="shrink-0 mt-0.5" />
              <span><strong>Evidência obrigatória.</strong> Anexe pelo menos um arquivo antes de concluir a atividade.</span>
            </div>
          )}

          {/* Descrição da atividade */}
          {rotina.atividade_descricao && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs font-semibold text-blue-700 mb-1">O que precisa ser feito</p>
              <p className="text-sm text-blue-800">{rotina.atividade_descricao}</p>
            </div>
          )}

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Periodicidade</div>
              <PeriodoBadge periodo={rotina.periodicidade} label={PERIODO_LABELS[rotina.periodicidade]} />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Período</div>
              <div className="text-sm text-gray-700">{fmtDate(rotina.periodo_inicio)} → {fmtDate(rotina.periodo_fim)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Usuário</div>
              <div className="text-sm text-gray-700">{rotina.usuario_nome}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Tipo de Evidência</div>
              <div className="text-sm text-gray-500">{rotina.tipo_evidencia || '—'}</div>
            </div>
            {(rotina.status === 'concluida' || rotina.status_aprovacao === 'reprovada') && rotina.status_aprovacao && (
              <>
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Status Aprovação</div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    rotina.status_aprovacao === 'aprovada' ? 'bg-green-50 text-green-600' :
                    rotina.status_aprovacao === 'reprovada' ? 'bg-red-50 text-red-600' :
                    'bg-yellow-50 text-yellow-600'
                  }`}>
                    {rotina.status_aprovacao === 'pendente' ? 'Aguardando' :
                     rotina.status_aprovacao === 'aprovada' ? 'Aprovada' : 'Reprovada'}
                  </span>
                </div>
                {rotina.data_aprovacao && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Data Aprovação</div>
                    <div className="text-sm text-gray-700">{fmtDatetime(rotina.data_aprovacao)}</div>
                  </div>
                )}
                {rotina.aprovador_nome && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Aprovador</div>
                    <div className="text-sm text-gray-700">{rotina.aprovador_nome}</div>
                  </div>
                )}
                {rotina.motivo_reprovacao && (
                  <div className="col-span-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">Motivo Reprovação</div>
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{rotina.motivo_reprovacao}</div>
                  </div>
                )}
                {rotina.prazo_reenvio && (
                  <div className="col-span-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">Prazo para Reenvio</div>
                    <div className={`text-sm p-2 rounded-lg ${
                      prazoReenvioExpirado ? 'text-red-600 bg-red-50' : 'text-amber-700 bg-amber-50'
                    }`}>
                      {fmtDate(rotina.prazo_reenvio)}
                      {prazoReenvioExpirado && ' (expirado)'}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status */}
          <Select label="Status" value={status} onChange={e => setStatus(e.target.value)} disabled={!canEdit || isPendencia} required>
            <option value="nao_iniciada" disabled={isPendencia}>Não Iniciada</option>
            <option value="em_andamento" disabled={isPendencia}>Em Andamento</option>
            <option value="concluida" disabled={isPendencia}>Concluída</option>
            <option value="nao_realizada">Não Realizada</option>
          </Select>

          <Textarea label={planoObrigatorio ? 'Justificativa' : 'Comentário'} value={comentario} onChange={e => setComentario(e.target.value)}
            rows={2} placeholder={planoObrigatorio ? 'Justifique por que a atividade não foi realizada...' : 'Observações sobre a execução...'}
            disabled={!(canFill || canRegisterOverdue)} required />

          <Textarea label={planoObrigatorio ? 'Plano de Ação' : 'Plano da Semana'} value={planoSemana} onChange={e => setPlanoSemana(e.target.value)}
            rows={3} placeholder={planoObrigatorio ? 'Obrigatório: descreva o plano de ação para a atividade não realizada...' : 'Registre o plano da semana...'}
            disabled={!(canFill || canRegisterOverdue)} required={planoObrigatorio} />

          {/* Divider */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Evidências e Anexos</h4>
              {!isPendencia && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-600">Obrigatório</span>
              )}
            </div>
            {status === 'concluida' && (!rotina.evidencias || rotina.evidencias.length === 0) && !isOverdue && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                Anexe pelo menos uma evidência para concluir esta atividade.
              </p>
            )}
            <EvidenciasList
              evidencias={rotina.evidencias}
              rotinaId={rotinaId}
              canEdit={canFill}
              onReload={() => loadRotina(true)}
            />
          </div>

          {/* Histórico */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Histórico</h4>
            <HistoricoList historico={historico} />
          </div>

          {rotina.data_conclusao && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-sm text-success-dark">
              <CheckCircle size={16} />
              Concluída em {fmtDatetime(rotina.data_conclusao)}
            </div>
          )}
        </div>
      )}
    </Modal>

    {showFormulario && rotina && (
      <FormularioComercialModal
        rotinaId={rotinaId}
        rotina={rotina}
        currentUser={currentUser}
        readOnly={!canFillReport}
        onClose={() => setShowFormulario(false)}
        onSaved={() => loadRotina(true)}
      />
    )}
  </>
  );
}

// ─── Rotinas Page ─────────────────────────────────────────────
export default function RotinasPage() {
  const { currentUser } = useAuth();
  const [rotinas, setRotinas] = useState([]);
  const [aderencia, setAderencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('todas');
  const [statusFilter, setStatusFilter] = useState('');
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    let url = `/api/rotinas/?periodo=${periodo}&usuario_id=${currentUser.id}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    const [r, adh] = await Promise.all([
      apiFetch(url),
      apiFetch(`/api/rotinas/minha-aderencia?periodo=${periodo}`),
    ]);
    if (r?.ok) setRotinas(r.data);
    if (adh?.ok) setAderencia(adh.data);
    setLoading(false);
  }, [periodo, statusFilter, currentUser]);

  useEffect(() => { load(); }, [load]);

  const exportar = () => {
    let url = `/api/rotinas/export?periodo=${periodo}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    downloadExport(url, `rotinas_${periodo}.csv`).catch(() => {});
  };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={periodo} onChange={e => setPeriodo(e.target.value)} className="w-36">
          <option value="todas">Todas</option>
          <option value="diaria">Diaria</option>
          <option value="semanal">Semanal</option>
          <option value="quinzenal">Quinzenal</option>
          <option value="mensal">Mensal</option>
        </Select>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-44">
          <option value="">Todos os Status</option>
          <option value="nao_iniciada">Nao Iniciada</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="concluida">Concluida</option>
          <option value="nao_realizada">Não Realizada</option>
        </Select>
        <Button variant="secondary" icon={Download} onClick={exportar} className="ml-auto">Exportar CSV</Button>
      </div>

      {/* Adherence card */}
      {aderencia && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Aderência Pessoal</p>
              <p className={`text-3xl font-bold mt-1 ${aderencia.percentual_execucao >= 80 ? 'text-success-dark' : aderencia.percentual_execucao >= 50 ? 'text-warning-dark' : 'text-error-dark'}`}>
                {aderencia.percentual_execucao}%
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              {aderencia.concluidas} de {aderencia.total} atividades<br />
              <span className="text-xs">concluídas no período</span>
            </div>
          </div>
          <ProgressBar value={aderencia.percentual_execucao}
            color={aderencia.percentual_execucao >= 80 ? 'bg-success' : aderencia.percentual_execucao >= 50 ? 'bg-warning' : 'bg-error'} />
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <PageSpinner />
      ) : rotinas.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhuma rotina encontrada" description="Não há atividades para o período e filtros selecionados." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rotinas.map(r => (
            <RotinaCard key={r.id} rotina={r} onClick={() => setOpenId(r.id)} />
          ))}
        </div>
      )}

      <RotinaModal rotinaId={openId} onClose={() => setOpenId(null)} onSaved={load} />
    </div>
  );
}
