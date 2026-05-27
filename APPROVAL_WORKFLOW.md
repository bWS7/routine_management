# Fluxo de Aprovação de Atividades - Resumo de Implementação

## 📋 Visão Geral

Foi implementado um **fluxo completo de aprovação de atividades** similar a uma esteira de validação. Agora, quando um GERENTE, SUPERVISOR ou COORDENADOR conclui uma tarefa, a barra de porcentagem sobe normalmente, mas a tarefa só é considerada **realmente concluída** após aprovação do SUPERINTENDENTE da regional.

---

## 🗄️ Alterações no Banco de Dados

### Campos Adicionados na Tabela `rotinas`:
- `status_aprovacao` (String, default='pendente') - Status: pendente, aprovada, reprovada
- `aprovador_id` (Integer, FK) - ID do aprovador
- `data_aprovacao` (DateTime) - Data/hora da aprovação/reprovação
- `motivo_reprovacao` (Text) - Motivo da reprovação (opcional)

### Nova Tabela `aprovacoes_rotinas`:
```sql
- id (Integer, PK)
- rotina_id (Integer, FK)
- aprovador_id (Integer, FK)
- acao (String) - 'aprovada' ou 'reprovada'
- motivo (Text)
- criado_em (DateTime)
```

### Como Gerar as Migrations:
```bash
# Na raiz do projeto
flask db migrate -m "Adicionar fluxo de aprovacao de atividades"
flask db upgrade
```

---

## 🔐 Validações Implementadas

### Superintendente Obrigatório
- Ao criar um usuário com perfil SUPERINTENDENTE, o campo "Supervisor Responsável" agora é **obrigatório**
- Isso garante que as atividades do superintendente possam ser aprovadas por alguém

### Controle de Acesso
- Apenas **Admin** e **Superintendente** podem aprovar/reprovar atividades
- Um Superintendente só pode aprovar/reprovar atividades de sua própria regional
- As próprias atividades do Superintendente são aprovadas por seu Supervisor

---

## 🔌 Novos Endpoints Backend

### 1. Aprovar Atividade
```
POST /api/rotinas/<id>/aprovar
Body: { "motivo": "" }
Response: Rotina atualizada com status_aprovacao='aprovada'
```

### 2. Reprovar Atividade
```
POST /api/rotinas/<id>/reprovar
Body: { "motivo": "Razão obrigatória" }
Response: Rotina atualizada com status_aprovacao='reprovada'
```

### 3. Listar Atividades para Aprovação
```
GET /api/rotinas/para-aprovar
Response: Lista de atividades pendentes de aprovação
- Admin vê todas
- Superintendente vê: atividades de sua regional + suas próprias (para o supervisor)
```

### 4. Listar Histórico de Aprovações
```
GET /api/rotinas/<id>/aprovacoes
Response: Histórico completo de aprovações/reprovações
```

---

## 🎨 Mudanças no Frontend

### 1. Card de Atividades Atualizado
- **Status Pendente**: Ícone de triângulo amarelo com "!" indicando "Aguardando Aprovação"
- **Status Aprovada**: Ícone de checkmark verde indicando "Aprovada"
- **Status Reprovada**: Ícone de "X" vermelho indicando "Reprovada"
- Badge visual mostrando o status de aprovação

### 2. Modal de Atividades
- Exibe informações de aprovação (status, data, aprovador, motivo)
- Mostra o motivo da reprovação se aplicável

### 3. Nova Página: Aprovações
- **Rota**: `GET /pendencias_aprovacao`
- **Acesso**: Admin e Superintendente
- **Funcionalidades**:
  - Dashboard com estatísticas (Pendentes, Aprovadas, Reprovadas)
  - Lista de atividades aguardando aprovação
  - Modal para aprovar/reprovar com campos apropriados
  - Visualização de atividades já processadas

### 4. Atualização da Navegação
- Novo menu "Aprovações" na sidebar (visível apenas para Admin e Superintendente)
- Acessível ao lado de "Pendências"

---

## 📊 Fluxo de Funcionamento

### Ciclo de Vida da Atividade com Aprovação

```
1. CRIAÇÃO
   └─ Atividade criada com status='nao_iniciada'
   └─ status_aprovacao=null

2. EXECUÇÃO
   └─ User marca como 'concluida'
   └─ status_aprovacao automaticamente definido como 'pendente'
   └─ Aguarda aprovação do superintendente

3. APROVAÇÃO
   ┌─ Superintendente visualiza no menu "Aprovações"
   ├─ OPÇÃO A: APROVAR
   │  └─ status_aprovacao='aprovada'
   │  └─ data_aprovacao é preenchida
   │  └─ Atividade contada oficialmente como concluída
   │
   └─ OPÇÃO B: REPROVAR
      └─ status_aprovacao='reprovada'
      └─ motivo_reprovacao é preenchido
      └─ Atividade NÃO é contada como concluída
      └─ User pode tentar novamente
```

### Para Superintendentes
- Suas próprias atividades precisam ser aprovadas por seu **Supervisor Responsável**
- O sistema identifica automaticamente quem pode aprovar cada atividade

---

## 📈 Lógica de Cálculo de Aderência

**Importante**: A métrica de aderência (%) agora considera **apenas atividades aprovadas**:

- ✅ Atividade concluída + aprovada = Conta
- ❌ Atividade concluída + reprovada = Não conta
- ⏳ Atividade concluída + aguardando = Não conta

---

## 📝 Histórico e Auditoria

### Registro Automático
Cada aprovação/reprovação é registrada em:
1. **Tabela `aprovacoes_rotinas`** - Histórico detalhado
2. **Tabela `historico_rotinas`** - Timeline da atividade
3. **Tabela `audit_logs`** - Log de auditoria completo

Cada registro inclui:
- Quem aprovou/reprovou
- Data e hora exata
- Motivo da aprovação/reprovação
- Todas as mudanças de estado

---

## 🚀 Próximos Passos para Deploy

### 1. Aplicar Migrations
```bash
flask db upgrade
```

### 2. Rebuild do Frontend (se necessário)
```bash
cd frontend-src
npm run build
```

### 3. Testar o Fluxo
- [ ] Criar um Superintendente com Supervisor
- [ ] Criar atividades para um usuário comum
- [ ] Marcar como concluída (deve ficar em "Aguardando Aprovação")
- [ ] Superintendente acessa menu "Aprovações"
- [ ] Testar aprovação e reprovação
- [ ] Verificar cálculo de aderência

---

## 📚 Arquivos Modificados

### Backend
- `backend/models.py` - Campos adicionados ao Rotina e novo modelo AprovacaoRotina
- `backend/routes/rotinas.py` - Endpoints de aprovação/reprovação
- `backend/routes/usuarios.py` - Validação de supervisor obrigatório para SR

### Frontend
- `frontend-src/src/pages/RotinasPage.jsx` - Novos ícones e status de aprovação no card
- `frontend-src/src/pages/PendenciasAprovacaoPage.jsx` - NOVO: Página de aprovações
- `frontend-src/src/App.jsx` - Registro de nova página
- `frontend-src/src/components/layout/Sidebar.jsx` - Link do menu "Aprovações"

### Documentação
- `MIGRATION_INSTRUCTIONS.md` - Instruções de migration
- `APPROVAL_WORKFLOW.md` - Este documento

---

## 🔍 Testes Recomendados

### Testes Unitários
- [ ] Validar que SR requer supervisor
- [ ] Validar que apenas Admin/SR podem aprovar
- [ ] Validar que status_aprovacao='pendente' ao concluir

### Testes de Integração
- [ ] Fluxo completo: concluir → aprovar → aderência atualiza
- [ ] Fluxo de reprovação: concluir → reprovar → aderência não muda
- [ ] Supervisor aprova atividades de seu SR

### Testes de UI
- [ ] Ícones aparecem corretamente nos cards
- [ ] Modal de aprovação funciona
- [ ] Estatísticas do dashboard atualizam

---

## 💡 Notas Importantes

1. **Compatibilidade com Aderência**: O percentual de execução agora considera apenas atividades aprovadas
2. **Histórico**: Todo o histórico de aprovações é mantido para auditoria
3. **Permissões**: A validação de acesso é feita em ambos backend e frontend
4. **Performance**: Endpoints são otimizados com joins SQL apropriados

---

## 📞 Suporte

Para dúvidas sobre a implementação ou problemas:
1. Verifique se as migrations foram aplicadas com `flask db current`
2. Confirme que superintendentes têm um supervisor designado
3. Revise os logs de auditoria para rastrear alterações
