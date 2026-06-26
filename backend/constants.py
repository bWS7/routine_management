PERFIS_USUARIO = {'admin', 'sr', 'gv', 'cd', 'sp'}
PERFIS_ATIVIDADE = {'sr', 'gv', 'cd', 'sp'}

# Perfis que podem ser combinados (até 3 por usuário). Administrador e
# Superintendente são sempre perfil ÚNICO e nunca entram em combinação.
PERFIS_COMBINAVEIS = {'gv', 'cd', 'sp'}

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
