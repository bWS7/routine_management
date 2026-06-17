import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Paperclip, ExternalLink, Trash2, FileText, AlertTriangle, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { Select, Input, Textarea } from '../ui/Input';
import Button from '../ui/Button';
import { PeriodoBadge } from '../ui/Badge';
import { PERIODO_LABELS, fmtDate, fmtDatetime } from '../../utils/constants';
import FormularioComercialModal from './FormularioComercialModal';

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
    if (r?.ok) { toast('Evidência anexada!', 'success'); onReload(); setFile(null); }
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
              <a href={e.url} target="_blank" rel="noopener noreferrer" download={e.nome_arquivo}
                 className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800 truncate min-w-0">
                <Paperclip size={13} className="shrink-0" />
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
          <Button variant="secondary" icon={Paperclip} loading={uploading} onClick={upload} size="xs">Anexar</Button>
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
          <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 shrink-0" />
          <div>
            <div className="text-sm font-medium text-gray-700">{(h.acao || '').replace(/_/g, ' ')}</div>
            <div className="text-xs text-gray-400">{h.usuario_nome || 'Sistema'} · {fmtDatetime(h.criado_em)}</div>
            {h.observacao && <div className="text-xs text-gray-500 mt-0.5 italic">{h.observacao}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RotinaModal({ rotinaId, onClose, onSaved }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [rotina, setRotina] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFormulario, setShowFormulario] = useState(false);

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
      
      // Only set form fields if it's the initial load
      if (!onlyMetadata) {
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
    }
    if (h?.ok) setHistorico(h.data);
    setLoading(false);
  }, [rotinaId]);

  useEffect(() => { loadRotina(); }, [loadRotina]);

  const isOverdue = !!rotina?.pendente_prazo;
  const canEdit = currentUser?.perfil === 'admin' ||
                  rotina?.usuario_id === currentUser?.id ||
                  currentUser?.perfil === 'sr';
  const canFill = canEdit && !isOverdue;
  const canRegisterOverdue = canEdit && isOverdue;

  const showJustificativa = status === 'nao_realizada' || status === 'em_andamento';
  const showAcao = status === 'nao_realizada';

  const save = async () => {
    if (isOverdue && status !== 'nao_realizada') {
      toast('Atividade vencida. Registre como nao realizada com justificativa e plano de acao.', 'error');
      return;
    }
    if (status === 'nao_realizada' && (!justificativa || !acaoCorretiva)) {
      toast('Preencha a justificativa e o plano de ação', 'error');
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
    if (r?.ok) { toast('Rotina atualizada!', 'success'); onSaved?.(); onClose?.(); }
    else toast('Erro ao salvar', 'error');
    setSaving(false);
  };

  return (
    <>
    <Modal
      open={!!rotinaId}
      onClose={onClose}
      title={loading ? 'Carregando...' : (rotina?.atividade_nome || 'Detalhes da Atividade')}
      size="lg"
      footer={
        canEdit && !loading ? (
          <>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button
              variant={rotina?.formulario_preenchido ? 'secondary' : 'primary'}
              icon={FileText}
              onClick={() => setShowFormulario(true)}
              disabled={!canFill && !rotina?.formulario_preenchido}
            >
              {rotina?.formulario_preenchido ? 'Ver Relatório' : 'Preencher Relatório'}
            </Button>
            <Button onClick={save} loading={saving}>Salvar Alterações</Button>
          </>
        ) : (
          <>
            {rotina && (
              <Button variant="secondary" icon={FileText} onClick={() => setShowFormulario(true)}>
                Ver Relatório
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>Fechar</Button>
          </>
        )
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rotina && (
        <div className="space-y-5">
          {isOverdue && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-700 border border-red-200">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>Atividade vencida. O preenchimento foi bloqueado; registre como nao realizada com justificativa e plano de acao.</span>
            </div>
          )}
          {/* Formulário obrigatório alert */}
          {!rotina.formulario_preenchido && !isOverdue && (
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

          {/* Evidência obrigatória */}
          {(!rotina.evidencias || rotina.evidencias.length === 0) && !isOverdue && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-xl text-sm text-orange-700 border border-orange-200">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
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

          {/* Meta info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl">
            <div>
              <div className="text-xs font-medium text-gray-400 mb-1">Periodicidade</div>
              <PeriodoBadge periodo={rotina.periodicidade} label={PERIODO_LABELS[rotina.periodicidade]} />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 mb-1">Período</div>
              <div className="text-xs text-gray-700">{fmtDate(rotina.periodo_inicio)} → {fmtDate(rotina.periodo_fim)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 mb-1">Usuário</div>
              <div className="text-xs text-gray-700">{rotina.usuario_nome}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 mb-1">Evidência</div>
              <div className="text-xs text-gray-500">{rotina.tipo_evidencia || '—'}</div>
            </div>
          </div>

          <Select label="Status" value={status} onChange={e => setStatus(e.target.value)} disabled={!canEdit}>
            <option value="nao_iniciada" disabled={isOverdue}>Não Iniciada</option>
            <option value="em_andamento" disabled={isOverdue}>Em Andamento</option>
            <option value="concluida" disabled={isOverdue}>Concluída</option>
            <option value="nao_realizada">Não Realizada</option>
          </Select>

          <Textarea label="Comentário" value={comentario} onChange={e => setComentario(e.target.value)}
            rows={2} placeholder="Observações sobre a execução..." disabled={!canFill} />

          {['sr', 'gv', 'cd'].includes(rotina.perfil) && (
            <Textarea label="Plano da Semana" value={planoSemana} onChange={e => setPlanoSemana(e.target.value)}
              rows={2} placeholder="Registre o plano da semana..." disabled={!canFill} />
          )}

          {rotina.perfil === 'cd' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Textarea label="Checklist" value={checklist} onChange={e => setChecklist(e.target.value)} rows={3} disabled={!canFill} />
              <Textarea label="Relatório" value={relatorio} onChange={e => setRelatorio(e.target.value)} rows={3} disabled={!canFill} />
            </div>
          )}

          {rotina.perfil === 'sp' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Textarea label="Visitas / Ativações" value={visitas} onChange={e => setVisitas(e.target.value)} rows={3} disabled={!canFill} />
              <Textarea label="Resultados por Visita" value={resultados} onChange={e => setResultados(e.target.value)} rows={3} disabled={!canFill} />
              <Textarea label="Carteira Ativa" value={carteira} onChange={e => setCarteira(e.target.value)} rows={3} disabled={!canFill} />
              <Textarea label="Metas do Canal" value={metas} onChange={e => setMetas(e.target.value)} rows={3} disabled={!canFill} />
            </div>
          )}

          {showJustificativa && (
            <Textarea label="Justificativa" value={justificativa} onChange={e => setJustificativa(e.target.value)}
              rows={2} placeholder="Por que não foi realizada?" disabled={!(canFill || canRegisterOverdue)} />
          )}

          {showAcao && (
            <>
              <Textarea label="Ação Corretiva" value={acaoCorretiva} onChange={e => setAcaoCorretiva(e.target.value)}
                rows={2} placeholder="O que será feito para corrigir?" disabled={!(canFill || canRegisterOverdue)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Responsável" value={responsavel} onChange={e => setResponsavel(e.target.value)} disabled={!(canFill || canRegisterOverdue)} />
                <Input type="date" label="Novo prazo" value={novoPrazo} onChange={e => setNovoPrazo(e.target.value)} disabled={!(canFill || canRegisterOverdue)} />
              </div>
            </>
          )}

          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Evidências e Anexos</h4>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-600">Obrigatório</span>
            </div>
            {status === 'concluida' && (!rotina.evidencias || rotina.evidencias.length === 0) && !isOverdue && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                Anexe pelo menos uma evidência para concluir esta atividade.
              </p>
            )}
            <EvidenciasList evidencias={rotina.evidencias} rotinaId={rotinaId} canEdit={canFill} onReload={() => loadRotina(true)} />
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Histórico</h4>
            <HistoricoList historico={historico} />
          </div>

          {rotina.data_conclusao && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-sm text-success-dark border border-green-100">
              <CheckCircle size={16} />
              Concluída em {fmtDatetime(rotina.data_conclusao)}
            </div>
          )}
        </div>
      )}
    </Modal>

    {showFormulario && (
      <FormularioComercialModal
        rotinaId={rotinaId}
        rotina={rotina}
        currentUser={currentUser}
        readOnly={!canFill}
        onClose={() => setShowFormulario(false)}
        onSaved={() => { loadRotina(true); }}
      />
    )}
  </>
  );
}
