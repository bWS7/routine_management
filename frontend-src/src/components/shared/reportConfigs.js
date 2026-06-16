/**
 * Mapeamento de atividades do catálogo → tipo de relatório personalizado.
 * As atividades de Superintendente Regional usam relatórios específicos.
 * Cada atividade que não tiver mapeamento aqui usará o relatório padrão.
 */

const SR_REPORTS_BY_ACTIVITY = {
  'reuniao de performance com liderados': 'reuniao_performance',
  'resultado semanal da regional': 'resultado_semanal',
  'decisoes de canal': 'decisoes_canal',
  'analise dos riscos da regional': 'analise_riscos',
  'acompanhamento e desenvolvimento dos liderados (1:1)': 'acompanhamento_liderados',
  'comite mensal de resultados': 'comite_mensal',

  // Aliases para rotinas antigas que ainda apontem para atividades anteriores.
  'reuniao de performance regional': 'reuniao_performance',
  'diagnostico semanal da regional': 'resultado_semanal',
  'top 3 riscos e contramedidas': 'analise_riscos',
  'plano de acao semanal regional': 'analise_riscos',
  'acompanhamento e desenvolvimento dos liderados': 'acompanhamento_liderados',
  '1:1 com gerentes de vendas': 'acompanhamento_liderados',
  'ciclo quinzenal de desenvolvimento': 'acompanhamento_liderados',
  'comite mensal de resultado': 'comite_mensal',
};

function normalizeActivityName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getReportType(atividadeNome, perfil) {
  if (!atividadeNome) return 'padrao';
  if (perfil && perfil !== 'sr') return 'padrao';

  return SR_REPORTS_BY_ACTIVITY[normalizeActivityName(atividadeNome)] || 'padrao';
}

export const REPORT_TITLES = {
  reuniao_performance: 'Reunião de Performance com Liderados',
  resultado_semanal: 'Resultado Semanal da Regional',
  decisoes_canal: 'Decisões de Canal',
  analise_riscos: 'Análise dos Riscos da Regional',
  acompanhamento_liderados: 'Acompanhamento e Desenvolvimento dos Liderados (1:1)',
  comite_mensal: 'Comitê Mensal de Resultados',
  padrao: 'Relatório Padrão Comercial',
};

export const REPORT_OBJECTIVES = {
  reuniao_performance: 'Acompanhar resultados e desenvolvimento da equipe.',
  resultado_semanal: 'Consolidar os principais números da semana.',
  decisoes_canal: 'Avaliar a performance dos canais e direcionar ações.',
  analise_riscos: 'Identificar e tratar riscos que possam impactar os resultados.',
  acompanhamento_liderados: 'Apoiar o crescimento e os resultados dos gestores.',
  comite_mensal: 'Analisar os resultados e planejar o próximo período.',
};

const REQUIRED_FIELDS = {
  reuniao_performance: [
    'data_reuniao',
    'hora_inicio',
    'hora_termino',
    'indicadores_apresentados',
    'desafios_dificuldades',
    'acompanhamento_rotatividade',
    { list: 'participantes', fields: ['nome', 'cargo'] },
    { list: 'plano_acao', fields: ['acao', 'responsavel', 'prazo'] },
  ],
  resultado_semanal: [
    'periodo_referencia',
    'qtd_leads',
    'qtd_visitas',
    'qtd_pastas',
    'qtd_propostas',
    'qtd_vendas',
    'destaques_positivos',
  ],
  decisoes_canal: [
    'canais_melhor_desempenho',
    'canais_baixo_desempenho',
    'parcerias_fortalecer',
    'parcerias_plano_encerramento',
    'necessidade_novos_canais',
    'decisoes_tomadas',
    'responsaveis_acoes',
  ],
  analise_riscos: [
    { list: 'riscos', fields: ['risco', 'impacto', 'prioridade', 'plano_acao', 'responsavel'] },
  ],
  acompanhamento_liderados: [
    {
      list: 'liderados',
      fields: [
        'nome',
        'meta',
        'resultado_atual',
        'dificuldades',
        'necessidade_apoio',
        'acoes_desenvolvimento',
        'proximo_acompanhamento',
      ],
    },
  ],
  comite_mensal: [
    'periodo_analisado',
    'principais_resultados',
    'aprendizados',
    'plano_acao_proximo_mes',
    'metas_proximo_periodo',
    { list: 'participantes', fields: ['nome', 'cargo'] },
  ],
};

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export function validateRequiredReport(reportType, form) {
  const rules = REQUIRED_FIELDS[reportType];
  if (!rules) return true;

  return rules.every(rule => {
    if (typeof rule === 'string') return hasValue(form?.[rule]);

    const rows = form?.[rule.list];
    return Array.isArray(rows) &&
      rows.length > 0 &&
      rows.every(row => rule.fields.every(field => hasValue(row?.[field])));
  });
}

// ── Builders de formulário vazio por tipo ──

export function buildEmptyForm(reportType) {
  switch (reportType) {
    case 'reuniao_performance':
      return {
        data_reuniao: new Date().toISOString().split('T')[0],
        hora_inicio: '',
        hora_termino: '',
        participantes: [{ nome: '', cargo: '' }],
        indicadores_apresentados: '',
        desafios_dificuldades: '',
        plano_acao: [{ acao: '', responsavel: '', prazo: '' }],
        acompanhamento_rotatividade: '',
      };

    case 'resultado_semanal':
      return {
        periodo_referencia: '',
        qtd_leads: '',
        qtd_visitas: '',
        qtd_pastas: '',
        qtd_propostas: '',
        qtd_vendas: '',
        destaques_positivos: '',
      };

    case 'decisoes_canal':
      return {
        canais_melhor_desempenho: '',
        canais_baixo_desempenho: '',
        parcerias_fortalecer: '',
        parcerias_plano_encerramento: '',
        necessidade_novos_canais: '',
        decisoes_tomadas: '',
        responsaveis_acoes: '',
      };

    case 'analise_riscos':
      return {
        riscos: [{ risco: '', impacto: '', prioridade: 'Alta', plano_acao: '', responsavel: '' }],
      };

    case 'acompanhamento_liderados':
      return {
        liderados: [{
          nome: '', meta: '', resultado_atual: '',
          dificuldades: '', necessidade_apoio: '',
          acoes_desenvolvimento: '', proximo_acompanhamento: '',
        }],
      };

    case 'comite_mensal':
      return {
        periodo_analisado: '',
        participantes: [{ nome: '', cargo: '' }],
        principais_resultados: '',
        aprendizados: '',
        plano_acao_proximo_mes: '',
        metas_proximo_periodo: '',
      };

    default:
      return null; // will use legacy form
  }
}
