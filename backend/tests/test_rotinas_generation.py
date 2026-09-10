"""Geração automática de rotinas — garante que o Checklist Diário (e as demais
periodicidades) seja gerado para todos os dias do mês, de forma idempotente."""
from datetime import date, timedelta

from freezegun import freeze_time

from backend.extensions import db
from backend.models import Rotina, AtividadeCatalogo
from backend.routes.rotinas import ensure_rotinas_atuais, ensure_rotinas_mes


def test_ensure_rotinas_mes_gera_todos_os_dias_do_mes_para_atividade_diaria(app, factory):
    regional = factory.regional()
    usuario = factory.usuario('Coordenador', 'coord@teste.com', 'cd', regional_id=regional.id)
    factory.atividade('Checklist Diário', 'diaria', 'cd', obrigatoria=True)

    with freeze_time('2026-07-15 12:00:00'):
        criadas = ensure_rotinas_mes(usuario, date(2026, 7, 15))

    assert criadas == 31  # julho tem 31 dias
    dias = {r.periodo_inicio for r in Rotina.query.filter_by(usuario_id=usuario.id, periodicidade='diaria').all()}
    assert dias == {date(2026, 7, d) for d in range(1, 32)}


def test_ensure_rotinas_mes_e_idempotente(app, factory):
    regional = factory.regional()
    usuario = factory.usuario('Coordenador', 'coord@teste.com', 'cd', regional_id=regional.id)
    factory.atividade('Checklist Diário', 'diaria', 'cd', obrigatoria=True)

    with freeze_time('2026-07-15 12:00:00'):
        primeira = ensure_rotinas_mes(usuario, date(2026, 7, 15))
        segunda = ensure_rotinas_mes(usuario, date(2026, 7, 15))

    assert primeira == 31
    assert segunda == 0  # nada duplicado
    assert Rotina.query.filter_by(usuario_id=usuario.id, periodicidade='diaria').count() == 31


def test_ensure_rotinas_atuais_gera_checklist_do_dia_corrente(app, factory):
    regional = factory.regional()
    usuario = factory.usuario('Coordenador', 'coord@teste.com', 'cd', regional_id=regional.id)
    factory.atividade('Checklist Diário', 'diaria', 'cd', obrigatoria=True)

    # Mesmo às 21h30 de Brasília (00h30 UTC do dia seguinte), o checklist
    # gerado precisa ser o do dia ainda corrente em Brasília — não o de amanhã.
    with freeze_time('2026-07-30 00:30:00'):
        ensure_rotinas_atuais(usuario)

    rotinas = Rotina.query.filter_by(usuario_id=usuario.id, periodicidade='diaria').all()
    assert len(rotinas) == 1
    assert rotinas[0].periodo_inicio == date(2026, 7, 29)


def test_checklist_gerado_para_um_dia_nao_desaparece_no_dia_seguinte(app, factory):
    """Cenário relatado: "um dia aparece, no dia seguinte não é gerado". Gera o
    mês inteiro uma vez (como ensure_rotinas_mes faz ao abrir Minhas Rotinas) e
    confirma que cada dia individual continua existindo e acessível depois."""
    regional = factory.regional()
    usuario = factory.usuario('Coordenador', 'coord@teste.com', 'cd', regional_id=regional.id)
    factory.atividade('Checklist Diário', 'diaria', 'cd', obrigatoria=True)

    with freeze_time('2026-07-01 08:00:00'):
        ensure_rotinas_mes(usuario, date(2026, 7, 1))

    for dia in range(1, 32):
        rotina = Rotina.query.filter_by(
            usuario_id=usuario.id, periodicidade='diaria', periodo_inicio=date(2026, 7, dia)
        ).first()
        assert rotina is not None, f'dia {dia}/07 não foi gerado'


# ── Perfis híbridos (funções acumuladas) ────────────────────────────────────

CATALOGO_GV = [
    ('Painel do Funil de Vendas', 'semanal'),
    ('Plano de Ação do GV', 'semanal'),
    ('Reunião de Performance com Corretores', 'semanal'),
    ('Alinhamento individual com Corretores (1:1)', 'semanal'),
    ('Treinamento Semanal do Time', 'semanal'),
    ('Monitoramento de Rotinas da Equipe', 'semanal'),
    ('Controle da Meta Individual', 'quinzenal'),
    ('Análise do Resultado Geral do Time', 'mensal'),
]
CATALOGO_CD = [
    ('Checklist de Abertura do Stand', 'semanal'),
    ('Reunião Rápida do Stand', 'semanal'),
    ('Relatório Geral do Empreendimento', 'semanal'),
    ('Plano Semanal do Empreendimento', 'semanal'),
    ('Análise de Concorrência', 'quinzenal'),
    ('Relatório Mensal do Empreendimento', 'mensal'),
]
CATALOGO_SP = [
    ('Relatório do Canal Parcerias', 'semanal'),
    ('Rotina de Visita a Parceiros', 'semanal'),
    ('Análise da Carteira de Parceiros', 'quinzenal'),
    ('Plano de Reativação e Expansão', 'quinzenal'),
    ('Treinamento e Alinhamento com Parceiros', 'mensal'),
]


def _semear_catalogo_completo(factory):
    for perfil, catalogo in (('gv', CATALOGO_GV), ('cd', CATALOGO_CD), ('sp', CATALOGO_SP)):
        for nome, periodicidade in catalogo:
            factory.atividade(nome, periodicidade, perfil)


def _usuario_hibrido(factory, perfis, regional_id):
    u = factory.usuario('Híbrido', 'hibrido@teste.com', perfis[0], regional_id=regional_id)
    u.set_perfis(perfis)
    db.session.commit()
    return u


def _nomes_gerados(usuario):
    return {
        r.atividade.nome
        for r in Rotina.query.filter_by(usuario_id=usuario.id).all()
    }


def test_hibrido_gv_cd_gera_lista_curada_e_nao_a_uniao(app, factory):
    regional = factory.regional()
    _semear_catalogo_completo(factory)
    usuario = _usuario_hibrido(factory, ['gv', 'cd'], regional.id)

    with freeze_time('2026-07-15 12:00:00'):
        ensure_rotinas_mes(usuario, date(2026, 7, 15))

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
    assert _nomes_gerados(usuario) == esperado
    # a união dos catálogos teria 14 atividades — a lista curada tem 8
    assert 'Painel do Funil de Vendas' not in _nomes_gerados(usuario)
    assert 'Relatório Mensal do Empreendimento' not in _nomes_gerados(usuario)


def test_hibrido_trio_gera_11_atividades(app, factory):
    regional = factory.regional()
    _semear_catalogo_completo(factory)
    usuario = _usuario_hibrido(factory, ['gv', 'cd', 'sp'], regional.id)

    with freeze_time('2026-07-15 12:00:00'):
        ensure_rotinas_mes(usuario, date(2026, 7, 15))

    nomes = _nomes_gerados(usuario)
    assert len(nomes) == 11
    # o trio não inclui "Monitoramento de Rotinas da Equipe" nem "Relatório
    # Mensal do Empreendimento" (conforme a planilha de revisão)
    assert 'Monitoramento de Rotinas da Equipe' not in nomes
    assert 'Relatório Mensal do Empreendimento' not in nomes
    assert 'Relatório do Canal Parcerias' in nomes


def test_hibrido_cd_sp_mantem_relatorio_mensal(app, factory):
    regional = factory.regional()
    _semear_catalogo_completo(factory)
    usuario = _usuario_hibrido(factory, ['cd', 'sp'], regional.id)

    with freeze_time('2026-07-15 12:00:00'):
        ensure_rotinas_mes(usuario, date(2026, 7, 15))

    nomes = _nomes_gerados(usuario)
    assert len(nomes) == 8
    assert 'Relatório Mensal do Empreendimento' in nomes
    assert 'Reunião Rápida do Stand' not in nomes


def test_funcao_unica_mantem_catalogo_do_perfil(app, factory):
    """Com uma só função, nada muda: gera todas as atividades do perfil."""
    regional = factory.regional()
    _semear_catalogo_completo(factory)
    usuario = factory.usuario('Gerente', 'gv@teste.com', 'gv', regional_id=regional.id)

    with freeze_time('2026-07-15 12:00:00'):
        ensure_rotinas_mes(usuario, date(2026, 7, 15))

    nomes = _nomes_gerados(usuario)
    assert len(nomes) == len(CATALOGO_GV)
    assert 'Painel do Funil de Vendas' in nomes
    assert 'Controle da Meta Individual' in nomes


def test_hibrido_e_idempotente(app, factory):
    regional = factory.regional()
    _semear_catalogo_completo(factory)
    usuario = _usuario_hibrido(factory, ['gv', 'sp'], regional.id)

    with freeze_time('2026-07-15 12:00:00'):
        primeira = ensure_rotinas_mes(usuario, date(2026, 7, 15))
        segunda = ensure_rotinas_mes(usuario, date(2026, 7, 15))

    assert primeira > 0
    assert segunda == 0
    assert _nomes_gerados(usuario) == {
        'Reunião de Performance com Corretores',
        'Alinhamento individual com Corretores (1:1)',
        'Treinamento Semanal do Time',
        'Monitoramento de Rotinas da Equipe',
        'Análise do Resultado Geral do Time',
        'Relatório do Canal Parcerias',
        'Rotina de Visita a Parceiros',
        'Análise da Carteira de Parceiros',
        'Treinamento e Alinhamento com Parceiros',
    }
