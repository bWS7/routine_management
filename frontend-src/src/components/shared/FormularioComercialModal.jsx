import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';
import { apiFetch } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { Select, Input, Textarea } from '../ui/Input';
import Button from '../ui/Button';

const CATEGORIAS = ['Reunião', 'Treinamento', 'Diagnóstico', 'Acompanhamento', 'Planejamento', 'Relatório', 'Comitê', 'Externo'];
const PERIODICIDADES = ['Diária', 'Semanal', 'Quinzenal', 'Mensal', 'Eventual'];
const STATUS_INDICADOR = ['OK', 'Atenção', 'Crítico'];
const MOTIVOS_DESVIO = ['Atraso operacional', 'Baixa conversão', 'Perda de lead', 'Falta de padrão', 'Erro de processo', 'Falha de comunicação', 'Baixa produtividade', 'Falta de treinamento', 'Problema sistêmico'];
const AREAS = ['Processo', 'Pessoas', 'Sistema', 'Comunicação', 'Gestão', 'Treinamento', 'Ferramenta', 'Comercial', 'Marketing', 'Operacional'];
const PRIORIDADES = ['Alta', 'Média', 'Baixa'];
const STATUS_ACAO = ['Aberto', 'Em andamento', 'Concluído'];
const AREAS_ESCALONAMENTO = ['Diretoria', 'Marketing', 'Crédito', 'TI', 'Produto', 'Jurídico', 'Operações', 'RH'];
const SIM_NAO = ['Sim', 'Parcialmente', 'Não'];

const INDICADORES = ['Leads', 'Conversão', 'Visitas', 'Reservas', 'Vendas'];

const PERFIL_LABELS = {
  admin: 'Administrador',
  sr: 'Superintendente Regional',
  gv: 'Gerente de Vendas',
  cd: 'Coordenador de Produto',
  sp: 'Supervisor de Parceria',
};

function SectionTitle({ number, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
        {number}
      </div>
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{title}</h3>
    </div>
  );
}

function Section({ children, className = '' }) {
  return (
    <div className={`border border-gray-100 rounded-xl p-4 space-y-3 ${className}`}>
      {children}
    </div>
  );
}

function emptyParticipante() {
  return { nome: '', cargo: '', area: '', observacoes: '' };
}

function emptyAcao() {
  return { acao: '', responsavel: '', prazo: '', prioridade: 'Alta', status: 'Aberto' };
}

function buildInitialForm(rotina, currentUser) {
  return {
    categoria: '',
    empreendimento: '',
    data_execucao: new Date().toISOString().split('T')[0],
    hora_inicio: '',
    hora_termino: '',
    objetivo: '',
    resumo_execucao: '',
    principais_temas: '',
    participantes: [emptyParticipante()],
    resultados: INDICADORES.reduce((acc, ind) => {
      acc[ind] = { resultado_atual: '', meta: '', status: '', observacoes: '' };
      return acc;
    }, {}),
    observacao_evidencias: '',
    dificuldades: '',
    motivo_desvio_1: '',
    motivo_desvio_2: '',
    descricao_causa: '',
    plano_acao: [emptyAcao()],
    necessita_apoio: '',
    area_apoio: '',
    motivo_apoio: '',
    objetivo_atingido: '',
    proximos_passos: '',
  };
}

export default function FormularioComercialModal({ rotinaId, rotina, currentUser, onClose, onSaved, readOnly = false }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    if (!rotinaId) return;
    setLoading(true);
    const r = await apiFetch(`/api/rotinas/${rotinaId}/formulario`);
    if (r?.ok) {
      const dados = r.data.formulario && Object.keys(r.data.formulario).length > 0
        ? r.data.formulario
        : buildInitialForm(rotina, currentUser);
      // Ensure participantes and plano_acao are arrays
      if (!Array.isArray(dados.participantes) || dados.participantes.length === 0) {
        dados.participantes = [emptyParticipante()];
      }
      if (!Array.isArray(dados.plano_acao) || dados.plano_acao.length === 0) {
        dados.plano_acao = [emptyAcao()];
      }
      if (!dados.resultados) {
        dados.resultados = INDICADORES.reduce((acc, ind) => {
          acc[ind] = { resultado_atual: '', meta: '', status: '', observacoes: '' };
          return acc;
        }, {});
      }
      setForm(dados);
    }
    setLoading(false);
  }, [rotinaId]);

  useEffect(() => { load(); }, [load]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const setResultado = (indicador, field, value) =>
    setForm(prev => ({
      ...prev,
      resultados: { ...prev.resultados, [indicador]: { ...prev.resultados[indicador], [field]: value } }
    }));

  const setParticipante = (index, field, value) =>
    setForm(prev => {
      const list = [...prev.participantes];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, participantes: list };
    });

  const addParticipante = () =>
    setForm(prev => ({ ...prev, participantes: [...prev.participantes, emptyParticipante()] }));

  const removeParticipante = (i) =>
    setForm(prev => ({ ...prev, participantes: prev.participantes.filter((_, idx) => idx !== i) }));

  const setAcao = (index, field, value) =>
    setForm(prev => {
      const list = [...prev.plano_acao];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, plano_acao: list };
    });

  const addAcao = () =>
    setForm(prev => ({ ...prev, plano_acao: [...prev.plano_acao, emptyAcao()] }));

  const removeAcao = (i) =>
    setForm(prev => ({ ...prev, plano_acao: prev.plano_acao.filter((_, idx) => idx !== i) }));

  const save = async () => {
    setSaving(true);
    const r = await apiFetch(`/api/rotinas/${rotinaId}/formulario`, {
      method: 'PUT',
      body: JSON.stringify({ formulario: form }),
    });
    if (r?.ok) {
      toast('Relatório Comercial salvo!', 'success');
      onSaved?.();
      onClose?.();
    } else {
      toast(r?.data?.erro || 'Erro ao salvar formulário', 'error');
    }
    setSaving(false);
  };

  const periodicidadeLabel = {
    semanal: 'Semanal', quinzenal: 'Quinzenal', mensal: 'Mensal'
  }[rotina?.periodicidade] || rotina?.periodicidade || '';

  const inputProps = (readOnly) => readOnly ? { disabled: true, className: 'opacity-80' } : {};

  if (loading || !form) {
    return (
      <Modal open title="Relatório Comercial" onClose={onClose} size="xl">
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Relatório Padrão Comercial"
      size="xl"
      footer={
        readOnly ? (
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button icon={FileText} onClick={save} loading={saving}>Salvar Relatório</Button>
          </>
        )
      }
    >
      <div className="space-y-5">

        {/* 1. IDENTIFICAÇÃO */}
        <Section>
          <SectionTitle number="1" title="Identificação da Atividade" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Atividade" value={rotina?.atividade_nome || ''} disabled />
            <Select label="Categoria" value={form.categoria} onChange={e => set('categoria', e.target.value)} disabled={readOnly}>
              <option value="">Selecione...</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input label="Responsável pela execução" value={rotina?.usuario_nome || currentUser?.nome || ''} disabled />
            <Input label="Cargo" value={PERFIL_LABELS[rotina?.perfil || currentUser?.perfil] || ''} disabled />
            <Input label="Regional" value={currentUser?.regional_nome || ''} disabled />
            <Input label="Empreendimento" value={form.empreendimento} onChange={e => set('empreendimento', e.target.value)} placeholder="Nome do empreendimento" disabled={readOnly} />
            <Input type="date" label="Data da execução" value={form.data_execucao} onChange={e => set('data_execucao', e.target.value)} disabled={readOnly} />
            <Input label="Periodicidade" value={periodicidadeLabel} disabled />
            <Input type="time" label="Hora início" value={form.hora_inicio} onChange={e => set('hora_inicio', e.target.value)} disabled={readOnly} />
            <Input type="time" label="Hora término" value={form.hora_termino} onChange={e => set('hora_termino', e.target.value)} disabled={readOnly} />
          </div>
        </Section>

        {/* 2. OBJETIVO */}
        <Section>
          <SectionTitle number="2" title="Objetivo da Atividade" />
          <Textarea value={form.objetivo} onChange={e => set('objetivo', e.target.value)}
            placeholder="Descreva o objetivo desta atividade..." rows={3} disabled={readOnly} />
        </Section>

        {/* 3. EXECUÇÃO */}
        <Section>
          <SectionTitle number="3" title="Execução da Atividade" />
          <Textarea label="Resumo da execução" value={form.resumo_execucao}
            onChange={e => set('resumo_execucao', e.target.value)}
            placeholder="Descreva como a atividade foi executada..." rows={3} disabled={readOnly} />
          <Textarea label="Principais temas abordados" value={form.principais_temas}
            onChange={e => set('principais_temas', e.target.value)}
            placeholder="Liste os principais temas abordados..." rows={2} disabled={readOnly} />
        </Section>

        {/* 4. PARTICIPANTES */}
        <Section>
          <SectionTitle number="4" title="Participantes" />
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs min-w-[480px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Nome', 'Cargo', 'Área', 'Observações', ''].map(h => (
                    <th key={h} className="text-left text-gray-400 font-medium pb-2 pr-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="space-y-1">
                {form.participantes.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="pr-2 py-1.5">
                      <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                        value={p.nome} onChange={e => setParticipante(i, 'nome', e.target.value)} placeholder="Nome" disabled={readOnly} />
                    </td>
                    <td className="pr-2 py-1.5">
                      <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                        value={p.cargo} onChange={e => setParticipante(i, 'cargo', e.target.value)} placeholder="Cargo" disabled={readOnly} />
                    </td>
                    <td className="pr-2 py-1.5">
                      <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                        value={p.area} onChange={e => setParticipante(i, 'area', e.target.value)} placeholder="Área" disabled={readOnly} />
                    </td>
                    <td className="pr-2 py-1.5">
                      <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                        value={p.observacoes} onChange={e => setParticipante(i, 'observacoes', e.target.value)} placeholder="Observações" disabled={readOnly} />
                    </td>
                    <td className="py-1.5">
                      {!readOnly && form.participantes.length > 1 && (
                        <button onClick={() => removeParticipante(i)} className="p-1 text-gray-300 hover:text-error transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!readOnly && (
            <button onClick={addParticipante}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium mt-1">
              <Plus size={13} /> Adicionar participante
            </button>
          )}
        </Section>

        {/* 5. RESULTADOS / INDICADORES */}
        <Section>
          <SectionTitle number="5" title="Resultados / Indicadores" />
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs min-w-[520px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Indicador', 'Resultado Atual', 'Meta', 'Status', 'Observações'].map(h => (
                    <th key={h} className="text-left text-gray-400 font-medium pb-2 pr-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INDICADORES.map(ind => {
                  const row = form.resultados[ind] || {};
                  return (
                    <tr key={ind} className="border-b border-gray-50">
                      <td className="pr-2 py-1.5 font-medium text-gray-700">{ind}</td>
                      <td className="pr-2 py-1.5">
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                          value={row.resultado_atual || ''} onChange={e => setResultado(ind, 'resultado_atual', e.target.value)} placeholder="—" disabled={readOnly} />
                      </td>
                      <td className="pr-2 py-1.5">
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                          value={row.meta || ''} onChange={e => setResultado(ind, 'meta', e.target.value)} placeholder="—" disabled={readOnly} />
                      </td>
                      <td className="pr-2 py-1.5">
                        <select className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                          value={row.status || ''} onChange={e => setResultado(ind, 'status', e.target.value)} disabled={readOnly}>
                          <option value="">—</option>
                          {STATUS_INDICADOR.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="py-1.5">
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                          value={row.observacoes || ''} onChange={e => setResultado(ind, 'observacoes', e.target.value)} placeholder="—" disabled={readOnly} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 6. EVIDÊNCIAS */}
        <Section>
          <SectionTitle number="6" title="Evidências da Execução" />
          <p className="text-xs text-gray-500 -mt-1">Arquivos de evidência são anexados diretamente na atividade.</p>
          <Textarea label="Observação das evidências" value={form.observacao_evidencias}
            onChange={e => set('observacao_evidencias', e.target.value)}
            placeholder="Observações sobre as evidências (se necessário)..." rows={2} disabled={readOnly} />
        </Section>

        {/* 7. DIFICULDADES */}
        <Section>
          <SectionTitle number="7" title="Dificuldades Identificadas" />
          <Textarea label="Problemas ou desvios encontrados" value={form.dificuldades}
            onChange={e => set('dificuldades', e.target.value)}
            placeholder="Descreva os problemas ou desvios encontrados..." rows={3} disabled={readOnly} />
        </Section>

        {/* 8. ANÁLISE DE CAUSA */}
        <Section>
          <SectionTitle number="8" title="Análise de Causa" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Motivo do desvio 1" value={form.motivo_desvio_1} onChange={e => set('motivo_desvio_1', e.target.value)} disabled={readOnly}>
              <option value="">Selecione...</option>
              {MOTIVOS_DESVIO.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Select label="Motivo do desvio 2" value={form.motivo_desvio_2} onChange={e => set('motivo_desvio_2', e.target.value)} disabled={readOnly}>
              <option value="">Selecione...</option>
              {MOTIVOS_DESVIO.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
          <Textarea label="Descrição da causa dos problemas/desvios" value={form.descricao_causa}
            onChange={e => set('descricao_causa', e.target.value)}
            placeholder="Descreva a causa dos problemas identificados..." rows={3} disabled={readOnly} />
        </Section>

        {/* 9. PLANO DE AÇÃO */}
        <Section>
          <SectionTitle number="9" title="Plano de Ação" />
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Ação Definida', 'Responsável', 'Prazo', 'Prioridade', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-gray-400 font-medium pb-2 pr-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.plano_acao.map((a, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="pr-2 py-1.5">
                      <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                        value={a.acao} onChange={e => setAcao(i, 'acao', e.target.value)} placeholder="Ação" disabled={readOnly} />
                    </td>
                    <td className="pr-2 py-1.5">
                      <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                        value={a.responsavel} onChange={e => setAcao(i, 'responsavel', e.target.value)} placeholder="Responsável" disabled={readOnly} />
                    </td>
                    <td className="pr-2 py-1.5">
                      <input type="date" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                        value={a.prazo} onChange={e => setAcao(i, 'prazo', e.target.value)} disabled={readOnly} />
                    </td>
                    <td className="pr-2 py-1.5">
                      <select className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                        value={a.prioridade} onChange={e => setAcao(i, 'prioridade', e.target.value)} disabled={readOnly}>
                        {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="pr-2 py-1.5">
                      <select className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                        value={a.status} onChange={e => setAcao(i, 'status', e.target.value)} disabled={readOnly}>
                        {STATUS_ACAO.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-1.5">
                      {!readOnly && form.plano_acao.length > 1 && (
                        <button onClick={() => removeAcao(i)} className="p-1 text-gray-300 hover:text-error transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!readOnly && (
            <button onClick={addAcao}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium mt-1">
              <Plus size={13} /> Adicionar ação
            </button>
          )}
        </Section>

        {/* 10. ESCALONAMENTO */}
        <Section>
          <SectionTitle number="10" title="Necessidade de Escalonamento" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Necessita apoio de outra área?" value={form.necessita_apoio} onChange={e => set('necessita_apoio', e.target.value)} disabled={readOnly}>
              <option value="">Selecione...</option>
              {SIM_NAO.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            {form.necessita_apoio && form.necessita_apoio !== 'Não' && (
              <Select label="Área de apoio" value={form.area_apoio} onChange={e => set('area_apoio', e.target.value)} disabled={readOnly}>
                <option value="">Selecione...</option>
                {AREAS_ESCALONAMENTO.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
            )}
          </div>
          {form.necessita_apoio && form.necessita_apoio !== 'Não' && (
            <Textarea label="Motivo do apoio" value={form.motivo_apoio}
              onChange={e => set('motivo_apoio', e.target.value)}
              placeholder="Descreva por que o apoio é necessário..." rows={2} disabled={readOnly} />
          )}
        </Section>

        {/* 11. AVALIAÇÃO FINAL */}
        <Section>
          <SectionTitle number="11" title="Avaliação Final da Atividade" />
          <Select label="O objetivo da atividade foi atingido?" value={form.objetivo_atingido}
            onChange={e => set('objetivo_atingido', e.target.value)} disabled={readOnly}>
            <option value="">Selecione...</option>
            {SIM_NAO.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Textarea label="Próximos passos" value={form.proximos_passos}
            onChange={e => set('proximos_passos', e.target.value)}
            placeholder="Quais são os próximos passos após esta atividade?" rows={3} disabled={readOnly} />
        </Section>

      </div>
    </Modal>
  );
}
