PERFIS_USUARIO = {'admin', 'sr', 'gv', 'cd', 'sp'}
PERFIS_ATIVIDADE = {'sr', 'gv', 'cd', 'sp'}

# Perfis que podem ser combinados (até 3 por usuário). Administrador e
# Superintendente são sempre perfil ÚNICO e nunca entram em combinação.
PERFIS_COMBINAVEIS = {'gv', 'cd', 'sp'}

PERFIL_LABELS = {
    'admin': 'Administrador',
    'sr': 'Superintendente',
    'gv': 'Gerente de Vendas',
    'cd': 'Coordenador de Produto',
    'sp': 'Supervisor de Parceria',
}
