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

const CD_REPORTS_BY_ACTIVITY = {
  'checklist de abertura do stand': 'checklist_stand',
  'reuniao rapida do stand': 'reuniao_stand',
  'relatorio geral do empreendimento': 'relatorio_geral_emp',
  '1-pager de concorrencia': 'analise_concorrencia',
  'relatorio mensal do empreendimento': 'relatorio_mensal_emp',

  // Aliases para variações de nomenclatura das atividades.
  'relatorio geral por empreendimento': 'relatorio_geral_emp',
  'analise de concorrencia': 'analise_concorrencia',
};

const GV_REPORTS_BY_ACTIVITY = {
  'painel do funil de vendas': 'funil_vendas',
  'reuniao coletiva com corretores': 'performance_corretores',
  '1:1 com corretores': 'alinhamento_individual',
  'treinamento semanal do time': 'treinamento_time',
  'checagem de disciplina operacional': 'monitoramento_rotinas',
  'revisao mensal de performance do time': 'resultado_geral_time',

  // Aliases para variações de nomenclatura das atividades.
  'analise do funil de vendas': 'funil_vendas',
  'reuniao de performance com corretores': 'performance_corretores',
  'alinhamento individual com corretores (1:1)': 'alinhamento_individual',
  'monitoramento de rotinas da equipe': 'monitoramento_rotinas',
  'analise do resultado geral do time': 'resultado_geral_time',
};

// Itens fixos do checklist de abertura do stand (linhas da matriz).
export const CHECKLIST_STAND_ITENS = [
  { key: 'ar_condicionado', label: 'Ar-condicionado funcionando' },
  { key: 'internet', label: 'Internet funcionando' },
  { key: 'agua', label: 'Água disponível' },
  { key: 'cafe', label: 'Café disponível' },
  { key: 'copos', label: 'Copos descartáveis disponíveis' },
  { key: 'banheiro', label: 'Banheiro limpo' },
  { key: 'iluminacao', label: 'Iluminação funcionando' },
  { key: 'tv_equipamentos', label: 'TV/Equipamentos funcionando' },
  { key: 'mesa_cadeiras', label: 'Mesa e cadeiras em condições' },
  { key: 'material_vendas', label: 'Material de vendas disponível' },
  { key: 'maquete', label: 'Maquete limpa' },
  { key: 'apartamento_decorado', label: 'Apartamento decorado organizado' },
];

export function emptyChecklistEmpreendimento() {
  return {
    nome: '',
    itens: CHECKLIST_STAND_ITENS.reduce((acc, it) => { acc[it.key] = ''; return acc; }, {}),
    observacoes: '',
  };
}

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
  if (perfil === 'cd') return CD_REPORTS_BY_ACTIVITY[normalized] || 'padrao';
  if (perfil === 'gv') return GV_REPORTS_BY_ACTIVITY[normalized] || 'padrao';
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

  checklist_stand: 'Checklist de Abertura do Stand',
  reuniao_stand: 'Reunião Rápida do Stand',
  relatorio_geral_emp: 'Relatório Geral por Empreendimento',
  analise_concorrencia: 'Análise de Concorrência',
  relatorio_mensal_emp: 'Relatório Mensal do Empreendimento',

  funil_vendas: 'Análise do Funil de Vendas',
  performance_corretores: 'Reunião de Performance com Corretores',
  alinhamento_individual: 'Alinhamento Individual com Corretores (1:1)',
  treinamento_time: 'Treinamento Semanal do Time',
  monitoramento_rotinas: 'Monitoramento de Rotinas da Equipe',
  resultado_geral_time: 'Análise do Resultado Geral do Time',

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

  checklist_stand: 'Garantir que o stand esteja apto para atendimento dos clientes.',
  reuniao_stand: 'Alinhar a equipe do stand sobre resultados, pendências e ações.',
  relatorio_geral_emp: 'Consolidar os resultados dos empreendimentos no período.',
  analise_concorrencia: 'Monitorar o cenário competitivo do empreendimento.',
  relatorio_mensal_emp: 'Analisar a performance mensal do empreendimento.',

  funil_vendas: 'Identificar gargalos do funil e definir ações corretivas.',
  performance_corretores: 'Acompanhar desempenho da equipe e direcionar melhorias.',
  alinhamento_individual: 'Acompanhar resultados e desenvolvimento individual.',
  treinamento_time: 'Desenvolver competências da equipe comercial.',
  monitoramento_rotinas: 'Garantir o cumprimento da rotina operacional da equipe.',
  resultado_geral_time: 'Avaliar a performance consolidada da equipe comercial.',
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

  checklist_stand: [
    'data_execucao',
    'responsavel',
    (form) => Array.isArray(form?.empreendimentos) &&
      form.empreendimentos.length > 0 &&
      form.empreendimentos.every(e =>
        hasValue(e?.nome) && CHECKLIST_STAND_ITENS.every(it => hasValue(e?.itens?.[it.key]))),
  ],
  reuniao_stand: [
    'data',
    'hora_inicio',
    'hora_termino',
    'empreendimento',
    'resultados_dia',
    'pendencias_operacionais',
    'acoes_comerciais',
    'demandas_marketing',
    'necessidades_stand',
    'observacoes',
    { list: 'participantes', fields: ['nome', 'cargo'] },
  ],
  relatorio_geral_emp: [
    'periodo_analisado',
    'destaques_positivos',
    'principais_dificuldades',
    'necessidade_apoio',
    { list: 'resultados', fields: ['empreendimento', 'leads', 'visitas', 'pastas', 'propostas', 'vendas'] },
    { list: 'plano_acao', fields: ['acao', 'responsavel', 'prazo'] },
  ],
  analise_concorrencia: [
    'construtora',
    'empreendimento',
    'cidade_bairro',
    'comissao_imobiliaria',
    'premiacao_imobiliaria',
    'premiacao_corretor',
    'condicoes_comerciais',
    'entrada_minima',
    'subsidio',
    'campanhas_vigentes',
    'tipologia',
    'metragem',
    'faixa_preco',
    'diferenciais',
    'acoes_observadas',
    'midias_utilizadas',
    'eventos_promotores',
    'vantagens_concorrente',
    'fragilidades_concorrente',
    'impacto_empreendimento',
  ],
  relatorio_mensal_emp: [
    'empreendimento',
    'mes_referencia',
    'leads',
    'visitas',
    'pastas',
    'propostas',
    'vendas',
    'principal_conquista',
    'principal_dificuldade',
    'acoes_realizadas',
    'acoes_nao_concluidas',
    'houve_movimentacao',
    'necessidade_marketing',
    'necessidade_comercial',
    'necessidade_estrutura',
    'necessidade_estoque',
    'necessidade_precificacao',
    { list: 'plano_acao', fields: ['acao', 'responsavel', 'prazo'] },
  ],

  funil_vendas: [
    'periodo_analisado',
    'leads_recebidos',
    'leads_contatados',
    'agendamentos',
    'visitas',
    'pastas',
    'propostas',
    'vendas',
    'etapa_perda',
    'motivo_perdas',
    'acao_corretiva',
    'responsavel_acao',
  ],
  performance_corretores: [
    'data_reuniao',
    'indicadores_apresentados',
    'pontos_discutidos',
    'dificuldades',
    'acoes_definidas',
    'responsaveis_acoes',
    'proximo_acompanhamento',
    { list: 'participantes', fields: ['nome', 'cargo'] },
  ],
  alinhamento_individual: [
    'corretor',
    'meta_periodo',
    'resultado_atual',
    'qtd_atendimentos',
    'qtd_propostas',
    'qtd_vendas',
    'dificuldades',
    'necessidade_apoio',
    (form) => form?.necessidade_apoio !== 'Sim' || hasValue(form?.tipo_apoio),
    'acao_definida',
    'responsavel',
    'proximo_acompanhamento',
  ],
  treinamento_time: [
    'data_treinamento',
    'tema',
    'instrutor',
    'participantes',
    'houve_avaliacao',
    (form) => form?.houve_avaliacao !== 'Sim' || hasValue(form?.nota_media),
    'dificuldades',
    'necessidade_reforco',
    'proximo_tema',
    'material_apresentado',
  ],
  monitoramento_rotinas: [
    'periodo_analisado',
    'escala_cumprida',
    (form) => form?.escala_cumprida !== 'Não' || (hasValue(form?.corretores_ausentes) && hasValue(form?.motivo_ausencias)),
    'houve_agendas_externas',
    (form) => form?.houve_agendas_externas !== 'Sim' || (hasValue(form?.tipo_agenda) && hasValue(form?.objetivo_agenda)),
    'desvios_identificados',
    'acao_corretiva',
  ],
  resultado_geral_time: [
    'periodo_analisado',
    'leads_recebidos',
    'visitas',
    'pastas',
    'propostas',
    'vendas',
    'corretor_destaque',
    'melhor_resultado',
    'principal_desafio',
    'acoes_melhoria',
    'responsaveis',
    'meta_proximo',
  ],
};

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export function validateRequiredReport(reportType, form) {
  const rules = REQUIRED_FIELDS[reportType];
  if (!rules) return true;

  return rules.every(rule => {
    if (typeof rule === 'function') return rule(form);
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

    case 'checklist_stand':
      return {
        data_execucao: new Date().toISOString().split('T')[0],
        responsavel: '',
        empreendimentos: [emptyChecklistEmpreendimento()],
        nao_conformidades: [],
      };

    case 'reuniao_stand':
      return {
        data: new Date().toISOString().split('T')[0],
        hora_inicio: '',
        hora_termino: '',
        empreendimento: '',
        participantes: [{ nome: '', cargo: '' }],
        resultados_dia: '',
        pendencias_operacionais: '',
        acoes_comerciais: '',
        demandas_marketing: '',
        necessidades_stand: '',
        plano_acao: [],
        observacoes: '',
      };

    case 'relatorio_geral_emp':
      return {
        periodo_analisado: '',
        resultados: [{ empreendimento: '', leads: '', visitas: '', pastas: '', propostas: '', vendas: '' }],
        destaques_positivos: '',
        principais_dificuldades: '',
        necessidade_apoio: '',
        plano_acao: [{ acao: '', responsavel: '', prazo: '' }],
      };

    case 'analise_concorrencia':
      return {
        construtora: '', empreendimento: '', cidade_bairro: '',
        comissao_imobiliaria: '', premiacao_imobiliaria: '', premiacao_corretor: '',
        condicoes_comerciais: '', entrada_minima: '', subsidio: '', campanhas_vigentes: '',
        tipologia: '', metragem: '', faixa_preco: '', diferenciais: '',
        acoes_observadas: '', midias_utilizadas: '', eventos_promotores: '',
        vantagens_concorrente: '', fragilidades_concorrente: '', impacto_empreendimento: '',
        acoes_recomendadas: [],
      };

    case 'relatorio_mensal_emp':
      return {
        empreendimento: '', mes_referencia: '',
        leads: '', visitas: '', pastas: '', propostas: '', vendas: '',
        principal_conquista: '', principal_dificuldade: '',
        acoes_realizadas: '', acoes_nao_concluidas: '',
        houve_movimentacao: '', descricao_concorrencia: '',
        necessidade_marketing: '', necessidade_comercial: '', necessidade_estrutura: '',
        necessidade_estoque: '', necessidade_precificacao: '',
        plano_acao: [{ acao: '', responsavel: '', prazo: '' }],
      };

    case 'funil_vendas':
      return {
        periodo_analisado: '',
        leads_recebidos: '', leads_contatados: '', agendamentos: '', visitas: '',
        pastas: '', propostas: '', vendas: '',
        etapa_perda: '', motivo_perdas: '', acao_corretiva: '', responsavel_acao: '',
      };

    case 'performance_corretores':
      return {
        data_reuniao: new Date().toISOString().split('T')[0],
        participantes: [{ nome: '', cargo: '' }],
        indicadores_apresentados: '',
        pontos_discutidos: '',
        dificuldades: '',
        acoes_definidas: '',
        responsaveis_acoes: '',
        proximo_acompanhamento: '',
      };

    case 'alinhamento_individual':
      return {
        corretor: '', meta_periodo: '', resultado_atual: '',
        qtd_atendimentos: '', qtd_propostas: '', qtd_vendas: '',
        dificuldades: '', necessidade_apoio: '', tipo_apoio: '',
        acao_definida: '', responsavel: '', proximo_acompanhamento: '',
      };

    case 'treinamento_time':
      return {
        data_treinamento: new Date().toISOString().split('T')[0],
        tema: '', instrutor: '',
        participantes: '', corretores_ausentes: '',
        houve_avaliacao: '', nota_media: '',
        dificuldades: '', necessidade_reforco: '', proximo_tema: '',
        material_apresentado: '', fotos: '',
      };

    case 'monitoramento_rotinas':
      return {
        periodo_analisado: '',
        escala_cumprida: '', corretores_ausentes: '', motivo_ausencias: '',
        houve_agendas_externas: '', tipo_agenda: '', objetivo_agenda: '',
        desvios_identificados: '', acao_corretiva: '',
      };

    case 'resultado_geral_time':
      return {
        periodo_analisado: '',
        leads_recebidos: '', visitas: '', pastas: '', propostas: '', vendas: '',
        corretor_destaque: '', melhor_resultado: '', principal_desafio: '',
        acoes_melhoria: '', responsaveis: '', meta_proximo: '',
      };

    default:
      return null; // will use legacy form
  }
}
