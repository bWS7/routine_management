# Instruções de Migration para Fluxo de Aprovação de Atividades

## Mudanças no Banco de Dados

O fluxo de aprovação de atividades adiciona os seguintes campos e tabelas:

### 1. Alterações na tabela `rotinas`:
- `status_aprovacao` (String, default='pendente') - Status da aprovação: pendente, aprovada, reprovada
- `aprovador_id` (Integer, FK para usuarios.id) - ID do usuário que aprovou/reprovou
- `data_aprovacao` (DateTime) - Data/hora da aprovação ou reprovação  
- `motivo_reprovacao` (Text) - Motivo da reprovação (opcional)

### 2. Nova tabela `aprovacoes_rotinas`:
```
- id (Integer, PK)
- rotina_id (Integer, FK para rotinas.id)
- aprovador_id (Integer, FK para usuarios.id)
- acao (String) - 'aprovada' ou 'reprovada'
- motivo (Text) - Motivo/observação da aprovação ou reprovação
- criado_em (DateTime)
```

## Como Gerar as Migrations

O projeto usa Flask-Migrate (Alembic). Para gerar as migrations automaticamente a partir das mudanças no modelo:

1. Certifique-se de estar na raiz do projeto
2. Execute o comando:
```bash
flask db migrate -m "Adicionar fluxo de aprovacao de atividades"
```

3. Revise o arquivo de migration gerado em `migrations/versions/`
4. Aplique a migration ao banco de dados:
```bash
flask db upgrade
```

## Em Ambiente Railway/Docker

Se você está usando Railway ou Docker:

1. A migration será aplicada automaticamente durante o deploy se configurado corretamente
2. Você pode executar manualmente dentro do container:
```bash
docker exec <container_id> flask db upgrade
```

## Verificar Status das Migrations

Para verificar o status das migrations:
```bash
flask db current
flask db history
```

## Rollback de Migration (se necessário)

Para desfazer uma migration:
```bash
flask db downgrade
```

## Notas Importantes

- As mudanças nos modelos já foram implementadas em `backend/models.py`
- O campo `status_aprovacao` nas atividades criadas terá valor default 'pendente'
- Quando uma atividade for marcada como concluída, o `status_aprovacao` será automaticamente definido como 'pendente'
- As atividades só serão consideradas oficialmente concluídas após aprovação do superintendente
