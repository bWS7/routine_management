import { Plus, Trash2 } from 'lucide-react';
import { Input, Textarea, Select } from '../ui/Input';
import { CHECKLIST_STAND_ITENS, emptyChecklistEmpreendimento } from './reportConfigs';

const PRIORIDADES = ['Alta', 'Média', 'Baixa'];
const TIPOS_VISITA = ['Visita', 'Reunião', 'Café', 'Evento', 'Outro'];
const TIPOS_REATIVACAO = ['Reativação', 'Expansão'];
const TIPOS_TREINAMENTO = ['Treinamento', 'Alinhamento'];
const CRITICIDADES = ['Baixa', 'Média', 'Alta'];
const STATUS_ACAO = ['Aberto', 'Em andamento', 'Concluído'];
const SIM_NAO = ['Sim', 'Não'];
const TIPOS_APOIO = ['Treinamento', 'Acompanhamento em campo', 'Geração de leads', 'Apoio comercial', 'Outro'];
const TIPOS_AGENDA = ['Parceria', 'Visita técnica', 'Evento', 'Treinamento', 'Outro'];

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

function Section({ children }) {
  return <div className="border border-gray-100 rounded-xl p-4 space-y-3 overflow-hidden">{children}</div>;
}

function DynamicTable({ columns, rows, onAdd, onRemove, onChange, readOnly, addLabel, optional }) {
  return (
    <div>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs min-w-[760px]">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map(c => (
                <th key={c.key} className="text-left text-gray-400 font-medium pb-2 pr-2 min-w-[120px]">
                  {c.label}{!optional && <span className="text-red-500 ml-0.5">*</span>}
                </th>
              ))}
              {!readOnly && <th className="w-8"></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-50">
                {columns.map(c => (
                  <td key={c.key} className="pr-2 py-1.5">
                    {c.type === 'select' ? (
                      <select
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                        value={row[c.key] || ''} onChange={e => onChange(i, c.key, e.target.value)} disabled={readOnly}
                        required={!optional}
                      >
                        {(c.placeholderOption ? ['', ...c.options] : c.options).map(o => (
                          <option key={o} value={o}>{o || c.placeholderOption}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={c.type || 'text'}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                        value={row[c.key] || ''} onChange={e => onChange(i, c.key, e.target.value)}
                        placeholder={c.placeholder || c.label} disabled={readOnly} required={!optional}
                      />
                    )}
                  </td>
                ))}
                {!readOnly && (
                  <td className="py-1.5">
                    {rows.length > 1 && (
                      <button onClick={() => onRemove(i)} className="p-1 text-gray-300 hover:text-error transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <button onClick={onAdd} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium mt-2">
          <Plus size={13} /> {addLabel || 'Adicionar'}
        </button>
      )}
    </div>
  );
}

// ─── 1. Reunião de Performance ─────────────────────────────────
export function FormReuniaoPerformance({ form, set, setList, addItem, removeItem, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Dados da Reunião" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input type="date" label="Data da reunião" value={form.data_reuniao} onChange={e => set('data_reuniao', e.target.value)} disabled={readOnly} required />
          <Input type="time" label="Horário de início" value={form.hora_inicio} onChange={e => set('hora_inicio', e.target.value)} disabled={readOnly} required />
          <Input type="time" label="Horário de término" value={form.hora_termino} onChange={e => set('hora_termino', e.target.value)} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="2" title="Participantes" />
        <DynamicTable
          columns={[{ key: 'nome', label: 'Nome' }, { key: 'cargo', label: 'Cargo' }]}
          rows={form.participantes || []} readOnly={readOnly}
          onChange={(i, k, v) => setList('participantes', i, k, v)}
          onAdd={() => addItem('participantes', { nome: '', cargo: '' })}
          onRemove={(i) => removeItem('participantes', i)}
          addLabel="Adicionar participante"
        />
      </Section>

      <Section>
        <SectionTitle number="3" title="Indicadores e Análise" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Textarea label="Principais indicadores apresentados" value={form.indicadores_apresentados}
            onChange={e => set('indicadores_apresentados', e.target.value)} rows={3} disabled={readOnly}
            placeholder="Liste os indicadores discutidos na reunião..." required />
          <Textarea label="Desafios e dificuldades identificados" value={form.desafios_dificuldades}
            onChange={e => set('desafios_dificuldades', e.target.value)} rows={3} disabled={readOnly}
            placeholder="Quais os principais desafios encontrados?" required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="4" title="Plano de Ação" />
        <DynamicTable
          columns={[
            { key: 'acao', label: 'Ação definida' },
            { key: 'responsavel', label: 'Responsável' },
            { key: 'prazo', label: 'Prazo', type: 'date' },
          ]}
          rows={form.plano_acao || []} readOnly={readOnly}
          onChange={(i, k, v) => setList('plano_acao', i, k, v)}
          onAdd={() => addItem('plano_acao', { acao: '', responsavel: '', prazo: '' })}
          onRemove={(i) => removeItem('plano_acao', i)}
          addLabel="Adicionar ação"
        />
      </Section>

      <Section>
        <SectionTitle number="5" title="Rotatividade" />
        <Textarea label="Acompanhamento da rotatividade da equipe" value={form.acompanhamento_rotatividade}
          onChange={e => set('acompanhamento_rotatividade', e.target.value)} rows={3} disabled={readOnly}
          placeholder="Registre informações sobre rotatividade..." required />
      </Section>
    </div>
  );
}

// ─── 2. Resultado Semanal ──────────────────────────────────────
export function FormResultadoSemanal({ form, set, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Período" />
        <Input label="Período de referência" value={form.periodo_referencia}
          onChange={e => set('periodo_referencia', e.target.value)} disabled={readOnly}
          placeholder="Ex: 09/06 a 13/06/2026" required />
      </Section>

      <Section>
        <SectionTitle number="2" title="Indicadores da Semana" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Input label="Quantidade de Leads" type="number" value={form.qtd_leads} onChange={e => set('qtd_leads', e.target.value)} disabled={readOnly} required />
          <Input label="Quantidade de Visitas" type="number" value={form.qtd_visitas} onChange={e => set('qtd_visitas', e.target.value)} disabled={readOnly} required />
          <Input label="Quantidade de Pastas" type="number" value={form.qtd_pastas} onChange={e => set('qtd_pastas', e.target.value)} disabled={readOnly} required />
          <Input label="Quantidade de Propostas" type="number" value={form.qtd_propostas} onChange={e => set('qtd_propostas', e.target.value)} disabled={readOnly} required />
          <Input label="Quantidade de Vendas" type="number" value={form.qtd_vendas} onChange={e => set('qtd_vendas', e.target.value)} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="3" title="Destaques" />
        <Textarea label="Destaques positivos da semana" value={form.destaques_positivos}
          onChange={e => set('destaques_positivos', e.target.value)} rows={4} disabled={readOnly}
          placeholder="Quais foram os destaques positivos?" required />
      </Section>
    </div>
  );
}

// ─── 3. Decisões de Canal ──────────────────────────────────────
export function FormDecoesCanal({ form, set, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Desempenho dos Canais" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Textarea label="Canais com melhor desempenho" value={form.canais_melhor_desempenho}
            onChange={e => set('canais_melhor_desempenho', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Canais com baixo desempenho" value={form.canais_baixo_desempenho}
            onChange={e => set('canais_baixo_desempenho', e.target.value)} rows={3} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="2" title="Parcerias" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Textarea label="Parcerias a serem fortalecidas" value={form.parcerias_fortalecer}
            onChange={e => set('parcerias_fortalecer', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Parcerias que exigem plano de ação ou encerramento" value={form.parcerias_plano_encerramento}
            onChange={e => set('parcerias_plano_encerramento', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Necessidade de abertura de novos canais" value={form.necessidade_novos_canais}
            onChange={e => set('necessidade_novos_canais', e.target.value)} rows={3} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="3" title="Decisões e Responsáveis" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Textarea label="Decisões tomadas" value={form.decisoes_tomadas}
            onChange={e => set('decisoes_tomadas', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Responsáveis pelas ações" value={form.responsaveis_acoes}
            onChange={e => set('responsaveis_acoes', e.target.value)} rows={3} disabled={readOnly} required />
        </div>
      </Section>
    </div>
  );
}

// ─── 4. Análise de Riscos ──────────────────────────────────────
export function FormAnaliseRiscos({ form, setList, addItem, removeItem, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Riscos Identificados" />
        <DynamicTable
          columns={[
            { key: 'risco', label: 'Risco identificado' },
            { key: 'impacto', label: 'Impacto esperado' },
            { key: 'prioridade', label: 'Prioridade', type: 'select', options: PRIORIDADES },
            { key: 'plano_acao', label: 'Plano de ação' },
            { key: 'responsavel', label: 'Responsável' },
          ]}
          rows={form.riscos || []} readOnly={readOnly}
          onChange={(i, k, v) => setList('riscos', i, k, v)}
          onAdd={() => addItem('riscos', { risco: '', impacto: '', prioridade: 'Alta', plano_acao: '', responsavel: '' })}
          onRemove={(i) => removeItem('riscos', i)}
          addLabel="Adicionar risco"
        />
      </Section>
    </div>
  );
}

// ─── 5. Acompanhamento de Liderados ────────────────────────────
export function FormAcompanhamentoLiderados({ form, setList, addItem, removeItem, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Liderados Acompanhados" />
        <DynamicTable
          columns={[
            { key: 'nome', label: 'Liderado' },
            { key: 'meta', label: 'Meta definida' },
            { key: 'resultado_atual', label: 'Resultado atual' },
            { key: 'dificuldades', label: 'Dificuldades' },
            { key: 'necessidade_apoio', label: 'Necessidade de apoio' },
            { key: 'acoes_desenvolvimento', label: 'Ações de desenvolvimento' },
            { key: 'proximo_acompanhamento', label: 'Próximo acompanhamento', type: 'date' },
          ]}
          rows={form.liderados || []} readOnly={readOnly}
          onChange={(i, k, v) => setList('liderados', i, k, v)}
          onAdd={() => addItem('liderados', {
            nome: '', meta: '', resultado_atual: '', dificuldades: '',
            necessidade_apoio: '', acoes_desenvolvimento: '', proximo_acompanhamento: '',
          })}
          onRemove={(i) => removeItem('liderados', i)}
          addLabel="Adicionar liderado"
        />
      </Section>
    </div>
  );
}

// ─── 6. Comitê Mensal ──────────────────────────────────────────
export function FormComiteMensal({ form, set, setList, addItem, removeItem, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Identificação" />
        <Input label="Período analisado" value={form.periodo_analisado}
          onChange={e => set('periodo_analisado', e.target.value)} disabled={readOnly}
          placeholder="Ex: Junho/2026" required />
      </Section>

      <Section>
        <SectionTitle number="2" title="Participantes" />
        <DynamicTable
          columns={[{ key: 'nome', label: 'Nome' }, { key: 'cargo', label: 'Cargo' }]}
          rows={form.participantes || []} readOnly={readOnly}
          onChange={(i, k, v) => setList('participantes', i, k, v)}
          onAdd={() => addItem('participantes', { nome: '', cargo: '' })}
          onRemove={(i) => removeItem('participantes', i)}
          addLabel="Adicionar participante"
        />
      </Section>

      <Section>
        <SectionTitle number="3" title="Resultados e Aprendizados" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Textarea label="Principais resultados alcançados" value={form.principais_resultados}
            onChange={e => set('principais_resultados', e.target.value)} rows={4} disabled={readOnly} required />
          <Textarea label="Aprendizados do período" value={form.aprendizados}
            onChange={e => set('aprendizados', e.target.value)} rows={4} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="4" title="Planejamento" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Textarea label="Plano de ação para o próximo mês" value={form.plano_acao_proximo_mes}
            onChange={e => set('plano_acao_proximo_mes', e.target.value)} rows={4} disabled={readOnly} required />
          <Textarea label="Metas do próximo período" value={form.metas_proximo_periodo}
            onChange={e => set('metas_proximo_periodo', e.target.value)} rows={4} disabled={readOnly} required />
        </div>
      </Section>
    </div>
  );
}

// ─── 7. Relatório do Canal Parcerias (SP) ──────────────────────
export function FormCanalParcerias({ form, set, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Período" />
        <Input label="Período de referência" value={form.periodo_referencia}
          onChange={e => set('periodo_referencia', e.target.value)} disabled={readOnly}
          placeholder="Ex: 09/06 a 13/06/2026" required />
      </Section>

      <Section>
        <SectionTitle number="2" title="Indicadores do Canal" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Input label="Parceiros ativos" type="number" value={form.qtd_parceiros_ativos}
            onChange={e => set('qtd_parceiros_ativos', e.target.value)} disabled={readOnly} required />
          <Input label="Leads gerados" type="number" value={form.leads_gerados}
            onChange={e => set('leads_gerados', e.target.value)} disabled={readOnly} required />
          <Input label="Visitas realizadas" type="number" value={form.visitas_realizadas}
            onChange={e => set('visitas_realizadas', e.target.value)} disabled={readOnly} required />
          <Input label="Propostas geradas" type="number" value={form.propostas_geradas}
            onChange={e => set('propostas_geradas', e.target.value)} disabled={readOnly}
            placeholder="Opcional" />
          <Input label="Vendas realizadas" type="number" value={form.vendas_realizadas}
            onChange={e => set('vendas_realizadas', e.target.value)} disabled={readOnly}
            placeholder="Opcional" />
        </div>
      </Section>

      <Section>
        <SectionTitle number="3" title="Análise" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Textarea label="Parceiros com melhor desempenho" value={form.parceiros_melhor_desempenho}
            onChange={e => set('parceiros_melhor_desempenho', e.target.value)} rows={4} disabled={readOnly} required />
          <Textarea label="Principais oportunidades ou dificuldades identificadas" value={form.oportunidades_dificuldades}
            onChange={e => set('oportunidades_dificuldades', e.target.value)} rows={4} disabled={readOnly} required />
        </div>
      </Section>
    </div>
  );
}

// ─── 8. Rotina de Visita a Parceiros (SP) ──────────────────────
export function FormRotinaVisitas({ form, setList, addItem, removeItem, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Visitas Realizadas" />
        <DynamicTable
          columns={[
            { key: 'parceiro', label: 'Nome do parceiro' },
            { key: 'data', label: 'Data', type: 'date' },
            { key: 'hora_inicio', label: 'Hora início', type: 'time' },
            { key: 'hora_fim', label: 'Hora fim', type: 'time' },
            { key: 'tipo_acao', label: 'Tipo da ação', type: 'select', options: TIPOS_VISITA },
            { key: 'temas', label: 'Temas abordados' },
            { key: 'oportunidades', label: 'Oportunidades identificadas' },
            { key: 'proximos_passos', label: 'Próximos passos definidos' },
          ]}
          rows={form.visitas || []} readOnly={readOnly}
          onChange={(i, k, v) => setList('visitas', i, k, v)}
          onAdd={() => addItem('visitas', {
            parceiro: '', data: '', hora_inicio: '', hora_fim: '',
            tipo_acao: 'Visita', temas: '', oportunidades: '', proximos_passos: '',
          })}
          onRemove={(i) => removeItem('visitas', i)}
          addLabel="Adicionar visita"
        />
      </Section>
    </div>
  );
}

// ─── 9. Análise da Carteira de Parceiros (SP) ──────────────────
export function FormCarteiraParceiros({ form, set, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Carteira Ativa" />
        <Input label="Quantidade de parceiros ativos" type="number" value={form.qtd_parceiros_ativos}
          onChange={e => set('qtd_parceiros_ativos', e.target.value)} disabled={readOnly} required />
      </Section>

      <Section>
        <SectionTitle number="2" title="Evolução da Carteira" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Textarea label="Parceiros com maior geração de resultados" value={form.parceiros_maior_resultado}
            onChange={e => set('parceiros_maior_resultado', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Parceiros perdidos no período" value={form.parceiros_perdidos}
            onChange={e => set('parceiros_perdidos', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Motivo da perda" value={form.motivo_perda}
            onChange={e => set('motivo_perda', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Parceiros em potencial para desenvolvimento" value={form.parceiros_potencial}
            onChange={e => set('parceiros_potencial', e.target.value)} rows={3} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="3" title="Plano de Ação" />
        <Textarea label="Plano de ação para recuperação ou fortalecimento" value={form.plano_recuperacao}
          onChange={e => set('plano_recuperacao', e.target.value)} rows={4} disabled={readOnly} required />
      </Section>
    </div>
  );
}

// ─── 10. Plano de Reativação e Expansão (SP) ───────────────────
export function FormReativacaoExpansao({ form, setList, addItem, removeItem, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Ações de Reativação e Expansão" />
        <DynamicTable
          columns={[
            { key: 'tipo_acao', label: 'Tipo da ação', type: 'select', options: TIPOS_REATIVACAO },
            { key: 'parceiro_canal', label: 'Parceiro ou canal envolvido' },
            { key: 'descricao_plano', label: 'Descrição do plano em execução' },
            { key: 'responsavel', label: 'Responsável' },
            { key: 'prazo', label: 'Prazo para conclusão', type: 'date' },
          ]}
          rows={form.acoes || []} readOnly={readOnly}
          onChange={(i, k, v) => setList('acoes', i, k, v)}
          onAdd={() => addItem('acoes', {
            tipo_acao: 'Reativação', parceiro_canal: '', descricao_plano: '',
            responsavel: '', prazo: '',
          })}
          onRemove={(i) => removeItem('acoes', i)}
          addLabel="Adicionar ação"
        />
      </Section>
    </div>
  );
}

// ─── 11. Treinamento e Alinhamento com Parceiros (SP) ──────────
export function FormTreinamentoParceiros({ form, set, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Dados da Sessão" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Tipo da ação" value={form.tipo_acao}
            onChange={e => set('tipo_acao', e.target.value)} disabled={readOnly} required>
            {TIPOS_TREINAMENTO.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Input label="Parceiro atendido" value={form.parceiro_atendido}
            onChange={e => set('parceiro_atendido', e.target.value)} disabled={readOnly} required />
          <Input type="date" label="Data" value={form.data}
            onChange={e => set('data', e.target.value)} disabled={readOnly} required />
          <div className="grid grid-cols-2 gap-3">
            <Input type="time" label="Horário início" value={form.hora_inicio}
              onChange={e => set('hora_inicio', e.target.value)} disabled={readOnly} required />
            <Input type="time" label="Horário fim" value={form.hora_fim}
              onChange={e => set('hora_fim', e.target.value)} disabled={readOnly} required />
          </div>
        </div>
      </Section>

      <Section>
        <SectionTitle number="2" title="Conteúdo" />
        <Textarea label="Participantes" value={form.participantes}
          onChange={e => set('participantes', e.target.value)} rows={2} disabled={readOnly}
          placeholder="Liste os participantes da sessão..." required />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Textarea label="Pauta abordada" value={form.pauta}
            onChange={e => set('pauta', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Materiais apresentados" value={form.materiais}
            onChange={e => set('materiais', e.target.value)} rows={3} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="3" title="Próximas Ações" />
        <Textarea label="Próximas ações acordadas" value={form.proximas_acoes}
          onChange={e => set('proximas_acoes', e.target.value)} rows={3} disabled={readOnly} required />
      </Section>
    </div>
  );
}

// ─── 12. Checklist de Abertura do Stand (CD) ───────────────────
export function FormChecklistStand({ form, set, setList, addItem, removeItem, readOnly }) {
  const emps = form.empreendimentos || [];

  const setItem = (i, key, value) => {
    const itens = { ...(emps[i]?.itens || {}), [key]: value };
    setList('empreendimentos', i, 'itens', itens);
  };

  const cellClass = 'w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50';

  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Identificação da Atividade" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input type="date" label="Data da execução" value={form.data_execucao}
            onChange={e => set('data_execucao', e.target.value)} disabled={readOnly} required />
          <Input label="Responsável pela verificação" value={form.responsavel}
            onChange={e => set('responsavel', e.target.value)} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="2" title="Checklist de Abertura" />
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-gray-400 font-medium pb-2 pr-2 min-w-[200px]">Item</th>
                {emps.map((e, i) => (
                  <th key={i} className="text-left pb-2 pr-2 min-w-[150px]">
                    <div className="flex items-center gap-1">
                      <input className={cellClass} value={e.nome || ''} placeholder="Empreendimento"
                        onChange={ev => setList('empreendimentos', i, 'nome', ev.target.value)} disabled={readOnly} required />
                      {!readOnly && emps.length > 1 && (
                        <button onClick={() => removeItem('empreendimentos', i)} className="p-1 text-gray-300 hover:text-error transition-colors shrink-0">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHECKLIST_STAND_ITENS.map(it => (
                <tr key={it.key} className="border-b border-gray-50">
                  <td className="pr-2 py-1.5 text-gray-700">{it.label}</td>
                  {emps.map((e, i) => (
                    <td key={i} className="pr-2 py-1.5">
                      <select className={cellClass} value={e.itens?.[it.key] || ''}
                        onChange={ev => setItem(i, it.key, ev.target.value)} disabled={readOnly} required>
                        <option value="">—</option>
                        {SIM_NAO.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="pr-2 py-1.5 text-gray-400 font-medium">Observação</td>
                {emps.map((e, i) => (
                  <td key={i} className="pr-2 py-1.5">
                    <input className={cellClass} value={e.observacoes || ''} placeholder="Observação"
                      onChange={ev => setList('empreendimentos', i, 'observacoes', ev.target.value)} disabled={readOnly} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        {!readOnly && (
          <button onClick={() => addItem('empreendimentos', emptyChecklistEmpreendimento())}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium mt-2">
            <Plus size={13} /> Adicionar empreendimento
          </button>
        )}
      </Section>

      <Section>
        <SectionTitle number="3" title="Não Conformidades" />
        <p className="text-xs text-gray-400 -mt-1">Opcional — registre apenas se houver itens reprovados.</p>
        <DynamicTable
          columns={[
            { key: 'problema', label: 'Problema identificado' },
            { key: 'criticidade', label: 'Criticidade', type: 'select', options: CRITICIDADES, placeholderOption: 'Selecione' },
            { key: 'acao', label: 'Ação adotada' },
            { key: 'responsavel', label: 'Responsável' },
          ]}
          rows={form.nao_conformidades || []} readOnly={readOnly} optional
          onChange={(i, k, v) => setList('nao_conformidades', i, k, v)}
          onAdd={() => addItem('nao_conformidades', { problema: '', criticidade: '', acao: '', responsavel: '' })}
          onRemove={(i) => removeItem('nao_conformidades', i)}
          addLabel="Adicionar não conformidade"
        />
      </Section>
    </div>
  );
}

// ─── 13. Reunião Rápida do Stand (CD) ──────────────────────────
export function FormReuniaoStand({ form, set, setList, addItem, removeItem, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Identificação" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input type="date" label="Data" value={form.data}
            onChange={e => set('data', e.target.value)} disabled={readOnly} required />
          <Input label="Empreendimento" value={form.empreendimento}
            onChange={e => set('empreendimento', e.target.value)} disabled={readOnly} required />
          <Input type="time" label="Hora início" value={form.hora_inicio}
            onChange={e => set('hora_inicio', e.target.value)} disabled={readOnly} required />
          <Input type="time" label="Hora término" value={form.hora_termino}
            onChange={e => set('hora_termino', e.target.value)} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="2" title="Participantes" />
        <DynamicTable
          columns={[{ key: 'nome', label: 'Nome' }, { key: 'cargo', label: 'Cargo' }]}
          rows={form.participantes || []} readOnly={readOnly}
          onChange={(i, k, v) => setList('participantes', i, k, v)}
          onAdd={() => addItem('participantes', { nome: '', cargo: '' })}
          onRemove={(i) => removeItem('participantes', i)}
          addLabel="Adicionar participante"
        />
      </Section>

      <Section>
        <SectionTitle number="3" title="Principais Temas" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Textarea label="Resultados do dia/período" value={form.resultados_dia}
            onChange={e => set('resultados_dia', e.target.value)} rows={2} disabled={readOnly} required />
          <Textarea label="Pendências operacionais" value={form.pendencias_operacionais}
            onChange={e => set('pendencias_operacionais', e.target.value)} rows={2} disabled={readOnly} required />
          <Textarea label="Ações comerciais em andamento" value={form.acoes_comerciais}
            onChange={e => set('acoes_comerciais', e.target.value)} rows={2} disabled={readOnly} required />
          <Textarea label="Demandas de marketing" value={form.demandas_marketing}
            onChange={e => set('demandas_marketing', e.target.value)} rows={2} disabled={readOnly} required />
          <Textarea label="Necessidades do stand" value={form.necessidades_stand}
            onChange={e => set('necessidades_stand', e.target.value)} rows={2} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="4" title="Plano de Ação" />
        <p className="text-xs text-gray-400 -mt-1">Opcional.</p>
        <DynamicTable
          columns={[
            { key: 'acao', label: 'Ação' },
            { key: 'responsavel', label: 'Responsável' },
            { key: 'prazo', label: 'Prazo', type: 'date' },
            { key: 'status', label: 'Status', type: 'select', options: STATUS_ACAO, placeholderOption: 'Selecione' },
          ]}
          rows={form.plano_acao || []} readOnly={readOnly} optional
          onChange={(i, k, v) => setList('plano_acao', i, k, v)}
          onAdd={() => addItem('plano_acao', { acao: '', responsavel: '', prazo: '', status: '' })}
          onRemove={(i) => removeItem('plano_acao', i)}
          addLabel="Adicionar ação"
        />
      </Section>

      <Section>
        <SectionTitle number="5" title="Observações Gerais" />
        <Textarea label="Observações gerais" value={form.observacoes}
          onChange={e => set('observacoes', e.target.value)} rows={3} disabled={readOnly} required />
      </Section>
    </div>
  );
}

// ─── 14. Relatório Geral por Empreendimento (CD) ───────────────
export function FormRelatorioGeralEmp({ form, set, setList, addItem, removeItem, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Identificação" />
        <Input label="Período analisado" value={form.periodo_analisado}
          onChange={e => set('periodo_analisado', e.target.value)} disabled={readOnly}
          placeholder="Ex: 09/06 a 13/06/2026" required />
      </Section>

      <Section>
        <SectionTitle number="2" title="Resultados por Empreendimento" />
        <DynamicTable
          columns={[
            { key: 'empreendimento', label: 'Empreendimento' },
            { key: 'leads', label: 'Leads', type: 'number' },
            { key: 'visitas', label: 'Visitas', type: 'number' },
            { key: 'pastas', label: 'Pastas', type: 'number' },
            { key: 'propostas', label: 'Propostas', type: 'number' },
            { key: 'vendas', label: 'Vendas', type: 'number' },
          ]}
          rows={form.resultados || []} readOnly={readOnly}
          onChange={(i, k, v) => setList('resultados', i, k, v)}
          onAdd={() => addItem('resultados', { empreendimento: '', leads: '', visitas: '', pastas: '', propostas: '', vendas: '' })}
          onRemove={(i) => removeItem('resultados', i)}
          addLabel="Adicionar empreendimento"
        />
      </Section>

      <Section>
        <SectionTitle number="3" title="Análise" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Textarea label="Destaques positivos" value={form.destaques_positivos}
            onChange={e => set('destaques_positivos', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Principais dificuldades" value={form.principais_dificuldades}
            onChange={e => set('principais_dificuldades', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Necessidade de apoio" value={form.necessidade_apoio}
            onChange={e => set('necessidade_apoio', e.target.value)} rows={3} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="4" title="Plano de Ação" />
        <DynamicTable
          columns={[
            { key: 'acao', label: 'Ação' },
            { key: 'responsavel', label: 'Responsável' },
            { key: 'prazo', label: 'Prazo', type: 'date' },
          ]}
          rows={form.plano_acao || []} readOnly={readOnly}
          onChange={(i, k, v) => setList('plano_acao', i, k, v)}
          onAdd={() => addItem('plano_acao', { acao: '', responsavel: '', prazo: '' })}
          onRemove={(i) => removeItem('plano_acao', i)}
          addLabel="Adicionar ação"
        />
      </Section>
    </div>
  );
}

// ─── 15. Análise de Concorrência (CD) ──────────────────────────
export function FormAnaliseConcorrencia({ form, set, setList, addItem, removeItem, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Identificação do Concorrente" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Construtora" value={form.construtora}
            onChange={e => set('construtora', e.target.value)} disabled={readOnly} required />
          <Input label="Empreendimento" value={form.empreendimento}
            onChange={e => set('empreendimento', e.target.value)} disabled={readOnly} required />
          <Input label="Cidade/Bairro" value={form.cidade_bairro}
            onChange={e => set('cidade_bairro', e.target.value)} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="2" title="Informações Comerciais" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Comissão imobiliária" value={form.comissao_imobiliaria}
            onChange={e => set('comissao_imobiliaria', e.target.value)} disabled={readOnly} required />
          <Input label="Premiação imobiliária" value={form.premiacao_imobiliaria}
            onChange={e => set('premiacao_imobiliaria', e.target.value)} disabled={readOnly} required />
          <Input label="Premiação corretor" value={form.premiacao_corretor}
            onChange={e => set('premiacao_corretor', e.target.value)} disabled={readOnly} required />
          <Input label="Entrada mínima" value={form.entrada_minima}
            onChange={e => set('entrada_minima', e.target.value)} disabled={readOnly} required />
          <Input label="Subsídio oferecido" value={form.subsidio}
            onChange={e => set('subsidio', e.target.value)} disabled={readOnly} required />
          <Input label="Campanhas vigentes" value={form.campanhas_vigentes}
            onChange={e => set('campanhas_vigentes', e.target.value)} disabled={readOnly} required />
        </div>
        <Textarea label="Condições comerciais" value={form.condicoes_comerciais}
          onChange={e => set('condicoes_comerciais', e.target.value)} rows={2} disabled={readOnly} required />
      </Section>

      <Section>
        <SectionTitle number="3" title="Produto" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Tipologia" value={form.tipologia}
            onChange={e => set('tipologia', e.target.value)} disabled={readOnly} required />
          <Input label="Metragem" value={form.metragem}
            onChange={e => set('metragem', e.target.value)} disabled={readOnly} required />
          <Input label="Faixa de preço" value={form.faixa_preco}
            onChange={e => set('faixa_preco', e.target.value)} disabled={readOnly} required />
        </div>
        <Textarea label="Diferenciais" value={form.diferenciais}
          onChange={e => set('diferenciais', e.target.value)} rows={2} disabled={readOnly} required />
      </Section>

      <Section>
        <SectionTitle number="4" title="Marketing" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Textarea label="Ações observadas" value={form.acoes_observadas}
            onChange={e => set('acoes_observadas', e.target.value)} rows={2} disabled={readOnly} required />
          <Textarea label="Mídias utilizadas" value={form.midias_utilizadas}
            onChange={e => set('midias_utilizadas', e.target.value)} rows={2} disabled={readOnly} required />
          <Textarea label="Eventos/promotores" value={form.eventos_promotores}
            onChange={e => set('eventos_promotores', e.target.value)} rows={2} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="5" title="Análise" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Textarea label="Principais vantagens do concorrente" value={form.vantagens_concorrente}
            onChange={e => set('vantagens_concorrente', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Principais fragilidades do concorrente" value={form.fragilidades_concorrente}
            onChange={e => set('fragilidades_concorrente', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Impacto para nosso empreendimento" value={form.impacto_empreendimento}
            onChange={e => set('impacto_empreendimento', e.target.value)} rows={3} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="6" title="Ações Recomendadas" />
        <p className="text-xs text-gray-400 -mt-1">Opcional.</p>
        <DynamicTable
          columns={[
            { key: 'sugestao_acao', label: 'Sugestão de ação' },
            { key: 'responsavel', label: 'Responsável' },
          ]}
          rows={form.acoes_recomendadas || []} readOnly={readOnly} optional
          onChange={(i, k, v) => setList('acoes_recomendadas', i, k, v)}
          onAdd={() => addItem('acoes_recomendadas', { sugestao_acao: '', responsavel: '' })}
          onRemove={(i) => removeItem('acoes_recomendadas', i)}
          addLabel="Adicionar ação recomendada"
        />
      </Section>
    </div>
  );
}

// ─── 16. Relatório Mensal do Empreendimento (CD) ───────────────
export function FormRelatorioMensalEmp({ form, set, setList, addItem, removeItem, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Identificação" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Empreendimento" value={form.empreendimento}
            onChange={e => set('empreendimento', e.target.value)} disabled={readOnly} required />
          <Input label="Mês de referência" value={form.mes_referencia}
            onChange={e => set('mes_referencia', e.target.value)} disabled={readOnly}
            placeholder="Ex: Junho/2026" required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="2" title="Indicadores" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Input label="Leads" type="number" value={form.leads} onChange={e => set('leads', e.target.value)} disabled={readOnly} required />
          <Input label="Visitas" type="number" value={form.visitas} onChange={e => set('visitas', e.target.value)} disabled={readOnly} required />
          <Input label="Pastas" type="number" value={form.pastas} onChange={e => set('pastas', e.target.value)} disabled={readOnly} required />
          <Input label="Propostas" type="number" value={form.propostas} onChange={e => set('propostas', e.target.value)} disabled={readOnly} required />
          <Input label="Vendas" type="number" value={form.vendas} onChange={e => set('vendas', e.target.value)} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="3" title="Análise do Mês" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Textarea label="Principal conquista" value={form.principal_conquista}
            onChange={e => set('principal_conquista', e.target.value)} rows={2} disabled={readOnly} required />
          <Textarea label="Principal dificuldade" value={form.principal_dificuldade}
            onChange={e => set('principal_dificuldade', e.target.value)} rows={2} disabled={readOnly} required />
          <Textarea label="Ações realizadas" value={form.acoes_realizadas}
            onChange={e => set('acoes_realizadas', e.target.value)} rows={2} disabled={readOnly} required />
          <Textarea label="Ações não concluídas" value={form.acoes_nao_concluidas}
            onChange={e => set('acoes_nao_concluidas', e.target.value)} rows={2} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="4" title="Concorrência" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Houve movimentação relevante?" value={form.houve_movimentacao}
            onChange={e => set('houve_movimentacao', e.target.value)} disabled={readOnly} required>
            <option value="">Selecione...</option>
            {SIM_NAO.map(o => <option key={o} value={o}>{o}</option>)}
          </Select>
        </div>
        <Textarea label="Descrição" value={form.descricao_concorrencia}
          onChange={e => set('descricao_concorrencia', e.target.value)} rows={2} disabled={readOnly}
          placeholder="Opcional — descreva a movimentação, se houver." />
      </Section>

      <Section>
        <SectionTitle number="5" title="Necessidades do Produto" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Textarea label="Marketing" value={form.necessidade_marketing}
            onChange={e => set('necessidade_marketing', e.target.value)} rows={2} disabled={readOnly} required />
          <Textarea label="Comercial" value={form.necessidade_comercial}
            onChange={e => set('necessidade_comercial', e.target.value)} rows={2} disabled={readOnly} required />
          <Textarea label="Estrutura" value={form.necessidade_estrutura}
            onChange={e => set('necessidade_estrutura', e.target.value)} rows={2} disabled={readOnly} required />
          <Textarea label="Estoque" value={form.necessidade_estoque}
            onChange={e => set('necessidade_estoque', e.target.value)} rows={2} disabled={readOnly} required />
          <Textarea label="Precificação" value={form.necessidade_precificacao}
            onChange={e => set('necessidade_precificacao', e.target.value)} rows={2} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="6" title="Plano de Ação Próximo Mês" />
        <DynamicTable
          columns={[
            { key: 'acao', label: 'Ação' },
            { key: 'responsavel', label: 'Responsável' },
            { key: 'prazo', label: 'Prazo', type: 'date' },
          ]}
          rows={form.plano_acao || []} readOnly={readOnly}
          onChange={(i, k, v) => setList('plano_acao', i, k, v)}
          onAdd={() => addItem('plano_acao', { acao: '', responsavel: '', prazo: '' })}
          onRemove={(i) => removeItem('plano_acao', i)}
          addLabel="Adicionar ação"
        />
      </Section>
    </div>
  );
}

// ─── 17. Análise do Funil de Vendas (GV) ───────────────────────
export function FormFunilVendas({ form, set, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Período" />
        <Input label="Período analisado" value={form.periodo_analisado}
          onChange={e => set('periodo_analisado', e.target.value)} disabled={readOnly}
          placeholder="Ex: 09/06 a 13/06/2026" required />
      </Section>

      <Section>
        <SectionTitle number="2" title="Indicadores do Funil" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input label="Leads recebidos" type="number" value={form.leads_recebidos} onChange={e => set('leads_recebidos', e.target.value)} disabled={readOnly} required />
          <Input label="Leads contatados" type="number" value={form.leads_contatados} onChange={e => set('leads_contatados', e.target.value)} disabled={readOnly} required />
          <Input label="Agendamentos realizados" type="number" value={form.agendamentos} onChange={e => set('agendamentos', e.target.value)} disabled={readOnly} required />
          <Input label="Visitas realizadas" type="number" value={form.visitas} onChange={e => set('visitas', e.target.value)} disabled={readOnly} required />
          <Input label="Pastas montadas" type="number" value={form.pastas} onChange={e => set('pastas', e.target.value)} disabled={readOnly} required />
          <Input label="Propostas apresentadas" type="number" value={form.propostas} onChange={e => set('propostas', e.target.value)} disabled={readOnly} required />
          <Input label="Vendas realizadas" type="number" value={form.vendas} onChange={e => set('vendas', e.target.value)} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="3" title="Análise" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Principal etapa de perda do funil" value={form.etapa_perda}
            onChange={e => set('etapa_perda', e.target.value)} disabled={readOnly} required />
          <Input label="Responsável pela ação" value={form.responsavel_acao}
            onChange={e => set('responsavel_acao', e.target.value)} disabled={readOnly} required />
        </div>
        <Textarea label="Motivo predominante das perdas" value={form.motivo_perdas}
          onChange={e => set('motivo_perdas', e.target.value)} rows={3} disabled={readOnly} required />
        <Textarea label="Ação corretiva definida" value={form.acao_corretiva}
          onChange={e => set('acao_corretiva', e.target.value)} rows={3} disabled={readOnly} required />
      </Section>
    </div>
  );
}

// ─── 18. Reunião de Performance com Corretores (GV) ────────────
export function FormPerformanceCorretores({ form, set, setList, addItem, removeItem, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Identificação" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input type="date" label="Data da reunião" value={form.data_reuniao}
            onChange={e => set('data_reuniao', e.target.value)} disabled={readOnly} required />
          <Input type="date" label="Data do próximo acompanhamento" value={form.proximo_acompanhamento}
            onChange={e => set('proximo_acompanhamento', e.target.value)} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="2" title="Participantes" />
        <DynamicTable
          columns={[{ key: 'nome', label: 'Nome' }, { key: 'cargo', label: 'Cargo' }]}
          rows={form.participantes || []} readOnly={readOnly}
          onChange={(i, k, v) => setList('participantes', i, k, v)}
          onAdd={() => addItem('participantes', { nome: '', cargo: '' })}
          onRemove={(i) => removeItem('participantes', i)}
          addLabel="Adicionar participante"
        />
      </Section>

      <Section>
        <SectionTitle number="3" title="Pauta e Análise" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Textarea label="Indicadores apresentados" value={form.indicadores_apresentados}
            onChange={e => set('indicadores_apresentados', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Principais pontos discutidos" value={form.pontos_discutidos}
            onChange={e => set('pontos_discutidos', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Dificuldades identificadas" value={form.dificuldades}
            onChange={e => set('dificuldades', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Ações definidas" value={form.acoes_definidas}
            onChange={e => set('acoes_definidas', e.target.value)} rows={3} disabled={readOnly} required />
        </div>
        <Textarea label="Responsáveis pelas ações" value={form.responsaveis_acoes}
          onChange={e => set('responsaveis_acoes', e.target.value)} rows={2} disabled={readOnly} required />
      </Section>
    </div>
  );
}

// ─── 19. Alinhamento Individual com Corretores 1:1 (GV) ────────
export function FormAlinhamentoIndividual({ form, set, readOnly }) {
  const precisaApoio = form.necessidade_apoio === 'Sim';
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Identificação" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Corretor acompanhado" value={form.corretor}
            onChange={e => set('corretor', e.target.value)} disabled={readOnly} required />
          <Input label="Meta do período" value={form.meta_periodo}
            onChange={e => set('meta_periodo', e.target.value)} disabled={readOnly} required />
          <Input label="Resultado atual" value={form.resultado_atual}
            onChange={e => set('resultado_atual', e.target.value)} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="2" title="Indicadores" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Atendimentos realizados" type="number" value={form.qtd_atendimentos}
            onChange={e => set('qtd_atendimentos', e.target.value)} disabled={readOnly} required />
          <Input label="Propostas apresentadas" type="number" value={form.qtd_propostas}
            onChange={e => set('qtd_propostas', e.target.value)} disabled={readOnly} required />
          <Input label="Vendas realizadas" type="number" value={form.qtd_vendas}
            onChange={e => set('qtd_vendas', e.target.value)} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="3" title="Dificuldades e Apoio" />
        <Textarea label="Principais dificuldades identificadas" value={form.dificuldades}
          onChange={e => set('dificuldades', e.target.value)} rows={3} disabled={readOnly} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Necessidade de apoio?" value={form.necessidade_apoio}
            onChange={e => set('necessidade_apoio', e.target.value)} disabled={readOnly} required>
            <option value="">Selecione...</option>
            {SIM_NAO.map(o => <option key={o} value={o}>{o}</option>)}
          </Select>
          {precisaApoio && (
            <Select label="Tipo de apoio necessário" value={form.tipo_apoio}
              onChange={e => set('tipo_apoio', e.target.value)} disabled={readOnly} required>
              <option value="">Selecione...</option>
              {TIPOS_APOIO.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          )}
        </div>
      </Section>

      <Section>
        <SectionTitle number="4" title="Plano de Ação" />
        <Textarea label="Ação definida" value={form.acao_definida}
          onChange={e => set('acao_definida', e.target.value)} rows={2} disabled={readOnly} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Responsável" value={form.responsavel}
            onChange={e => set('responsavel', e.target.value)} disabled={readOnly} required />
          <Input type="date" label="Data do próximo acompanhamento" value={form.proximo_acompanhamento}
            onChange={e => set('proximo_acompanhamento', e.target.value)} disabled={readOnly} required />
        </div>
      </Section>
    </div>
  );
}

// ─── 20. Treinamento Semanal do Time (GV) ──────────────────────
export function FormTreinamentoTime({ form, set, readOnly }) {
  const houveAvaliacao = form.houve_avaliacao === 'Sim';
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Dados do Treinamento" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input type="date" label="Data do treinamento" value={form.data_treinamento}
            onChange={e => set('data_treinamento', e.target.value)} disabled={readOnly} required />
          <Input label="Tema abordado" value={form.tema}
            onChange={e => set('tema', e.target.value)} disabled={readOnly} required />
          <Input label="Instrutor responsável" value={form.instrutor}
            onChange={e => set('instrutor', e.target.value)} disabled={readOnly} required />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Textarea label="Participantes" value={form.participantes}
            onChange={e => set('participantes', e.target.value)} rows={2} disabled={readOnly} required />
          <Textarea label="Corretores ausentes" value={form.corretores_ausentes}
            onChange={e => set('corretores_ausentes', e.target.value)} rows={2} disabled={readOnly}
            placeholder="Opcional — liste se houver ausentes." />
        </div>
      </Section>

      <Section>
        <SectionTitle number="2" title="Avaliação do Treinamento" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Houve avaliação?" value={form.houve_avaliacao}
            onChange={e => set('houve_avaliacao', e.target.value)} disabled={readOnly} required>
            <option value="">Selecione...</option>
            {SIM_NAO.map(o => <option key={o} value={o}>{o}</option>)}
          </Select>
          {houveAvaliacao && (
            <Input label="Nota média obtida" type="number" value={form.nota_media}
              onChange={e => set('nota_media', e.target.value)} disabled={readOnly} required />
          )}
        </div>
        <Textarea label="Dificuldades identificadas" value={form.dificuldades}
          onChange={e => set('dificuldades', e.target.value)} rows={2} disabled={readOnly} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Necessidade de reforço?" value={form.necessidade_reforco}
            onChange={e => set('necessidade_reforco', e.target.value)} disabled={readOnly} required>
            <option value="">Selecione...</option>
            {SIM_NAO.map(o => <option key={o} value={o}>{o}</option>)}
          </Select>
          <Input label="Próximo tema sugerido" value={form.proximo_tema}
            onChange={e => set('proximo_tema', e.target.value)} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="3" title="Evidências" />
        <Textarea label="Material apresentado" value={form.material_apresentado}
          onChange={e => set('material_apresentado', e.target.value)} rows={2} disabled={readOnly} required />
        <Textarea label="Fotos" value={form.fotos}
          onChange={e => set('fotos', e.target.value)} rows={2} disabled={readOnly}
          placeholder="Opcional — links ou observações sobre as fotos." />
      </Section>
    </div>
  );
}

// ─── 21. Monitoramento de Rotinas da Equipe (GV) ───────────────
export function FormMonitoramentoRotinas({ form, set, readOnly }) {
  const escalaNaoCumprida = form.escala_cumprida === 'Não';
  const houveAgendas = form.houve_agendas_externas === 'Sim';
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Período" />
        <Input label="Período analisado" value={form.periodo_analisado}
          onChange={e => set('periodo_analisado', e.target.value)} disabled={readOnly}
          placeholder="Ex: 09/06 a 13/06/2026" required />
      </Section>

      <Section>
        <SectionTitle number="2" title="Escala" />
        <Select label="Escala cumprida?" value={form.escala_cumprida}
          onChange={e => set('escala_cumprida', e.target.value)} disabled={readOnly} required>
          <option value="">Selecione...</option>
          {SIM_NAO.map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
        {escalaNaoCumprida && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Textarea label="Corretores ausentes" value={form.corretores_ausentes}
              onChange={e => set('corretores_ausentes', e.target.value)} rows={2} disabled={readOnly} required />
            <Textarea label="Motivo das ausências" value={form.motivo_ausencias}
              onChange={e => set('motivo_ausencias', e.target.value)} rows={2} disabled={readOnly} required />
          </div>
        )}
      </Section>

      <Section>
        <SectionTitle number="3" title="Rotina" />
        <Select label="Houve agendas externas?" value={form.houve_agendas_externas}
          onChange={e => set('houve_agendas_externas', e.target.value)} disabled={readOnly} required>
          <option value="">Selecione...</option>
          {SIM_NAO.map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
        {houveAgendas && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Select label="Tipo de agenda" value={form.tipo_agenda}
              onChange={e => set('tipo_agenda', e.target.value)} disabled={readOnly} required>
              <option value="">Selecione...</option>
              {TIPOS_AGENDA.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
            <Textarea label="Objetivo da agenda" value={form.objetivo_agenda}
              onChange={e => set('objetivo_agenda', e.target.value)} rows={2} disabled={readOnly} required />
          </div>
        )}
      </Section>

      <Section>
        <SectionTitle number="4" title="Análise" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Textarea label="Principais desvios identificados" value={form.desvios_identificados}
            onChange={e => set('desvios_identificados', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Ação corretiva definida" value={form.acao_corretiva}
            onChange={e => set('acao_corretiva', e.target.value)} rows={3} disabled={readOnly} required />
        </div>
      </Section>
    </div>
  );
}

// ─── 22. Análise do Resultado Geral do Time (GV) ───────────────
export function FormResultadoGeralTime({ form, set, readOnly }) {
  return (
    <div className="space-y-5">
      <Section>
        <SectionTitle number="1" title="Período" />
        <Input label="Período analisado" value={form.periodo_analisado}
          onChange={e => set('periodo_analisado', e.target.value)} disabled={readOnly}
          placeholder="Ex: Junho/2026" required />
      </Section>

      <Section>
        <SectionTitle number="2" title="Indicadores" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Input label="Leads recebidos" type="number" value={form.leads_recebidos} onChange={e => set('leads_recebidos', e.target.value)} disabled={readOnly} required />
          <Input label="Visitas realizadas" type="number" value={form.visitas} onChange={e => set('visitas', e.target.value)} disabled={readOnly} required />
          <Input label="Pastas montadas" type="number" value={form.pastas} onChange={e => set('pastas', e.target.value)} disabled={readOnly} required />
          <Input label="Propostas apresentadas" type="number" value={form.propostas} onChange={e => set('propostas', e.target.value)} disabled={readOnly} required />
          <Input label="Vendas realizadas" type="number" value={form.vendas} onChange={e => set('vendas', e.target.value)} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="3" title="Destaques" />
        <Input label="Corretor destaque do período" value={form.corretor_destaque}
          onChange={e => set('corretor_destaque', e.target.value)} disabled={readOnly} required />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Textarea label="Melhor resultado obtido" value={form.melhor_resultado}
            onChange={e => set('melhor_resultado', e.target.value)} rows={3} disabled={readOnly} required />
          <Textarea label="Principal desafio identificado" value={form.principal_desafio}
            onChange={e => set('principal_desafio', e.target.value)} rows={3} disabled={readOnly} required />
        </div>
      </Section>

      <Section>
        <SectionTitle number="4" title="Plano de Ação" />
        <Textarea label="Ações para melhoria dos resultados" value={form.acoes_melhoria}
          onChange={e => set('acoes_melhoria', e.target.value)} rows={3} disabled={readOnly} required />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Input label="Responsáveis" value={form.responsaveis}
            onChange={e => set('responsaveis', e.target.value)} disabled={readOnly} required />
          <Input label="Meta para próximo período" value={form.meta_proximo}
            onChange={e => set('meta_proximo', e.target.value)} disabled={readOnly} required />
        </div>
      </Section>
    </div>
  );
}
