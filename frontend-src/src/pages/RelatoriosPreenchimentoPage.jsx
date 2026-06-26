import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Download, Search, Filter, Eye, ChevronDown, ChevronUp,
  BarChart2, RefreshCw,
} from 'lucide-react';
import { apiFetch, downloadExport } from '../api/client';
import { useToast } from '../context/ToastContext';
import { PageSpinner, EmptyState } from '../components/ui/Spinner';
import { PeriodoBadge, StatusBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Select, Input } from '../components/ui/Input';
import FormularioComercialModal from '../components/shared/FormularioComercialModal';
import { fmtDate, PERIODO_LABELS, STATUS_LABELS } from '../utils/constants';

const PERFIL_LABELS = {
  sr: 'Superintendente Regional',
  gv: 'Gerente de Vendas',
  cd: 'Coordenador de Produto',
  sp: 'Supervisor de Parceria',
};

const INDICADORES = ['Leads', 'Conversão', 'Visitas', 'Reservas', 'Vendas'];

function StatusIndicador({ valor }) {
  if (!valor) return <span className="text-gray-300">—</span>;
  const cls = valor === 'OK' ? 'bg-green-100 text-green-700'
    : valor === 'Atenção' ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{valor}</span>;
}

function ObjetivoTag({ valor }) {
  if (!valor) return <span className="text-gray-300 text-xs">—</span>;
  const cls = valor === 'Sim' ? 'bg-green-100 text-green-700'
    : valor === 'Parcialmente' ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-600';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{valor}</span>;
}

// ── Métricas agregadas ────────────────────────────────────────────────────────
function MetricasSection({ relatorios }) {
  const total = relatorios.length;
  if (total === 0) return null;

  const form = (r) => r.formulario_data || {};

  const porObjetivo = { Sim: 0, Parcialmente: 0, Não: 0, '—': 0 };
  const porCategoria = {};
  const porApoio = { Sim: 0, Parcialmente: 0, Não: 0, '—': 0 };
  const indicAgg = {};
  INDICADORES.forEach(ind => { indicAgg[ind] = { ok: 0, atencao: 0, critico: 0, total: 0 }; });

  relatorios.forEach(r => {
    const f = form(r);
    const obj = f.objetivo_atingido || '—';
    porObjetivo[obj] = (porObjetivo[obj] || 0) + 1;
    const cat = f.categoria || '—';
    porCategoria[cat] = (porCategoria[cat] || 0) + 1;
    const apoio = f.necessita_apoio || '—';
    porApoio[apoio] = (porApoio[apoio] || 0) + 1;
    INDICADORES.forEach(ind => {
      const status = f.resultados?.[ind]?.status;
      if (status) {
        indicAgg[ind].total++;
        if (status === 'OK') indicAgg[ind].ok++;
        else if (status === 'Atenção') indicAgg[ind].atencao++;
        else indicAgg[ind].critico++;
      }
    });
  });

  const pct = (n) => total > 0 ? Math.round(n / total * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 size={15} className="text-primary-600" />
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Indicadores e Métricas</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Objetivo atingido */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-card">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Objetivo Atingido</p>
          <div className="space-y-2">
            {[['Sim', 'bg-green-500'], ['Parcialmente', 'bg-yellow-400'], ['Não', 'bg-red-500']].map(([k, col]) => (
              <div key={k}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-600">{k}</span>
                  <span className="font-semibold text-gray-800">{porObjetivo[k] || 0} ({pct(porObjetivo[k] || 0)}%)</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${col} rounded-full transition-all`} style={{ width: `${pct(porObjetivo[k] || 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Por categoria */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-card">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Por Categoria</p>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, n]) => (
              <div key={cat} className="flex justify-between text-xs">
                <span className="text-gray-600 truncate mr-2">{cat}</span>
                <span className="font-semibold text-gray-800 shrink-0">{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Escalonamento */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-card">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Necessita Apoio de Outra Área</p>
          <div className="space-y-2">
            {[['Sim', 'bg-red-400'], ['Parcialmente', 'bg-yellow-400'], ['Não', 'bg-green-400']].map(([k, col]) => (
              <div key={k}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-600">{k}</span>
                  <span className="font-semibold text-gray-800">{porApoio[k] || 0}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${col} rounded-full`} style={{ width: `${pct(porApoio[k] || 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Indicadores */}
      {INDICADORES.some(ind => indicAgg[ind].total > 0) && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-card overflow-x-auto">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Status dos Indicadores</p>
          <table className="w-full text-xs min-w-[400px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['Indicador', 'Preenchidos', 'OK', 'Atenção', 'Crítico'].map(h => (
                  <th key={h} className="text-left text-gray-400 font-medium pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INDICADORES.filter(ind => indicAgg[ind].total > 0).map(ind => {
                const a = indicAgg[ind];
                return (
                  <tr key={ind} className="border-b border-gray-50">
                    <td className="pr-4 py-2 font-medium text-gray-700">{ind}</td>
                    <td className="pr-4 py-2 text-gray-500">{a.total}</td>
                    <td className="pr-4 py-2"><span className="text-green-600 font-semibold">{a.ok}</span></td>
                    <td className="pr-4 py-2"><span className="text-yellow-600 font-semibold">{a.atencao}</span></td>
                    <td className="pr-4 py-2"><span className="text-red-600 font-semibold">{a.critico}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Linha da tabela ───────────────────────────────────────────────────────────
function RelatorioRow({ rotina, onView }) {
  const [expanded, setExpanded] = useState(false);
  const f = rotina.formulario_data || {};

  return (
    <>
      <tr
        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <td className="px-4 py-3">
          <div className="font-medium text-sm text-gray-900">{rotina.usuario_nome}</div>
          <div className="text-xs text-gray-400">{PERFIL_LABELS[rotina.perfil] || rotina.perfil}</div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px]">
          <div className="truncate">{rotina.atividade_nome}</div>
        </td>
        <td className="px-4 py-3">
          <PeriodoBadge periodo={rotina.periodicidade} label={PERIODO_LABELS[rotina.periodicidade]} />
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          {rotina.periodo_label && (
            <div className="font-semibold text-gray-700">{rotina.periodo_label}</div>
          )}
          {fmtDate(rotina.periodo_inicio)} → {fmtDate(rotina.periodo_fim)}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={rotina.status} label={STATUS_LABELS[rotina.status]} />
        </td>
        <td className="px-4 py-3 text-xs text-gray-600">{f.categoria || '—'}</td>
        <td className="px-4 py-3"><ObjetivoTag valor={f.objetivo_atingido} /></td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={e => { e.stopPropagation(); onView(rotina); }}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              <Eye size={13} /> Ver
            </button>
            {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50 border-b border-gray-100">
          <td colSpan={8} className="px-4 py-4">
            <RelatorioResumoPreview rotina={rotina} f={f} />
          </td>
        </tr>
      )}
    </>
  );
}

import { getReportType, CHECKLIST_STAND_ITENS } from '../components/shared/reportConfigs';

function RelatorioResumoPreview({ rotina, f }) {
  const type = getReportType(rotina.atividade_nome, rotina.perfil);

  if (type === 'reuniao_performance') {
    return (
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div><strong>Data:</strong> {f.data_reuniao || '—'}</div>
          <div><strong>Início:</strong> {f.hora_inicio || '—'}</div>
          <div><strong>Término:</strong> {f.hora_termino || '—'}</div>
        </div>
        {f.participantes?.length > 0 && (
          <div>
            <strong>Participantes:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              {f.participantes.map((p, idx) => p.nome && (
                <li key={idx}>{p.nome} {p.cargo ? `(${p.cargo})` : ''}</li>
              ))}
            </ul>
          </div>
        )}
        {f.indicadores_apresentados && (
          <div>
            <strong>Principais Indicadores Apresentados:</strong>
            <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{f.indicadores_apresentados}</p>
          </div>
        )}
        {f.desafios_dificuldades && (
          <div>
            <strong>Desafios e Dificuldades Identificados:</strong>
            <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{f.desafios_dificuldades}</p>
          </div>
        )}
        {f.plano_acao?.length > 0 && (
          <div>
            <strong>Plano de Ação Definido:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              {f.plano_acao.map((a, idx) => a.acao && (
                <li key={idx}>
                  <strong>{a.acao}</strong> - Resp: {a.responsavel || '—'} (Prazo: {a.prazo || '—'})
                </li>
              ))}
            </ul>
          </div>
        )}
        {f.acompanhamento_rotatividade && (
          <div>
            <strong>Acompanhamento da Rotatividade da Equipe:</strong>
            <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{f.acompanhamento_rotatividade}</p>
          </div>
        )}
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'resultado_semanal') {
    return (
      <div className="space-y-3 text-xs">
        <div><strong>Período de Referência:</strong> {f.periodo_referencia || '—'}</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-2 rounded border border-gray-100">
            <div className="text-gray-400">Leads</div>
            <div className="text-sm font-semibold">{f.qtd_leads || '0'}</div>
          </div>
          <div className="bg-white p-2 rounded border border-gray-100">
            <div className="text-gray-400">Visitas</div>
            <div className="text-sm font-semibold">{f.qtd_visitas || '0'}</div>
          </div>
          <div className="bg-white p-2 rounded border border-gray-100">
            <div className="text-gray-400">Pastas</div>
            <div className="text-sm font-semibold">{f.qtd_pastas || '0'}</div>
          </div>
          <div className="bg-white p-2 rounded border border-gray-100">
            <div className="text-gray-400">Propostas</div>
            <div className="text-sm font-semibold">{f.qtd_propostas || '0'}</div>
          </div>
          <div className="bg-white p-2 rounded border border-gray-100">
            <div className="text-gray-400">Vendas</div>
            <div className="text-sm font-semibold">{f.qtd_vendas || '0'}</div>
          </div>
        </div>
        {f.destaques_positivos && (
          <div>
            <strong>Destaques Positivos da Semana:</strong>
            <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{f.destaques_positivos}</p>
          </div>
        )}
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'decisoes_canal') {
    return (
      <div className="space-y-2 text-xs">
        {f.canais_melhor_desempenho && (
          <div><strong>Canais com melhor desempenho:</strong> <p className="text-gray-700">{f.canais_melhor_desempenho}</p></div>
        )}
        {f.canais_baixo_desempenho && (
          <div><strong>Canais com baixo desempenho:</strong> <p className="text-gray-700">{f.canais_baixo_desempenho}</p></div>
        )}
        {f.parcerias_fortalecer && (
          <div><strong>Parcerias a serem fortalecidas:</strong> <p className="text-gray-700">{f.parcerias_fortalecer}</p></div>
        )}
        {f.parcerias_plano_encerramento && (
          <div><strong>Parcerias (Plano de ação ou encerramento):</strong> <p className="text-gray-700">{f.parcerias_plano_encerramento}</p></div>
        )}
        {f.necessidade_novos_canais && (
          <div><strong>Necessidade de abertura de novos canais:</strong> <p className="text-gray-700">{f.necessidade_novos_canais}</p></div>
        )}
        {f.decisoes_tomadas && (
          <div className="bg-white p-2 rounded border border-gray-100">
            <strong>Decisões Tomadas:</strong>
            <p className="text-gray-800 whitespace-pre-wrap mt-1">{f.decisoes_tomadas}</p>
          </div>
        )}
        {f.responsaveis_acoes && (
          <div><strong>Responsáveis pelas Ações:</strong> <p className="text-gray-700">{f.responsaveis_acoes}</p></div>
        )}
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'analise_riscos') {
    return (
      <div className="space-y-3 text-xs">
        <strong>Análise dos Riscos da Regional:</strong>
        {f.riscos?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border border-gray-100 rounded">
              <thead className="bg-gray-100 text-gray-500">
                <tr>
                  <th className="p-1.5 text-left">Risco Identificado</th>
                  <th className="p-1.5 text-left">Impacto Esperado</th>
                  <th className="p-1.5 text-left">Prioridade</th>
                  <th className="p-1.5 text-left">Plano de Ação</th>
                  <th className="p-1.5 text-left">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {f.riscos.map((r, idx) => r.risco && (
                  <tr key={idx} className="border-b border-gray-100 bg-white">
                    <td className="p-1.5 font-medium">{r.risco}</td>
                    <td className="p-1.5">{r.impacto || '—'}</td>
                    <td className="p-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        r.prioridade === 'Alta' ? 'bg-red-100 text-red-700' :
                        r.prioridade === 'Média' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{r.prioridade}</span>
                    </td>
                    <td className="p-1.5">{r.plano_acao || '—'}</td>
                    <td className="p-1.5">{r.responsavel || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-gray-400">Nenhum risco mapeado.</p>}
        <div className="text-gray-400 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'acompanhamento_liderados') {
    return (
      <div className="space-y-3 text-xs">
        <strong>Acompanhamento e Desenvolvimento dos Liderados:</strong>
        {f.liderados?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border border-gray-100 rounded">
              <thead className="bg-gray-100 text-gray-500">
                <tr>
                  <th className="p-1.5 text-left">Liderado</th>
                  <th className="p-1.5 text-left">Meta Definida</th>
                  <th className="p-1.5 text-left">Resultado Atual</th>
                  <th className="p-1.5 text-left">Dificuldades</th>
                  <th className="p-1.5 text-left">Apoio Necessário</th>
                  <th className="p-1.5 text-left">Ações Desenvolvimento</th>
                  <th className="p-1.5 text-left">Próximo Acompanhamento</th>
                </tr>
              </thead>
              <tbody>
                {f.liderados.map((l, idx) => l.nome && (
                  <tr key={idx} className="border-b border-gray-100 bg-white">
                    <td className="p-1.5 font-medium">{l.nome}</td>
                    <td className="p-1.5">{l.meta || '—'}</td>
                    <td className="p-1.5">{l.resultado_atual || '—'}</td>
                    <td className="p-1.5">{l.dificuldades || '—'}</td>
                    <td className="p-1.5">{l.necessidade_apoio || '—'}</td>
                    <td className="p-1.5">{l.acoes_desenvolvimento || '—'}</td>
                    <td className="p-1.5">{l.proximo_acompanhamento || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-gray-400">Nenhum liderado acompanhado.</p>}
        <div className="text-gray-400 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'comite_mensal') {
    return (
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div><strong>Período Analisado:</strong> {f.periodo_analisado || '—'}</div>
        </div>
        {f.participantes?.length > 0 && (
          <div>
            <strong>Participantes:</strong> {f.participantes.map(p => p.nome).filter(Boolean).join(', ') || '—'}
          </div>
        )}
        {f.principais_resultados && (
          <div>
            <strong>Principais Resultados Alcançados:</strong>
            <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{f.principais_resultados}</p>
          </div>
        )}
        {f.aprendizados && (
          <div>
            <strong>Aprendizados do Período:</strong>
            <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{f.aprendizados}</p>
          </div>
        )}
        {f.plano_acao_proximo_mes && (
          <div>
            <strong>Plano de Ação para o Próximo Mês:</strong>
            <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{f.plano_acao_proximo_mes}</p>
          </div>
        )}
        {f.metas_proximo_periodo && (
          <div>
            <strong>Metas do Próximo Período:</strong>
            <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{f.metas_proximo_periodo}</p>
          </div>
        )}
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'canal_parcerias') {
    return (
      <div className="space-y-3 text-xs">
        <div><strong>Período de Referência:</strong> {f.periodo_referencia || '—'}</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-2 rounded border border-gray-100">
            <div className="text-gray-400">Parceiros ativos</div>
            <div className="text-sm font-semibold">{f.qtd_parceiros_ativos || '0'}</div>
          </div>
          <div className="bg-white p-2 rounded border border-gray-100">
            <div className="text-gray-400">Leads</div>
            <div className="text-sm font-semibold">{f.leads_gerados || '0'}</div>
          </div>
          <div className="bg-white p-2 rounded border border-gray-100">
            <div className="text-gray-400">Visitas</div>
            <div className="text-sm font-semibold">{f.visitas_realizadas || '0'}</div>
          </div>
          <div className="bg-white p-2 rounded border border-gray-100">
            <div className="text-gray-400">Propostas</div>
            <div className="text-sm font-semibold">{f.propostas_geradas || '0'}</div>
          </div>
          <div className="bg-white p-2 rounded border border-gray-100">
            <div className="text-gray-400">Vendas</div>
            <div className="text-sm font-semibold">{f.vendas_realizadas || '0'}</div>
          </div>
        </div>
        {f.parceiros_melhor_desempenho && (
          <div>
            <strong>Parceiros com Melhor Desempenho:</strong>
            <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{f.parceiros_melhor_desempenho}</p>
          </div>
        )}
        {f.oportunidades_dificuldades && (
          <div>
            <strong>Oportunidades / Dificuldades Identificadas:</strong>
            <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{f.oportunidades_dificuldades}</p>
          </div>
        )}
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'rotina_visitas') {
    return (
      <div className="space-y-3 text-xs">
        <strong>Rotina de Visita a Parceiros:</strong>
        {f.visitas?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border border-gray-100 rounded">
              <thead className="bg-gray-100 text-gray-500">
                <tr>
                  <th className="p-1.5 text-left">Parceiro</th>
                  <th className="p-1.5 text-left">Data</th>
                  <th className="p-1.5 text-left">Início</th>
                  <th className="p-1.5 text-left">Fim</th>
                  <th className="p-1.5 text-left">Tipo</th>
                  <th className="p-1.5 text-left">Temas</th>
                  <th className="p-1.5 text-left">Oportunidades</th>
                  <th className="p-1.5 text-left">Próximos Passos</th>
                </tr>
              </thead>
              <tbody>
                {f.visitas.map((v, idx) => v.parceiro && (
                  <tr key={idx} className="border-b border-gray-100 bg-white">
                    <td className="p-1.5 font-medium">{v.parceiro}</td>
                    <td className="p-1.5">{v.data || '—'}</td>
                    <td className="p-1.5">{v.hora_inicio || '—'}</td>
                    <td className="p-1.5">{v.hora_fim || '—'}</td>
                    <td className="p-1.5">{v.tipo_acao || '—'}</td>
                    <td className="p-1.5">{v.temas || '—'}</td>
                    <td className="p-1.5">{v.oportunidades || '—'}</td>
                    <td className="p-1.5">{v.proximos_passos || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-gray-400">Nenhuma visita registrada.</p>}
        <div className="text-gray-400 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'carteira_parceiros') {
    return (
      <div className="space-y-2 text-xs">
        <div><strong>Parceiros Ativos:</strong> {f.qtd_parceiros_ativos || '—'}</div>
        {f.parceiros_maior_resultado && (
          <div><strong>Maior Geração de Resultados:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.parceiros_maior_resultado}</p></div>
        )}
        {f.parceiros_perdidos && (
          <div><strong>Parceiros Perdidos no Período:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.parceiros_perdidos}</p></div>
        )}
        {f.motivo_perda && (
          <div><strong>Motivo da Perda:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.motivo_perda}</p></div>
        )}
        {f.parceiros_potencial && (
          <div><strong>Potencial para Desenvolvimento:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.parceiros_potencial}</p></div>
        )}
        {f.plano_recuperacao && (
          <div className="bg-white p-2 rounded border border-gray-100">
            <strong>Plano de Ação (Recuperação / Fortalecimento):</strong>
            <p className="text-gray-800 whitespace-pre-wrap mt-1">{f.plano_recuperacao}</p>
          </div>
        )}
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'reativacao_expansao') {
    return (
      <div className="space-y-3 text-xs">
        <strong>Plano de Reativação e Expansão:</strong>
        {f.acoes?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border border-gray-100 rounded">
              <thead className="bg-gray-100 text-gray-500">
                <tr>
                  <th className="p-1.5 text-left">Tipo</th>
                  <th className="p-1.5 text-left">Parceiro / Canal</th>
                  <th className="p-1.5 text-left">Descrição do Plano</th>
                  <th className="p-1.5 text-left">Responsável</th>
                  <th className="p-1.5 text-left">Prazo</th>
                </tr>
              </thead>
              <tbody>
                {f.acoes.map((a, idx) => a.parceiro_canal && (
                  <tr key={idx} className="border-b border-gray-100 bg-white">
                    <td className="p-1.5 font-medium">{a.tipo_acao || '—'}</td>
                    <td className="p-1.5">{a.parceiro_canal}</td>
                    <td className="p-1.5">{a.descricao_plano || '—'}</td>
                    <td className="p-1.5">{a.responsavel || '—'}</td>
                    <td className="p-1.5">{a.prazo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-gray-400">Nenhuma ação registrada.</p>}
        <div className="text-gray-400 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'treinamento_parceiros') {
    return (
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div><strong>Tipo:</strong> {f.tipo_acao || '—'}</div>
          <div><strong>Parceiro:</strong> {f.parceiro_atendido || '—'}</div>
          <div><strong>Data:</strong> {f.data || '—'}</div>
          <div><strong>Início:</strong> {f.hora_inicio || '—'}</div>
          <div><strong>Fim:</strong> {f.hora_fim || '—'}</div>
        </div>
        {f.participantes && (
          <div>
            <strong>Participantes:</strong>
            <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{f.participantes}</p>
          </div>
        )}
        {f.pauta && (
          <div>
            <strong>Pauta Abordada:</strong>
            <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{f.pauta}</p>
          </div>
        )}
        {f.materiais && (
          <div>
            <strong>Materiais Apresentados:</strong>
            <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{f.materiais}</p>
          </div>
        )}
        {f.proximas_acoes && (
          <div>
            <strong>Próximas Ações Acordadas:</strong>
            <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{f.proximas_acoes}</p>
          </div>
        )}
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'checklist_stand') {
    const emps = f.empreendimentos || [];
    return (
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div><strong>Data:</strong> {f.data_execucao || '—'}</div>
          <div><strong>Responsável:</strong> {f.responsavel || '—'}</div>
        </div>
        {emps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border border-gray-100 rounded">
              <thead className="bg-gray-100 text-gray-500">
                <tr>
                  <th className="p-1.5 text-left">Item</th>
                  {emps.map((e, i) => <th key={i} className="p-1.5 text-left">{e.nome || `Emp. ${i + 1}`}</th>)}
                </tr>
              </thead>
              <tbody>
                {CHECKLIST_STAND_ITENS.map(it => (
                  <tr key={it.key} className="border-b border-gray-100 bg-white">
                    <td className="p-1.5">{it.label}</td>
                    {emps.map((e, i) => (
                      <td key={i} className="p-1.5">
                        <span className={
                          e.itens?.[it.key] === 'Não' ? 'text-red-600 font-semibold' :
                          e.itens?.[it.key] === 'Sim' ? 'text-green-600 font-semibold' : 'text-gray-400'
                        }>{e.itens?.[it.key] || '—'}</span>
                      </td>
                    ))}
                  </tr>
                ))}
                {emps.some(e => e.observacoes) && (
                  <tr className="bg-white">
                    <td className="p-1.5 text-gray-400 font-medium">Observação</td>
                    {emps.map((e, i) => <td key={i} className="p-1.5">{e.observacoes || '—'}</td>)}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : <p className="text-gray-400">Nenhum empreendimento verificado.</p>}
        {f.nao_conformidades?.length > 0 && (
          <div>
            <strong>Não Conformidades:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              {f.nao_conformidades.map((n, idx) => n.problema && (
                <li key={idx}>{n.problema} — <em>{n.criticidade || '—'}</em> · Ação: {n.acao || '—'} (Resp: {n.responsavel || '—'})</li>
              ))}
            </ul>
          </div>
        )}
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'reuniao_stand') {
    return (
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div><strong>Data:</strong> {f.data || '—'}</div>
          <div><strong>Início:</strong> {f.hora_inicio || '—'}</div>
          <div><strong>Término:</strong> {f.hora_termino || '—'}</div>
          <div><strong>Empreendimento:</strong> {f.empreendimento || '—'}</div>
        </div>
        {f.participantes?.length > 0 && (
          <div><strong>Participantes:</strong> {f.participantes.map(p => p.nome).filter(Boolean).join(', ') || '—'}</div>
        )}
        {f.resultados_dia && <div><strong>Resultados do dia/período:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.resultados_dia}</p></div>}
        {f.pendencias_operacionais && <div><strong>Pendências operacionais:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.pendencias_operacionais}</p></div>}
        {f.acoes_comerciais && <div><strong>Ações comerciais em andamento:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.acoes_comerciais}</p></div>}
        {f.demandas_marketing && <div><strong>Demandas de marketing:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.demandas_marketing}</p></div>}
        {f.necessidades_stand && <div><strong>Necessidades do stand:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.necessidades_stand}</p></div>}
        {f.plano_acao?.length > 0 && (
          <div>
            <strong>Plano de Ação:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              {f.plano_acao.map((a, idx) => a.acao && (
                <li key={idx}>{a.acao} — Resp: {a.responsavel || '—'} (Prazo: {a.prazo || '—'}) {a.status ? `· ${a.status}` : ''}</li>
              ))}
            </ul>
          </div>
        )}
        {f.observacoes && <div><strong>Observações Gerais:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.observacoes}</p></div>}
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'relatorio_geral_emp') {
    return (
      <div className="space-y-3 text-xs">
        <div><strong>Período Analisado:</strong> {f.periodo_analisado || '—'}</div>
        {f.resultados?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border border-gray-100 rounded">
              <thead className="bg-gray-100 text-gray-500">
                <tr>
                  <th className="p-1.5 text-left">Empreendimento</th>
                  <th className="p-1.5 text-left">Leads</th>
                  <th className="p-1.5 text-left">Visitas</th>
                  <th className="p-1.5 text-left">Pastas</th>
                  <th className="p-1.5 text-left">Propostas</th>
                  <th className="p-1.5 text-left">Vendas</th>
                </tr>
              </thead>
              <tbody>
                {f.resultados.map((r, idx) => r.empreendimento && (
                  <tr key={idx} className="border-b border-gray-100 bg-white">
                    <td className="p-1.5 font-medium">{r.empreendimento}</td>
                    <td className="p-1.5">{r.leads || '0'}</td>
                    <td className="p-1.5">{r.visitas || '0'}</td>
                    <td className="p-1.5">{r.pastas || '0'}</td>
                    <td className="p-1.5">{r.propostas || '0'}</td>
                    <td className="p-1.5">{r.vendas || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {f.destaques_positivos && <div><strong>Destaques positivos:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.destaques_positivos}</p></div>}
        {f.principais_dificuldades && <div><strong>Principais dificuldades:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.principais_dificuldades}</p></div>}
        {f.necessidade_apoio && <div><strong>Necessidade de apoio:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.necessidade_apoio}</p></div>}
        {f.plano_acao?.length > 0 && (
          <div>
            <strong>Plano de Ação:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              {f.plano_acao.map((a, idx) => a.acao && (
                <li key={idx}>{a.acao} — Resp: {a.responsavel || '—'} (Prazo: {a.prazo || '—'})</li>
              ))}
            </ul>
          </div>
        )}
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'analise_concorrencia') {
    return (
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div><strong>Construtora:</strong> {f.construtora || '—'}</div>
          <div><strong>Empreendimento:</strong> {f.empreendimento || '—'}</div>
          <div><strong>Cidade/Bairro:</strong> {f.cidade_bairro || '—'}</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div><strong>Comissão imobiliária:</strong> {f.comissao_imobiliaria || '—'}</div>
          <div><strong>Premiação imobiliária:</strong> {f.premiacao_imobiliaria || '—'}</div>
          <div><strong>Premiação corretor:</strong> {f.premiacao_corretor || '—'}</div>
          <div><strong>Entrada mínima:</strong> {f.entrada_minima || '—'}</div>
          <div><strong>Subsídio:</strong> {f.subsidio || '—'}</div>
          <div><strong>Campanhas vigentes:</strong> {f.campanhas_vigentes || '—'}</div>
        </div>
        {f.condicoes_comerciais && <div><strong>Condições comerciais:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.condicoes_comerciais}</p></div>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div><strong>Tipologia:</strong> {f.tipologia || '—'}</div>
          <div><strong>Metragem:</strong> {f.metragem || '—'}</div>
          <div><strong>Faixa de preço:</strong> {f.faixa_preco || '—'}</div>
        </div>
        {f.diferenciais && <div><strong>Diferenciais:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.diferenciais}</p></div>}
        {f.acoes_observadas && <div><strong>Ações de marketing observadas:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.acoes_observadas}</p></div>}
        {f.midias_utilizadas && <div><strong>Mídias utilizadas:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.midias_utilizadas}</p></div>}
        {f.eventos_promotores && <div><strong>Eventos/promotores:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.eventos_promotores}</p></div>}
        {f.vantagens_concorrente && <div><strong>Vantagens do concorrente:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.vantagens_concorrente}</p></div>}
        {f.fragilidades_concorrente && <div><strong>Fragilidades do concorrente:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.fragilidades_concorrente}</p></div>}
        {f.impacto_empreendimento && <div><strong>Impacto para nosso empreendimento:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.impacto_empreendimento}</p></div>}
        {f.acoes_recomendadas?.length > 0 && (
          <div>
            <strong>Ações Recomendadas:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              {f.acoes_recomendadas.map((a, idx) => a.sugestao_acao && (
                <li key={idx}>{a.sugestao_acao} — Resp: {a.responsavel || '—'}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'relatorio_mensal_emp') {
    return (
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div><strong>Empreendimento:</strong> {f.empreendimento || '—'}</div>
          <div><strong>Mês de referência:</strong> {f.mes_referencia || '—'}</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[['Leads', f.leads], ['Visitas', f.visitas], ['Pastas', f.pastas], ['Propostas', f.propostas], ['Vendas', f.vendas]].map(([rotulo, valor]) => (
            <div key={rotulo} className="bg-white p-2 rounded border border-gray-100">
              <div className="text-gray-400">{rotulo}</div>
              <div className="text-sm font-semibold">{valor || '0'}</div>
            </div>
          ))}
        </div>
        {f.principal_conquista && <div><strong>Principal conquista:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.principal_conquista}</p></div>}
        {f.principal_dificuldade && <div><strong>Principal dificuldade:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.principal_dificuldade}</p></div>}
        {f.acoes_realizadas && <div><strong>Ações realizadas:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.acoes_realizadas}</p></div>}
        {f.acoes_nao_concluidas && <div><strong>Ações não concluídas:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.acoes_nao_concluidas}</p></div>}
        <div><strong>Movimentação relevante da concorrência:</strong> {f.houve_movimentacao || '—'}</div>
        {f.descricao_concorrencia && <div><strong>Descrição:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.descricao_concorrencia}</p></div>}
        <div>
          <strong>Necessidades do Produto:</strong>
          <ul className="list-disc pl-4 mt-1 space-y-0.5">
            <li>Marketing: {f.necessidade_marketing || '—'}</li>
            <li>Comercial: {f.necessidade_comercial || '—'}</li>
            <li>Estrutura: {f.necessidade_estrutura || '—'}</li>
            <li>Estoque: {f.necessidade_estoque || '—'}</li>
            <li>Precificação: {f.necessidade_precificacao || '—'}</li>
          </ul>
        </div>
        {f.plano_acao?.length > 0 && (
          <div>
            <strong>Plano de Ação Próximo Mês:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              {f.plano_acao.map((a, idx) => a.acao && (
                <li key={idx}>{a.acao} — Resp: {a.responsavel || '—'} (Prazo: {a.prazo || '—'})</li>
              ))}
            </ul>
          </div>
        )}
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'funil_vendas') {
    return (
      <div className="space-y-3 text-xs">
        <div><strong>Período analisado:</strong> {f.periodo_analisado || '—'}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[['Leads recebidos', f.leads_recebidos], ['Leads contatados', f.leads_contatados], ['Agendamentos', f.agendamentos], ['Visitas', f.visitas], ['Pastas', f.pastas], ['Propostas', f.propostas], ['Vendas', f.vendas]].map(([rotulo, valor]) => (
            <div key={rotulo} className="bg-white p-2 rounded border border-gray-100">
              <div className="text-gray-400">{rotulo}</div>
              <div className="text-sm font-semibold">{valor || '0'}</div>
            </div>
          ))}
        </div>
        <div><strong>Principal etapa de perda:</strong> {f.etapa_perda || '—'}</div>
        {f.motivo_perdas && <div><strong>Motivo predominante das perdas:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.motivo_perdas}</p></div>}
        {f.acao_corretiva && <div><strong>Ação corretiva definida:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.acao_corretiva}</p></div>}
        <div><strong>Responsável pela ação:</strong> {f.responsavel_acao || '—'}</div>
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'performance_corretores') {
    return (
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div><strong>Data da reunião:</strong> {f.data_reuniao || '—'}</div>
          <div><strong>Próximo acompanhamento:</strong> {f.proximo_acompanhamento || '—'}</div>
        </div>
        {f.participantes?.length > 0 && (
          <div><strong>Participantes:</strong> {f.participantes.map(p => p.nome).filter(Boolean).join(', ') || '—'}</div>
        )}
        {f.indicadores_apresentados && <div><strong>Indicadores apresentados:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.indicadores_apresentados}</p></div>}
        {f.pontos_discutidos && <div><strong>Principais pontos discutidos:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.pontos_discutidos}</p></div>}
        {f.dificuldades && <div><strong>Dificuldades identificadas:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.dificuldades}</p></div>}
        {f.acoes_definidas && <div><strong>Ações definidas:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.acoes_definidas}</p></div>}
        {f.responsaveis_acoes && <div><strong>Responsáveis pelas ações:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.responsaveis_acoes}</p></div>}
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'alinhamento_individual') {
    return (
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div><strong>Corretor:</strong> {f.corretor || '—'}</div>
          <div><strong>Meta do período:</strong> {f.meta_periodo || '—'}</div>
          <div><strong>Resultado atual:</strong> {f.resultado_atual || '—'}</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-2 rounded border border-gray-100"><div className="text-gray-400">Atendimentos</div><div className="text-sm font-semibold">{f.qtd_atendimentos || '0'}</div></div>
          <div className="bg-white p-2 rounded border border-gray-100"><div className="text-gray-400">Propostas</div><div className="text-sm font-semibold">{f.qtd_propostas || '0'}</div></div>
          <div className="bg-white p-2 rounded border border-gray-100"><div className="text-gray-400">Vendas</div><div className="text-sm font-semibold">{f.qtd_vendas || '0'}</div></div>
        </div>
        {f.dificuldades && <div><strong>Dificuldades identificadas:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.dificuldades}</p></div>}
        <div><strong>Necessidade de apoio:</strong> {f.necessidade_apoio || '—'}{f.necessidade_apoio === 'Sim' && f.tipo_apoio ? ` — ${f.tipo_apoio}` : ''}</div>
        {f.acao_definida && <div><strong>Ação definida:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.acao_definida}</p></div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div><strong>Responsável:</strong> {f.responsavel || '—'}</div>
          <div><strong>Próximo acompanhamento:</strong> {f.proximo_acompanhamento || '—'}</div>
        </div>
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'treinamento_time') {
    return (
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div><strong>Data:</strong> {f.data_treinamento || '—'}</div>
          <div><strong>Tema:</strong> {f.tema || '—'}</div>
          <div><strong>Instrutor:</strong> {f.instrutor || '—'}</div>
        </div>
        {f.participantes && <div><strong>Participantes:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.participantes}</p></div>}
        {f.corretores_ausentes && <div><strong>Corretores ausentes:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.corretores_ausentes}</p></div>}
        <div><strong>Houve avaliação:</strong> {f.houve_avaliacao || '—'}{f.houve_avaliacao === 'Sim' && f.nota_media ? ` — Nota média: ${f.nota_media}` : ''}</div>
        {f.dificuldades && <div><strong>Dificuldades identificadas:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.dificuldades}</p></div>}
        <div><strong>Necessidade de reforço:</strong> {f.necessidade_reforco || '—'}</div>
        <div><strong>Próximo tema sugerido:</strong> {f.proximo_tema || '—'}</div>
        {f.material_apresentado && <div><strong>Material apresentado:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.material_apresentado}</p></div>}
        {f.fotos && <div><strong>Fotos:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.fotos}</p></div>}
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'monitoramento_rotinas') {
    return (
      <div className="space-y-2 text-xs">
        <div><strong>Período analisado:</strong> {f.periodo_analisado || '—'}</div>
        <div><strong>Escala cumprida:</strong> {f.escala_cumprida || '—'}</div>
        {f.escala_cumprida === 'Não' && (
          <>
            {f.corretores_ausentes && <div><strong>Corretores ausentes:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.corretores_ausentes}</p></div>}
            {f.motivo_ausencias && <div><strong>Motivo das ausências:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.motivo_ausencias}</p></div>}
          </>
        )}
        <div><strong>Houve agendas externas:</strong> {f.houve_agendas_externas || '—'}{f.houve_agendas_externas === 'Sim' && f.tipo_agenda ? ` — ${f.tipo_agenda}` : ''}</div>
        {f.houve_agendas_externas === 'Sim' && f.objetivo_agenda && (
          <div><strong>Objetivo da agenda:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.objetivo_agenda}</p></div>
        )}
        {f.desvios_identificados && <div><strong>Principais desvios identificados:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.desvios_identificados}</p></div>}
        {f.acao_corretiva && <div><strong>Ação corretiva definida:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.acao_corretiva}</p></div>}
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  if (type === 'resultado_geral_time') {
    return (
      <div className="space-y-3 text-xs">
        <div><strong>Período analisado:</strong> {f.periodo_analisado || '—'}</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[['Leads recebidos', f.leads_recebidos], ['Visitas', f.visitas], ['Pastas', f.pastas], ['Propostas', f.propostas], ['Vendas', f.vendas]].map(([rotulo, valor]) => (
            <div key={rotulo} className="bg-white p-2 rounded border border-gray-100">
              <div className="text-gray-400">{rotulo}</div>
              <div className="text-sm font-semibold">{valor || '0'}</div>
            </div>
          ))}
        </div>
        <div><strong>Corretor destaque:</strong> {f.corretor_destaque || '—'}</div>
        {f.melhor_resultado && <div><strong>Melhor resultado obtido:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.melhor_resultado}</p></div>}
        {f.principal_desafio && <div><strong>Principal desafio identificado:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.principal_desafio}</p></div>}
        {f.acoes_melhoria && <div><strong>Ações para melhoria:</strong> <p className="text-gray-700 whitespace-pre-wrap">{f.acoes_melhoria}</p></div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div><strong>Responsáveis:</strong> {f.responsaveis || '—'}</div>
          <div><strong>Meta próximo período:</strong> {f.meta_proximo || '—'}</div>
        </div>
        <div className="text-gray-400 mt-2 text-[10px]">
          Arquivos de Evidência: {rotina.evidencias?.length || 0}
        </div>
      </div>
    );
  }

  // Legacy fallback
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
      {f.objetivo && (
        <div>
          <p className="text-xs text-gray-400 font-medium mb-1">Objetivo</p>
          <p className="text-gray-700 text-xs">{f.objetivo}</p>
        </div>
      )}

      {f.resumo_execucao && (
        <div>
          <p className="text-xs text-gray-400 font-medium mb-1">Resumo da Execução</p>
          <p className="text-gray-700 text-xs">{f.resumo_execucao}</p>
        </div>
      )}

      {f.dificuldades && (
        <div>
          <p className="text-xs text-gray-400 font-medium mb-1">Dificuldades</p>
          <p className="text-gray-700 text-xs bg-yellow-50 rounded p-2">{f.dificuldades}</p>
        </div>
      )}

      {f.proximos_passos && (
        <div>
          <p className="text-xs text-gray-400 font-medium mb-1">Próximos Passos</p>
          <p className="text-gray-700 text-xs">{f.proximos_passos}</p>
        </div>
      )}

      {f.resultados && Object.entries(f.resultados).some(([, v]) => v.resultado_atual) && (
        <div className="sm:col-span-2 lg:col-span-3">
          <p className="text-xs text-gray-400 font-medium mb-2">Indicadores</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(f.resultados).filter(([, v]) => v.resultado_atual).map(([ind, v]) => (
              <div key={ind} className="bg-white border border-gray-100 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400">{ind}</p>
                <p className="text-sm font-semibold text-gray-800">{v.resultado_atual}</p>
                {v.meta && <p className="text-xs text-gray-400">Meta: {v.meta}</p>}
                {v.status && <StatusIndicador valor={v.status} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Evidências:</span>
        <span className="text-xs font-semibold text-gray-700">{rotina.evidencias?.length || 0} arquivo(s)</span>
      </div>

      {f.necessita_apoio && f.necessita_apoio !== 'Não' && (
        <div>
          <p className="text-xs text-gray-400 font-medium mb-1">Escalonamento</p>
          <p className="text-xs text-gray-700">{f.necessita_apoio} — {f.area_apoio || ''}</p>
        </div>
      )}
    </div>
  );
}


// ── Página principal ──────────────────────────────────────────────────────────
export default function RelatoriosPreenchimentoPage() {
  const { toast } = useToast();

  // Dados
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionais, setRegionais] = useState([]);
  const [atividades, setAtividades] = useState([]);

  // Filtros
  const [busca, setBusca] = useState('');
  const [regionalId, setRegionalId] = useState('');
  const [perfil, setPerfil] = useState('');
  const [atividadeId, setAtividadeId] = useState('');
  const [periodicidade, setPeriodicidade] = useState('');
  const [status, setStatus] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Modal visualização
  const [viewRotina, setViewRotina] = useState(null);

  // Tab ativa
  const [tab, setTab] = useState('tabela'); // tabela | metricas

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (busca) params.append('busca', busca);
    if (regionalId) params.append('regional_id', regionalId);
    if (perfil) params.append('perfil', perfil);
    if (atividadeId) params.append('atividade_id', atividadeId);
    if (periodicidade) params.append('periodicidade', periodicidade);
    if (status) params.append('status', status);
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    return params.toString();
  }, [busca, regionalId, perfil, atividadeId, periodicidade, status, dataInicio, dataFim]);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = buildQuery();
    const r = await apiFetch(`/api/rotinas/relatorios-preenchimento${qs ? '?' + qs : ''}`);
    if (r?.ok) setRelatorios(r.data);
    else toast(r?.data?.erro || 'Erro ao carregar relatórios', 'error');
    setLoading(false);
  }, [buildQuery, toast]);

  // Carrega regionais e atividades uma vez
  useEffect(() => {
    Promise.all([
      apiFetch('/api/regionais/'),
      apiFetch('/api/atividades/'),
    ]).then(([r, a]) => {
      if (r?.ok) setRegionais(r.data);
      if (a?.ok) setAtividades(a.data);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportar = () => {
    const qs = buildQuery();
    downloadExport(
      `/api/rotinas/relatorios-preenchimento/export${qs ? '?' + qs : ''}`,
      'relatorios_preenchimento.csv'
    ).catch(() => toast('Erro ao exportar', 'error'));
  };

  const limparFiltros = () => {
    setBusca(''); setRegionalId(''); setPerfil(''); setAtividadeId('');
    setPeriodicidade(''); setStatus(''); setDataInicio(''); setDataFim('');
  };

  const totalFiltros = [busca, regionalId, perfil, atividadeId, periodicidade, status, dataInicio, dataFim].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <FileText size={20} className="text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">Relatórios de Preenchimento</h1>
          </div>
          <p className="text-sm text-gray-500">
            {loading ? 'Carregando...' : `${relatorios.length} relatório(s) encontrado(s)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={load}>Atualizar</Button>
          <Button icon={Download} onClick={exportar}>Exportar CSV</Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Filter size={14} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtros</span>
          {totalFiltros > 0 && (
            <button onClick={limparFiltros} className="ml-auto text-xs text-primary-600 hover:text-primary-800 font-medium">
              Limpar {totalFiltros} filtro(s)
            </button>
          )}
        </div>

        {/* Busca rápida */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por colaborador ou atividade..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>

        {/* Filtros em grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Select value={regionalId} onChange={e => setRegionalId(e.target.value)} label="Regional">
            <option value="">Todas</option>
            {regionais.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </Select>

          <Select value={perfil} onChange={e => setPerfil(e.target.value)} label="Cargo">
            <option value="">Todos</option>
            {Object.entries(PERFIL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>

          <Select value={atividadeId} onChange={e => setAtividadeId(e.target.value)} label="Atividade">
            <option value="">Todas</option>
            {atividades.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </Select>

          <Select value={periodicidade} onChange={e => setPeriodicidade(e.target.value)} label="Periodicidade">
            <option value="">Todas</option>
            <option value="diaria">Diaria</option>
            <option value="semanal">Semanal</option>
            <option value="quinzenal">Quinzenal</option>
            <option value="mensal">Mensal</option>
          </Select>

          <Select value={status} onChange={e => setStatus(e.target.value)} label="Status">
            <option value="">Todos</option>
            <option value="concluida">Concluída</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="nao_iniciada">Não Iniciada</option>
            <option value="nao_realizada">Não Realizada</option>
          </Select>

          <Input type="date" label="Período início" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          <Input type="date" label="Período fim" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'tabela', label: 'Relatórios', icon: FileText },
          { id: 'metricas', label: 'Métricas', icon: BarChart2 },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon size={15} />
            {t.label}
            {t.id === 'tabela' && relatorios.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-primary-100 text-primary-700 font-semibold">
                {relatorios.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <PageSpinner />
      ) : relatorios.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum relatório encontrado"
          description="Ajuste os filtros ou aguarde que os colaboradores preencham os relatórios nas atividades."
        />
      ) : tab === 'metricas' ? (
        <MetricasSection relatorios={relatorios} />
      ) : (
        /* Tabela */
        <div className="bg-white border border-gray-100 rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Colaborador', 'Atividade', 'Período', 'Datas', 'Status', 'Categoria', 'Objetivo Atingido', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {relatorios.map(r => (
                  <RelatorioRow key={r.id} rotina={r} onView={setViewRotina} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {relatorios.length} relatório(s) · Clique em uma linha para expandir · Use "Ver" para o relatório completo
          </div>
        </div>
      )}

      {/* Modal relatório completo */}
      {viewRotina && (
        <FormularioComercialModal
          rotinaId={viewRotina.id}
          rotina={viewRotina}
          currentUser={null}
          readOnly
          onClose={() => setViewRotina(null)}
        />
      )}
    </div>
  );
}
