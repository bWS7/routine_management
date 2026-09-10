PERFIS_USUARIO = {'admin', 'sr', 'gv', 'cd', 'sp'}
PERFIS_ATIVIDADE = {'sr', 'gv', 'cd', 'sp'}

# Perfis que podem ser combinados (até 3 por usuário). Administrador e
# Superintendente são sempre perfil ÚNICO e nunca entram em combinação.
PERFIS_COMBINAVEIS = {'gv', 'cd', 'sp'}

# ── Perfis híbridos (funções acumuladas) ────────────────────────────────────
# Quando o usuário tem UMA única função, o catálogo de atividades do perfil
# continua igual. Quando ACUMULA 2 ou mais funções combináveis, a lista de
# atividades NÃO é a união dos catálogos — é a lista curada abaixo, definida na
# planilha "Revisão atividades da plataforma - perfis hibridos".
#
# Chave: tupla dos perfis ORDENADA alfabeticamente (o lookup independe da ordem
# em que o admin cadastrou os perfis). Valor: nomes canônicos das atividades, já
# na ordem de exibição desejada.
ATIVIDADES_PERFIL_HIBRIDO = {
    ('cd', 'gv'): [
        'Checklist de Abertura do Stand',
        'Relatório Geral do Empreendimento',
        'Análise de Concorrência',
        'Reunião de Performance com Corretores',
        'Alinhamento individual com Corretores (1:1)',
        'Treinamento Semanal do Time',
        'Monitoramento de Rotinas da Equipe',
        'Análise do Resultado Geral do Time',
    ],
    ('gv', 'sp'): [
        'Reunião de Performance com Corretores',
        'Alinhamento individual com Corretores (1:1)',
        'Treinamento Semanal do Time',
        'Monitoramento de Rotinas da Equipe',
        'Análise do Resultado Geral do Time',
        'Relatório do Canal Parcerias',
        'Rotina de Visita a Parceiros',
        'Análise da Carteira de Parceiros',
        'Treinamento e Alinhamento com Parceiros',
    ],
    ('cd', 'sp'): [
        'Checklist de Abertura do Stand',
        'Relatório Geral do Empreendimento',
        'Análise de Concorrência',
        'Relatório Mensal do Empreendimento',
        'Relatório do Canal Parcerias',
        'Rotina de Visita a Parceiros',
        'Análise da Carteira de Parceiros',
        'Treinamento e Alinhamento com Parceiros',
    ],
    ('cd', 'gv', 'sp'): [
        'Checklist de Abertura do Stand',
        'Relatório Geral do Empreendimento',
        'Análise de Concorrência',
        'Reunião de Performance com Corretores',
        'Alinhamento individual com Corretores (1:1)',
        'Treinamento Semanal do Time',
        'Análise do Resultado Geral do Time',
        'Relatório do Canal Parcerias',
        'Rotina de Visita a Parceiros',
        'Análise da Carteira de Parceiros',
        'Treinamento e Alinhamento com Parceiros',
    ],
}


def chave_perfil_hibrido(perfis):
    """Retorna a chave de ATIVIDADES_PERFIL_HIBRIDO para uma lista de perfis
    (tupla ordenada só com os perfis combináveis), ou None quando não há função
    acumulada — 0 ou 1 perfil combinável."""
    combinaveis = tuple(sorted({p for p in (perfis or []) if p in PERFIS_COMBINAVEIS}))
    return combinaveis if len(combinaveis) >= 2 else None


def nomes_atividades_perfil_hibrido(perfis):
    """Nomes das atividades curadas para a combinação de perfis do usuário, ou
    None quando a regra não se aplica (função única, ou combinação sem lista
    específica cadastrada). Nesse caso o chamador mantém o comportamento padrão
    de união dos catálogos por perfil."""
    chave = chave_perfil_hibrido(perfis)
    if chave is None:
        return None
    return ATIVIDADES_PERFIL_HIBRIDO.get(chave)

# Atividades que NÃO passam pelo fluxo de aprovação do Superintendente: ao serem
# concluídas pelo responsável, já são consideradas finalizadas (aprovadas
# automaticamente). Comparação por nome normalizado (sem acentos, minúsculo).
ATIVIDADES_SEM_APROVACAO = {
    'checklist de abertura do stand',
}


def normalizar_nome_atividade(nome):
    """Normaliza o nome da atividade para comparação: minúsculo, sem acentos e
    sem espaços nas pontas."""
    import unicodedata
    if not nome:
        return ''
    texto = unicodedata.normalize('NFKD', nome)
    texto = ''.join(c for c in texto if not unicodedata.combining(c))
    return texto.strip().lower()


def atividade_requer_aprovacao(nome):
    """Retorna False se a atividade for isenta do fluxo de aprovação."""
    return normalizar_nome_atividade(nome) not in ATIVIDADES_SEM_APROVACAO

PERFIL_LABELS = {
    'admin': 'Administrador',
    'sr': 'Superintendente',
    'gv': 'Gerente de Vendas',
    'cd': 'Coordenador de Produto',
    'sp': 'Supervisor de Parceria',
}
