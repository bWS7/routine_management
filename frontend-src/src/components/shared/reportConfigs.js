/**
 * Mapeamento de atividades do catálogo → tipo de relatório personalizado.
 * Cada atividade que não tiver mapeamento aqui usará o relatório padrão.
 */

// Identifica o tipo de relatório pela substring do nome da atividade
export function getReportType(atividadeNome) {
  if (!atividadeNome) return 'padrao';
  const nome = atividadeNome.toLowerCase();

  // 1. Reunião de Performance com Liderados
  if (nome.includes('reunião de performance') || nome.includes('reunião coletiva'))
    return 'reuniao_performance';

  // 2. Resultado Semanal da Regional
  if (nome.includes('diagnóstico semanal'))
    return 'resultado_semanal';

  // 3. Decisões de Canal
  if (nome.includes('decisões de canal'))
    return 'decisoes_canal';

  // 4. Análise dos Riscos da Regional
  if (nome.includes('riscos') && nome.includes('contramedidas'))
    return 'analise_riscos';

  // 5. Acompanhamento e Desenvolvimento dos Liderados
  if (nome.includes('1:1 com gerentes') || nome.includes('1:1 com corretores') ||
      nome.includes('ciclo quinzenal') || nome.includes('controle da meta individual'))
    return 'acompanhamento_liderados';

  // 6. Comitê Mensal de Resultados
  if (nome.includes('comitê mensal') || nome.includes('revisão mensal'))
    return 'comite_mensal';

  return 'padrao';
}

export const REPORT_TITLES = {
  reuniao_performance: 'Reunião de Performance com Liderados',
  resultado_semanal: 'Resultado Semanal da Regional',
  decisoes_canal: 'Decisões de Canal',
  analise_riscos: 'Análise dos Riscos da Regional',
  acompanhamento_liderados: 'Acompanhamento e Desenvolvimento dos Liderados',
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
