"""Teste automatizado ponta a ponta da regra de perfis híbridos — sem depender
de alguém logar manualmente no ambiente de teste.

Diferença para test_rotinas_generation.py: aqui não se chama
ensure_rotinas_mes/ensure_rotinas_atuais diretamente — passa pelo mesmo
caminho que o navegador usaria (POST /api/auth/login com a senha real, depois
GET /api/rotinas/ com o token), exercitando login, JWT, visibilidade e a
geração automática embutida no próprio endpoint de listagem (ver
listar() em backend/routes/rotinas.py, que chama ensure_rotinas_atuais)."""
from freezegun import freeze_time

from backend.extensions import db
from backend.tests.test_rotinas_generation import _semear_catalogo_completo, CATALOGO_GV, CATALOGO_SP


def _login(client, email, senha='teste123'):
    r = client.post('/api/auth/login', json={'email': email, 'senha': senha})
    assert r.status_code == 200, r.get_json()
    return r.get_json()['token']


def _nomes_das_rotinas(client, token):
    r = client.get('/api/rotinas/?periodo=todas', headers={'Authorization': f'Bearer {token}'})
    assert r.status_code == 200, r.get_json()
    itens = r.get_json()
    return {item['atividade_nome'] for item in itens}, itens


def test_login_real_e_gv_cd_recebe_lista_curada_via_http(app, client, factory):
    regional = factory.regional()
    _semear_catalogo_completo(factory)
    usuario = factory.usuario('Híbrido GC', 'hibrido.gc@teste.com', 'gv', regional_id=regional.id)
    usuario.set_perfis(['gv', 'cd'])
    db.session.commit()

    with freeze_time('2026-07-15 12:00:00'):
        token = _login(client, 'hibrido.gc@teste.com')
        nomes, itens = _nomes_das_rotinas(client, token)

    esperado = {
        'Checklist de Abertura do Stand',
        'Relatório Geral do Empreendimento',
        'Análise de Concorrência',
        'Reunião de Performance com Corretores',
        'Alinhamento individual com Corretores (1:1)',
        'Treinamento Semanal do Time',
        'Monitoramento de Rotinas da Equipe',
        'Análise do Resultado Geral do Time',
    }
    assert nomes == esperado, f'diferença: {nomes.symmetric_difference(esperado)}'
    assert len(itens) == 8  # não 14 (união dos dois catálogos)
    # nenhuma atividade exclusiva de função única vazou pro híbrido
    assert 'Painel do Funil de Vendas' not in nomes
    assert 'Reunião Rápida do Stand' not in nomes
    # cada atividade retornada de fato pertence ao usuário logado
    assert all(item['usuario_id'] == usuario.id for item in itens)


def test_login_real_e_trio_recebe_11_atividades_via_http(app, client, factory):
    regional = factory.regional()
    _semear_catalogo_completo(factory)
    usuario = factory.usuario('Híbrido Trio', 'hibrido.trio@teste.com', 'gv', regional_id=regional.id)
    usuario.set_perfis(['gv', 'cd', 'sp'])
    db.session.commit()

    with freeze_time('2026-07-15 12:00:00'):
        token = _login(client, 'hibrido.trio@teste.com')
        nomes, itens = _nomes_das_rotinas(client, token)

    assert len(itens) == 11
    assert 'Monitoramento de Rotinas da Equipe' not in nomes
    assert 'Relatório Mensal do Empreendimento' not in nomes


def test_login_real_e_funcao_unica_nao_muda_via_http(app, client, factory):
    regional = factory.regional()
    _semear_catalogo_completo(factory)
    usuario = factory.usuario('Gerente Solo', 'gerente.solo@teste.com', 'gv', regional_id=regional.id)
    db.session.commit()

    with freeze_time('2026-07-15 12:00:00'):
        token = _login(client, 'gerente.solo@teste.com')
        nomes, itens = _nomes_das_rotinas(client, token)

    assert len(itens) == len(CATALOGO_GV)
    assert 'Painel do Funil de Vendas' in nomes
    assert 'Controle da Meta Individual' in nomes


def test_login_com_senha_errada_e_recusado(app, client, factory):
    regional = factory.regional()
    factory.usuario('Qualquer', 'qualquer@teste.com', 'gv', regional_id=regional.id)

    r = client.post('/api/auth/login', json={'email': 'qualquer@teste.com', 'senha': 'senha-errada'})
    assert r.status_code == 401


# ── Reprodução do bug relatado: "as atividades não estão mudando" ──────────
# Rotina é gerada de forma só-aditiva (ensure_rotinas_atuais/ensure_rotinas_mes
# nunca apagam nada) — então, sem poda, um usuário que teve os perfis
# reduzidos/trocados continuava vendo as atividades da composição ANTERIOR
# pra sempre, porque a rotina já tinha sido criada uma vez. Os testes abaixo
# cobrem a poda (podar_rotinas_fora_do_catalogo em rotinas.py).

def test_reducao_de_perfil_remove_atividades_orfas_do_periodo_vigente(app, client, factory):
    regional = factory.regional()
    _semear_catalogo_completo(factory)
    factory.usuario('Admin', 'admin.reducao@teste.com', 'admin', regional_id=regional.id)
    usuario = factory.usuario('Vira Perfil', 'vira.perfil@teste.com', 'gv', regional_id=regional.id)
    usuario.set_perfis(['gv', 'cd', 'sp'])  # começa como trio
    db.session.commit()

    with freeze_time('2026-07-15 12:00:00'):
        token_user = _login(client, 'vira.perfil@teste.com')
        _, itens_antes = _nomes_das_rotinas(client, token_user)
        assert len(itens_antes) == 11  # trio, confirma o estado inicial

        # Admin reduz o usuário para perfil único (Supervisor) — simula
        # exatamente o que foi relatado: editar o perfil na tela de Usuários.
        token_admin = _login(client, 'admin.reducao@teste.com')
        r = client.put(
            f'/api/usuarios/{usuario.id}',
            headers={'Authorization': f'Bearer {token_admin}'},
            json={'perfis': ['sp']},
        )
        assert r.status_code == 200

        nomes_depois, itens_depois = _nomes_das_rotinas(client, token_user)

    # as atividades de gv/cd que sobraram do trio não ficam grudadas — some
    # exatamente pro catálogo de sp sozinho, nem mais nem menos
    assert nomes_depois == {nome for nome, _ in CATALOGO_SP}
    assert len(itens_depois) == len(CATALOGO_SP)


def test_rotina_ja_preenchida_sobrevive_a_mudanca_de_perfil(app, client, factory):
    """A poda nunca apaga o que o usuário já tocou (comentário, evidência,
    status, delegação) — mesmo que a atividade não pertença mais ao perfil
    atual. Histórico de preenchimento não pode sumir numa reorganização de
    equipe."""
    regional = factory.regional()
    _semear_catalogo_completo(factory)
    factory.usuario('Admin2', 'admin.preenchida@teste.com', 'admin', regional_id=regional.id)
    usuario = factory.usuario('Vira Perfil 2', 'vira.perfil2@teste.com', 'gv', regional_id=regional.id)
    usuario.set_perfis(['gv', 'cd'])
    db.session.commit()

    with freeze_time('2026-07-15 12:00:00'):
        token_user = _login(client, 'vira.perfil2@teste.com')
        _, itens = _nomes_das_rotinas(client, token_user)
        alvo = next(i for i in itens if i['atividade_nome'] == 'Reunião de Performance com Corretores')

        # usuário salva um comentário (grava histórico) sem concluir a atividade
        r = client.put(
            f"/api/rotinas/{alvo['id']}",
            headers={'Authorization': f'Bearer {token_user}'},
            json={'comentario': 'em andamento'},
        )
        assert r.status_code == 200

        # admin reduz pra Coordenador sozinho — "Reunião de Performance com
        # Corretores" (gv) não existe no catálogo do cd puro
        token_admin = _login(client, 'admin.preenchida@teste.com')
        client.put(
            f'/api/usuarios/{usuario.id}',
            headers={'Authorization': f'Bearer {token_admin}'},
            json={'perfis': ['cd']},
        )

        nomes_depois, itens_depois = _nomes_das_rotinas(client, token_user)

    assert any(i['id'] == alvo['id'] for i in itens_depois)
    assert 'Reunião de Performance com Corretores' in nomes_depois


def test_periodo_ja_fechado_nunca_e_podado(app, client, factory):
    """Período que já passou é histórico — a poda só age no vigente/futuro,
    mesmo que a atividade não pertença mais ao perfil atual e nunca tenha
    sido preenchida (marcada 'não realizada' automaticamente)."""
    from datetime import date
    from backend.models import Rotina, AtividadeCatalogo

    regional = factory.regional()
    _semear_catalogo_completo(factory)
    factory.usuario('Admin3', 'admin.fechado@teste.com', 'admin', regional_id=regional.id)
    usuario = factory.usuario('Vira Perfil 3', 'vira.perfil3@teste.com', 'gv', regional_id=regional.id)
    usuario.set_perfis(['gv', 'cd'])
    db.session.commit()

    atividade_gv = AtividadeCatalogo.query.filter_by(
        perfil='gv', nome='Reunião de Performance com Corretores'
    ).first()
    rotina_passada = Rotina(
        usuario_id=usuario.id, atividade_id=atividade_gv.id,
        periodo_inicio=date(2026, 7, 1), periodo_fim=date(2026, 7, 7),
        periodicidade='semanal', status='nao_iniciada',
    )
    db.session.add(rotina_passada)
    db.session.commit()
    rotina_id = rotina_passada.id

    with freeze_time('2026-07-15 12:00:00'):
        token_user = _login(client, 'vira.perfil3@teste.com')
        token_admin = _login(client, 'admin.fechado@teste.com')
        client.put(
            f'/api/usuarios/{usuario.id}',
            headers={'Authorization': f'Bearer {token_admin}'},
            json={'perfis': ['cd']},
        )
        client.get('/api/rotinas/?periodo=todas', headers={'Authorization': f'Bearer {token_user}'})

    assert Rotina.query.get(rotina_id) is not None
