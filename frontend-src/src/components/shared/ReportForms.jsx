import { Plus, Trash2 } from 'lucide-react';
import { Input, Textarea, Select } from '../ui/Input';

const PRIORIDADES = ['Alta', 'Média', 'Baixa'];

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
  return <div className="border border-gray-100 rounded-xl p-4 space-y-3">{children}</div>;
}

function DynamicTable({ columns, rows, onAdd, onRemove, onChange, readOnly, addLabel }) {
  return (
    <div>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs min-w-[480px]">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map(c => (
                <th key={c.key} className="text-left text-gray-400 font-medium pb-2 pr-2">{c.label}</th>
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
                      >
                        {c.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={c.type || 'text'}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:bg-gray-50"
                        value={row[c.key] || ''} onChange={e => onChange(i, c.key, e.target.value)}
                        placeholder={c.placeholder || c.label} disabled={readOnly}
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
          <Input type="date" label="Data da reunião" value={form.data_reuniao} onChange={e => set('data_reuniao', e.target.value)} disabled={readOnly} />
          <Input type="time" label="Horário de início" value={form.hora_inicio} onChange={e => set('hora_inicio', e.target.value)} disabled={readOnly} />
          <Input type="time" label="Horário de término" value={form.hora_termino} onChange={e => set('hora_termino', e.target.value)} disabled={readOnly} />
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
        <Textarea label="Principais indicadores apresentados" value={form.indicadores_apresentados}
          onChange={e => set('indicadores_apresentados', e.target.value)} rows={3} disabled={readOnly}
          placeholder="Liste os indicadores discutidos na reunião..." />
        <Textarea label="Desafios e dificuldades identificados" value={form.desafios_dificuldades}
          onChange={e => set('desafios_dificuldades', e.target.value)} rows={3} disabled={readOnly}
          placeholder="Quais os principais desafios encontrados?" />
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
          placeholder="Registre informações sobre rotatividade..." />
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
          placeholder="Ex: 09/06 a 13/06/2026" />
      </Section>

      <Section>
        <SectionTitle number="2" title="Indicadores da Semana" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Input label="Quantidade de Leads" type="number" value={form.qtd_leads} onChange={e => set('qtd_leads', e.target.value)} disabled={readOnly} />
          <Input label="Quantidade de Visitas" type="number" value={form.qtd_visitas} onChange={e => set('qtd_visitas', e.target.value)} disabled={readOnly} />
          <Input label="Quantidade de Pastas" type="number" value={form.qtd_pastas} onChange={e => set('qtd_pastas', e.target.value)} disabled={readOnly} />
          <Input label="Quantidade de Propostas" type="number" value={form.qtd_propostas} onChange={e => set('qtd_propostas', e.target.value)} disabled={readOnly} />
          <Input label="Quantidade de Vendas" type="number" value={form.qtd_vendas} onChange={e => set('qtd_vendas', e.target.value)} disabled={readOnly} />
        </div>
      </Section>

      <Section>
        <SectionTitle number="3" title="Destaques" />
        <Textarea label="Destaques positivos da semana" value={form.destaques_positivos}
          onChange={e => set('destaques_positivos', e.target.value)} rows={4} disabled={readOnly}
          placeholder="Quais foram os destaques positivos?" />
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
        <Textarea label="Canais com melhor desempenho" value={form.canais_melhor_desempenho}
          onChange={e => set('canais_melhor_desempenho', e.target.value)} rows={3} disabled={readOnly} />
        <Textarea label="Canais com baixo desempenho" value={form.canais_baixo_desempenho}
          onChange={e => set('canais_baixo_desempenho', e.target.value)} rows={3} disabled={readOnly} />
      </Section>

      <Section>
        <SectionTitle number="2" title="Parcerias" />
        <Textarea label="Parcerias a serem fortalecidas" value={form.parcerias_fortalecer}
          onChange={e => set('parcerias_fortalecer', e.target.value)} rows={3} disabled={readOnly} />
        <Textarea label="Parcerias que exigem plano de ação ou encerramento" value={form.parcerias_plano_encerramento}
          onChange={e => set('parcerias_plano_encerramento', e.target.value)} rows={3} disabled={readOnly} />
        <Textarea label="Necessidade de abertura de novos canais" value={form.necessidade_novos_canais}
          onChange={e => set('necessidade_novos_canais', e.target.value)} rows={2} disabled={readOnly} />
      </Section>

      <Section>
        <SectionTitle number="3" title="Decisões e Responsáveis" />
        <Textarea label="Decisões tomadas" value={form.decisoes_tomadas}
          onChange={e => set('decisoes_tomadas', e.target.value)} rows={3} disabled={readOnly} />
        <Textarea label="Responsáveis pelas ações" value={form.responsaveis_acoes}
          onChange={e => set('responsaveis_acoes', e.target.value)} rows={2} disabled={readOnly} />
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
          placeholder="Ex: Junho/2026" />
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
        <Textarea label="Principais resultados alcançados" value={form.principais_resultados}
          onChange={e => set('principais_resultados', e.target.value)} rows={4} disabled={readOnly} />
        <Textarea label="Aprendizados do período" value={form.aprendizados}
          onChange={e => set('aprendizados', e.target.value)} rows={3} disabled={readOnly} />
      </Section>

      <Section>
        <SectionTitle number="4" title="Planejamento" />
        <Textarea label="Plano de ação para o próximo mês" value={form.plano_acao_proximo_mes}
          onChange={e => set('plano_acao_proximo_mes', e.target.value)} rows={4} disabled={readOnly} />
        <Textarea label="Metas do próximo período" value={form.metas_proximo_periodo}
          onChange={e => set('metas_proximo_periodo', e.target.value)} rows={3} disabled={readOnly} />
      </Section>
    </div>
  );
}
