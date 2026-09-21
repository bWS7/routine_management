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
from backend.tests.test_rotinas_generation import _semear_catalogo_completo, CATALOGO_GV


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
