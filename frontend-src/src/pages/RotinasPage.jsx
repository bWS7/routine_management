import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Download, ExternalLink, Trash2, Paperclip, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { apiFetch, downloadExport } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { Select, Textarea, Input } from '../components/ui/Input';
import { StatCard } from '../components/ui/StatCard';
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

function RotinaCard({ rotina, onClick }) {
  const { Icon, color } = STATUS_ICONS[rotina.status] || STATUS_ICONS.nao_iniciada;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-xl border border-gray-100 border-l-4 ${STATUS_CARD_STYLES[rotina.status]}
                  shadow-card hover:shadow-card-md transition-all duration-150 p-4 group`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Icon size={18} className={`mt-0.5 shrink-0 ${color}`} />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate">
              {rotina.atividade_nome}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <PeriodoBadge periodo={rotina.periodicidade} label={PERIODO_LABELS[rotina.periodicidade]} />
              <StatusBadge status={rotina.status} label={STATUS_LABELS[rotina.status]} />
              {rotina.atividade_obrigatoria && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-600 font-medium">Obrigatória</span>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs text-gray-400">{fmtDate(rotina.periodo_inicio)} → {fmtDate(rotina.periodo_fim)}</div>
          {rotina.data_conclusao && (
            <div className="text-xs text-success-dark mt-1">✓ {fmtDatetime(rotina.data_conclusao)}</div>
          )}
        </div>
      </div>
      {rotina.comentario && (
        <div className="mt-2.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">
          {rotina.comentario}
        </div>
      )}
    </button>
  );
}

// ─── Rotina Modal ─────────────────────────────────────────────
function EvidenciasList({ evidencias, rotinaId, canEdit, onReload }) {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!file) { toast('Selecione um arquivo', 'error'); return; }
    setUploading(true);
    const form = new FormData();
    form.append('arquivo', file);
    const r = await apiFetch(`/api/rotinas/${rotinaId}/evidencias`, { method: 'POST', body: form });
    if (r?.ok) { toast('Evidência anexada!', 'success'); onReload(); }
    else toast(r?.data?.erro || 'Erro ao anexar', 'error');
    setUploading(false);
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
        <div className="flex items-center gap-2">
          <input
            type="file"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="flex-1 text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                       file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          <Button variant="secondary" icon={Paperclip} loading={uploading} onClick={upload}>Anexar</Button>
        </div>
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

  const loadRotina = useCallback(async () => {
    if (!rotinaId) return;
    setLoading(true);
    const [r, h] = await Promise.all([
      apiFetch(`/api/rotinas/${rotinaId}`),
      apiFetch(`/api/rotinas/${rotinaId}/historico`),
    ]);
    if (r?.ok) {
      const d = r.data;
      setRotina(d);
      setStatus(d.status);
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
    if (h?.ok) setHistorico(h.data);
    setLoading(false);
  }, [rotinaId]);

  useEffect(() => { loadRotina(); }, [loadRotina]);

  if (!rotinaId) return null;

  const canEdit = currentUser?.perfil === 'admin' ||
                  rotina?.usuario_id === currentUser?.id ||
                  currentUser?.perfil === 'sr';

  const showJustificativa = status === 'nao_realizada' || status === 'em_andamento';
  const showAcao = status === 'nao_realizada';

  const save = async () => {
    if (status === 'nao_realizada' && (!justificativa || !acaoCorretiva)) {
      toast('Preencha a justificativa e o plano de ação', 'error');
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
    else toast('Erro ao salvar', 'error');
    setSaving(false);
  };

  return (
    <Modal
      open={!!rotinaId}
      onClose={onClose}
      title={loading ? 'Carregando...' : rotina?.atividade_nome}
      size="lg"
      footer={
        canEdit && !loading ? (
          <>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={save} loading={saving}>Salvar Alterações</Button>
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
          </div>

          {/* Status */}
          <Select label="Status" value={status} onChange={e => setStatus(e.target.value)} disabled={!canEdit} required>
            <option value="nao_iniciada">Não Iniciada</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluida">Concluída</option>
            <option value="nao_realizada">Não Realizada</option>
          </Select>

          <Textarea label="Comentário" value={comentario} onChange={e => setComentario(e.target.value)}
            rows={2} placeholder="Observações sobre a execução..." disabled={!canEdit} required />

          {/* Plano da semana (sr, gv, cd) */}
          {['sr', 'gv', 'cd'].includes(rotina.perfil) && (
            <Textarea label="Plano da Semana" value={planoSemana} onChange={e => setPlanoSemana(e.target.value)}
              rows={2} placeholder="Registre o plano da semana..." disabled={!canEdit} />
          )}

          {/* CD fields */}
          {rotina.perfil === 'cd' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Textarea label="Checklist" value={checklist} onChange={e => setChecklist(e.target.value)}
                rows={3} placeholder="Checklist operacional..." disabled={!canEdit} />
              <Textarea label="Relatório" value={relatorio} onChange={e => setRelatorio(e.target.value)}
                rows={3} placeholder="Resumo do relatório..." disabled={!canEdit} />
            </div>
          )}

          {/* SP fields */}
          {rotina.perfil === 'sp' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Textarea label="Visitas / Ativações" value={visitas} onChange={e => setVisitas(e.target.value)}
                rows={3} disabled={!canEdit} />
              <Textarea label="Resultados por Visita" value={resultados} onChange={e => setResultados(e.target.value)}
                rows={3} disabled={!canEdit} />
              <Textarea label="Carteira Ativa" value={carteira} onChange={e => setCarteira(e.target.value)}
                rows={3} disabled={!canEdit} />
              <Textarea label="Metas do Canal" value={metas} onChange={e => setMetas(e.target.value)}
                rows={3} disabled={!canEdit} />
            </div>
          )}

          {/* Justificativa */}
          {showJustificativa && (
            <Textarea label="Justificativa" value={justificativa} onChange={e => setJustificativa(e.target.value)}
              rows={2} placeholder="Por que não foi realizada?" disabled={!canEdit} required />
          )}

          {/* Ação corretiva */}
          {showAcao && (
            <>
              <Textarea label="Ação Corretiva" value={acaoCorretiva} onChange={e => setAcaoCorretiva(e.target.value)}
                rows={2} placeholder="O que será feito para corrigir?" disabled={!canEdit} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Responsável pela ação" value={responsavel} onChange={e => setResponsavel(e.target.value)} disabled={!canEdit} required />
                <Input type="date" label="Novo prazo" value={novoPrazo} onChange={e => setNovoPrazo(e.target.value)} disabled={!canEdit} required />
              </div>
            </>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Evidências e Anexos</h4>
            <EvidenciasList
              evidencias={rotina.evidencias}
              rotinaId={rotinaId}
              canEdit={canEdit}
              onReload={loadRotina}
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
  );
}

// ─── Rotinas Page ─────────────────────────────────────────────
export default function RotinasPage() {
  const { currentUser } = useAuth();
  const [rotinas, setRotinas] = useState([]);
  const [aderencia, setAderencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('semanal');
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
          <option value="semanal">Semanal</option>
          <option value="quinzenal">Quinzenal</option>
          <option value="mensal">Mensal</option>
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
