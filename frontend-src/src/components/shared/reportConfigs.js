/**
 * Mapeamento de atividades do catálogo → tipo de relatório personalizado.
 * As atividades de Superintendente Regional e Supervisor de Parceria usam
 * relatórios específicos. Cada atividade que não tiver mapeamento aqui usará
 * o relatório padrão.
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

const SP_REPORTS_BY_ACTIVITY = {
  'relatorio do canal parcerias': 'canal_parcerias',
  'rotina de visita a parceiros': 'rotina_visitas',
  'analise da carteira de parceiros': 'carteira_parceiros',
  'plano de reativacao e expansao': 'reativacao_expansao',
  'treinamento e alinhamento com parceiros': 'treinamento_parceiros',

  // Aliases para nomes anteriores das atividades.
  'rotina de visitas a parceiros': 'rotina_visitas',
  'mapa de carteira de parceiros': 'carteira_parceiros',
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
  const normalized = normalizeActivityName(atividadeNome);

  if (perfil === 'sp') return SP_REPORTS_BY_ACTIVITY[normalized] || 'padrao';
  if (perfil && perfil !== 'sr') return 'padrao';

  return SR_REPORTS_BY_ACTIVITY[normalized] || 'padrao';
}

export const REPORT_TITLES = {
  reuniao_performance: 'Reunião de Performance com Liderados',
  resultado_semanal: 'Resultado Semanal da Regional',
  decisoes_canal: 'Decisões de Canal',
  analise_riscos: 'Análise dos Riscos da Regional',
  acompanhamento_liderados: 'Acompanhamento e Desenvolvimento dos Liderados (1:1)',
  comite_mensal: 'Comitê Mensal de Resultados',

  canal_parcerias: 'Relatório do Canal Parcerias',
  rotina_visitas: 'Rotina de Visita a Parceiros',
  carteira_parceiros: 'Análise da Carteira de Parceiros',
  reativacao_expansao: 'Plano de Reativação e Expansão',
  treinamento_parceiros: 'Treinamento e Alinhamento com Parceiros',

  padrao: 'Relatório Padrão Comercial',
};

export const REPORT_OBJECTIVES = {
  reuniao_performance: 'Acompanhar resultados e desenvolvimento da equipe.',
  resultado_semanal: 'Consolidar os principais números da semana.',
  decisoes_canal: 'Avaliar a performance dos canais e direcionar ações.',
  analise_riscos: 'Identificar e tratar riscos que possam impactar os resultados.',
  acompanhamento_liderados: 'Apoiar o crescimento e os resultados dos gestores.',
  comite_mensal: 'Analisar os resultados e planejar o próximo período.',

  canal_parcerias: 'Acompanhar a performance dos parceiros.',
  rotina_visitas: 'Fortalecer relacionamento e identificar oportunidades.',
  carteira_parceiros: 'Acompanhar a evolução da carteira de parceiros.',
  reativacao_expansao: 'Ampliar e recuperar a base de parceiros.',
  treinamento_parceiros: 'Garantir conhecimento e alinhamento comercial.',
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

  canal_parcerias: [
    'periodo_referencia',
    'qtd_parceiros_ativos',
    'leads_gerados',
    'visitas_realizadas',
    'parceiros_melhor_desempenho',
    'oportunidades_dificuldades',
  ],
  rotina_visitas: [
    {
      list: 'visitas',
      fields: ['parceiro', 'data', 'hora_inicio', 'hora_fim', 'tipo_acao', 'temas', 'oportunidades', 'proximos_passos'],
    },
  ],
  carteira_parceiros: [
    'qtd_parceiros_ativos',
    'parceiros_maior_resultado',
    'parceiros_perdidos',
    'motivo_perda',
    'parceiros_potencial',
    'plano_recuperacao',
  ],
  reativacao_expansao: [
    {
      list: 'acoes',
      fields: ['tipo_acao', 'parceiro_canal', 'descricao_plano', 'responsavel', 'prazo'],
    },
  ],
  treinamento_parceiros: [
    'tipo_acao',
    'parceiro_atendido',
    'data',
    'hora_inicio',
    'hora_fim',
    'participantes',
    'pauta',
    'materiais',
    'proximas_acoes',
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

    case 'canal_parcerias':
      return {
        periodo_referencia: '',
        qtd_parceiros_ativos: '',
        leads_gerados: '',
        visitas_realizadas: '',
        propostas_geradas: '',
        vendas_realizadas: '',
        parceiros_melhor_desempenho: '',
        oportunidades_dificuldades: '',
      };

    case 'rotina_visitas':
      return {
        visitas: [{
          parceiro: '', data: '', hora_inicio: '', hora_fim: '',
          tipo_acao: 'Visita', temas: '', oportunidades: '', proximos_passos: '',
        }],
      };

    case 'carteira_parceiros':
      return {
        qtd_parceiros_ativos: '',
        parceiros_maior_resultado: '',
        parceiros_perdidos: '',
        motivo_perda: '',
        parceiros_potencial: '',
        plano_recuperacao: '',
      };

    case 'reativacao_expansao':
      return {
        acoes: [{
          tipo_acao: 'Reativação', parceiro_canal: '', descricao_plano: '',
          responsavel: '', prazo: '',
        }],
      };

    case 'treinamento_parceiros':
      return {
        tipo_acao: 'Treinamento',
        parceiro_atendido: '',
        data: new Date().toISOString().split('T')[0],
        hora_inicio: '',
        hora_fim: '',
        participantes: '',
        pauta: '',
        materiais: '',
        proximas_acoes: '',
      };

    default:
      return null; // will use legacy form
  }
}
