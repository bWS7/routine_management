import csv
import io
import json
import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from backend.audit import log_audit
from backend.utils.dates import get_now_br
from backend.models import Rotina, AtividadeCatalogo, Usuario, HistoricoRotina, Evidencia, AuditLog
from backend.extensions import db
from datetime import date, timedelta, datetime, timezone
from dateutil.relativedelta import relativedelta

rotinas_bp = Blueprint('rotinas', __name__)

PERIODICIDADES = ('diaria', 'semanal', 'quinzenal', 'mensal')


def get_current_user():
    uid = int(get_jwt_identity())
    return Usuario.query.get_or_404(uid)


def can_access_rotina(me, rotina):
    if me.perfil == 'admin':
        return True
    if me.perfil == 'sr':
        return rotina.usuario and rotina.usuario.regional_id == me.regional_id
    return rotina.usuario_id == me.id


def can_edit_rotina(me, rotina):
    """Permissao de ESCRITA (preencher relatorio, alterar status, anexos).
    Apenas o admin e o proprio dono da rotina podem editar. O Superintendente
    pode visualizar/aprovar, mas NUNCA preencher o relatorio de terceiros."""
    return me.perfil == 'admin' or rotina.usuario_id == me.id


def add_rotina_history(rotina, usuario_id, acao, observacao=None, status_anterior=None, status_novo=None):
    hist = HistoricoRotina(
        rotina_id=rotina.id,
        usuario_id=usuario_id,
        acao=acao,
        status_anterior=status_anterior,
        status_novo=status_novo,
        observacao=observacao
    )
    db.session.add(hist)


def allowed_file(filename):
    # Aceita qualquer tipo de documento, slide, planilha, imagem, etc.
    # Bloqueia apenas executaveis/scripts por seguranca — os arquivos sao
    # sempre servidos como download (Content-Disposition: attachment).
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    bloqueadas = {
        'exe', 'msi', 'bat', 'cmd', 'com', 'scr', 'pif', 'sh', 'bash',
        'ps1', 'vbs', 'vbe', 'js', 'jse', 'wsf', 'wsh', 'jar', 'dll', 'app', 'apk',
    }
    return ext not in bloqueadas


def get_periodo(tipo, referencia=None):
    hoje = referencia or date.today()
    if tipo == 'diaria':
        inicio = hoje
        fim = hoje
    elif tipo == 'semanal':
        inicio = hoje - timedelta(days=hoje.weekday())
        fim = inicio + timedelta(days=6)
    elif tipo == 'quinzenal':
        if hoje.day <= 15:
            inicio = hoje.replace(day=1)
            fim = hoje.replace(day=15)
        else:
            inicio = hoje.replace(day=16)
            ultimo = (hoje.replace(day=1) + relativedelta(months=1)) - timedelta(days=1)
            fim = ultimo
    else:  # mensal
        inicio = hoje.replace(day=1)
        ultimo = (hoje.replace(day=1) + relativedelta(months=1)) - timedelta(days=1)
        fim = ultimo
    return inicio, fim


def filtro_periodo_atual(model, referencia):
    from sqlalchemy import or_, and_

    filtros = []
    for periodicidade in PERIODICIDADES:
        inicio, fim = get_periodo(periodicidade, referencia)
        filtros.append(and_(
            model.periodicidade == periodicidade,
            model.periodo_inicio >= inicio,
            model.periodo_fim <= fim
        ))
    return or_(*filtros)


def rotina_vencida_pendente(rotina):
    prazo_limite = rotina.prazo_limite
    return (
        rotina.atividade
        and rotina.atividade.obrigatoria
        and rotina.status in ['nao_iniciada', 'em_andamento']
        and prazo_limite
        and prazo_limite < date.today()
    )


@rotinas_bp.route('/gerar', methods=['POST'])
@jwt_required()
def gerar_rotinas():
    me = get_current_user()
    if me.perfil != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403

    data = request.get_json() or {}
    usuario_ids = data.get('usuario_ids')  # Lista de IDs ou None para todos
    referencia_str = data.get('referencia')
    periodicidade_filtro = data.get('periodicidade') # 'diaria', 'semanal', 'quinzenal', 'mensal' ou None
    
    referencia = date.fromisoformat(referencia_str) if referencia_str else date.today()

    query = Usuario.query.filter_by(status='ativo')
    if usuario_ids and isinstance(usuario_ids, list) and len(usuario_ids) > 0:
        query = query.filter(Usuario.id.in_(usuario_ids))
    usuarios = query.all()

    criadas = 0
    for usuario in usuarios:
        cat_query = AtividadeCatalogo.query.filter(
            AtividadeCatalogo.perfil.in_(usuario.perfis_list),
            AtividadeCatalogo.ativo == True
        )
        if periodicidade_filtro and periodicidade_filtro != 'todas':
            cat_query = cat_query.filter_by(periodicidade=periodicidade_filtro)
        
        atividades = cat_query.all()
        for atividade in atividades:
            inicio, fim = get_periodo(atividade.periodicidade, referencia)
            existe = Rotina.query.filter_by(
                usuario_id=usuario.id,
                atividade_id=atividade.id,
                periodo_inicio=inicio
            ).first()
            if not existe:
                r = Rotina(
                    usuario_id=usuario.id,
                    atividade_id=atividade.id,
                    periodo_inicio=inicio,
                    periodo_fim=fim,
                    periodicidade=atividade.periodicidade
                )
                db.session.add(r)
                criadas += 1

    db.session.commit()
    return jsonify({'mensagem': f'{criadas} rotinas geradas com sucesso', 'total': criadas})


def ensure_rotinas_atuais(usuario, referencia=None):
    """Geração automática (Seção 3): cria, de forma idempotente, as rotinas do
    período atual (semanal/quinzenal/mensal/diária) para o usuário, conforme o
    catálogo do seu perfil. Chamado ao acessar as rotinas, sem necessidade de
    agendador externo."""
    if not usuario or not usuario.perfis_list:
        return 0
    referencia = referencia or date.today()
    atividades = AtividadeCatalogo.query.filter(
        AtividadeCatalogo.perfil.in_(usuario.perfis_list),
        AtividadeCatalogo.ativo == True
    ).all()
    criadas = 0
    for atividade in atividades:
        inicio, fim = get_periodo(atividade.periodicidade, referencia)
        existe = Rotina.query.filter_by(
            usuario_id=usuario.id,
            atividade_id=atividade.id,
            periodo_inicio=inicio
        ).first()
        if not existe:
            db.session.add(Rotina(
                usuario_id=usuario.id,
                atividade_id=atividade.id,
                periodo_inicio=inicio,
                periodo_fim=fim,
                periodicidade=atividade.periodicidade
            ))
            criadas += 1
    if criadas:
        db.session.commit()
    return criadas


@rotinas_bp.route('/', methods=['GET'])
@jwt_required()
def listar():
    me = get_current_user()

    # Geração automática das rotinas do período atual do próprio usuário (Seção 3).
    ensure_rotinas_atuais(me)

    usuario_id = request.args.get('usuario_id', type=int)
    regional_id = request.args.get('regional_id', type=int)
    periodicidade = request.args.get('periodicidade')
    status = request.args.get('status')
    periodo = request.args.get('periodo', 'semanal')
    data_ref = request.args.get('data_ref')

    referencia = date.fromisoformat(data_ref) if data_ref else date.today()

    if periodo == 'todas':
        query = Rotina.query.join(Usuario, Rotina.usuario_id == Usuario.id).filter(
            filtro_periodo_atual(Rotina, referencia)
        )
    else:
        inicio, fim = get_periodo(periodo, referencia)
        query = Rotina.query.join(Usuario, Rotina.usuario_id == Usuario.id).filter(
            Rotina.periodo_inicio >= inicio,
            Rotina.periodo_fim <= fim,
            Rotina.periodicidade == periodo
        )

    # Visibilidade por hierarquia
    if me.perfil == 'admin':
        if usuario_id:
            query = query.filter(Rotina.usuario_id == usuario_id)
        if regional_id:
            query = query.filter(Usuario.regional_id == regional_id)
    elif me.perfil == 'sr':
        query = query.filter(Usuario.regional_id == me.regional_id)
        if usuario_id:
            query = query.filter(Rotina.usuario_id == usuario_id)
    elif me.perfil == 'gv':
        query = query.filter(Rotina.usuario_id == me.id)
    else:
        query = query.filter(Rotina.usuario_id == me.id)

    if periodicidade:
        query = query.filter(Rotina.periodicidade == periodicidade)
    if status:
        query = query.filter(Rotina.status == status)

    rotinas = query.order_by(Rotina.periodo_inicio.desc()).all()
    return jsonify([r.to_dict() for r in rotinas])


@rotinas_bp.route('/<int:rid>', methods=['GET'])
@jwt_required()
def obter(rid):
    me = get_current_user()
    r = Rotina.query.get_or_404(rid)
    if not can_access_rotina(me, r):
        return jsonify({'erro': 'Acesso negado'}), 403
    return jsonify(r.to_dict())


@rotinas_bp.route('/<int:rid>', methods=['PUT'])
@jwt_required()
def atualizar(rid):
    me = get_current_user()
    r = Rotina.query.get_or_404(rid)

    if not can_edit_rotina(me, r):
        return jsonify({'erro': 'Acesso negado'}), 403

    data = request.get_json()
    status_anterior = r.status
    vencida_pendente = rotina_vencida_pendente(r)

    if 'status' in data:
        if vencida_pendente and data['status'] != 'nao_realizada':
            return jsonify({'erro': 'Atividade vencida. Registre como nao realizada com justificativa e plano de acao.'}), 400
        if data['status'] == 'concluida':
            if not r.formulario_preenchido:
                return jsonify({'erro': 'Preencha o Relatório Comercial antes de concluir a atividade'}), 400
            if not r.evidencias:
                return jsonify({'erro': 'Anexe pelo menos uma evidência antes de concluir a atividade'}), 400
        r.status = data['status']
        if data['status'] == 'concluida' and not r.data_conclusao:
            r.data_conclusao = get_now_br()
            # Definir status de aprovação como pendente quando a atividade é concluída
            r.status_aprovacao = 'pendente'
        elif data['status'] != 'concluida':
            r.data_conclusao = None
            # Se o status muda de concluída para outra coisa, resetar o status de aprovação
            if status_anterior == 'concluida' and r.status_aprovacao == 'pendente':
                r.status_aprovacao = 'pendente'

    if 'comentario' in data:
        r.comentario = data['comentario']
    if 'justificativa' in data:
        r.justificativa = data['justificativa']
    if 'acao_corretiva' in data:
        r.acao_corretiva = data['acao_corretiva']
    if 'novo_prazo' in data:
        r.novo_prazo = date.fromisoformat(data['novo_prazo']) if data['novo_prazo'] else None
    if 'responsavel_acao' in data:
        r.responsavel_acao = data['responsavel_acao']
    if 'checklist' in data:
        r.checklist = data['checklist']
    if 'relatorio' in data:
        r.relatorio = data['relatorio']
    if 'plano_semana' in data:
        r.plano_semana = data['plano_semana']
    if 'visitas_ativacoes' in data:
        r.visitas_ativacoes = data['visitas_ativacoes']
    if 'resultados_visita' in data:
        r.resultados_visita = data['resultados_visita']
    if 'carteira_ativa' in data:
        r.carteira_ativa = data['carteira_ativa']
    if 'metas_canal' in data:
        r.metas_canal = data['metas_canal']

    if vencida_pendente and r.status != 'nao_realizada':
        return jsonify({'erro': 'Atividade vencida. Nao e possivel preencher ou concluir apos o prazo.'}), 400

    if r.status == 'nao_realizada' and (not r.justificativa or not r.acao_corretiva):
        return jsonify({'erro': 'Justificativa e plano de ação são obrigatórios para atividades não realizadas'}), 400

    if status_anterior != r.status:
        add_rotina_history(
            r,
            me.id,
            'mudanca_status',
            observacao=data.get('comentario'),
            status_anterior=status_anterior,
            status_novo=r.status
        )

    if any(chave in data for chave in ['comentario', 'justificativa', 'acao_corretiva', 'novo_prazo', 'responsavel_acao', 'checklist', 'relatorio', 'plano_semana', 'visitas_ativacoes', 'resultados_visita', 'carteira_ativa', 'metas_canal']):
        add_rotina_history(
            r,
            me.id,
            'atualizacao_rotina',
            observacao=data.get('comentario') or data.get('justificativa') or 'Campos complementares atualizados',
            status_anterior=status_anterior,
            status_novo=r.status
        )

    log_audit(me.id, 'rotina', r.id, 'atualizar', {
        'status': r.status,
        'comentario': r.comentario,
        'justificativa': r.justificativa,
        'acao_corretiva': r.acao_corretiva,
        'novo_prazo': r.novo_prazo,
        'responsavel_acao': r.responsavel_acao,
        'checklist': r.checklist,
        'relatorio': r.relatorio,
        'plano_semana': r.plano_semana,
        'visitas_ativacoes': r.visitas_ativacoes,
        'resultados_visita': r.resultados_visita,
        'carteira_ativa': r.carteira_ativa,
        'metas_canal': r.metas_canal
    })

    db.session.commit()
    return jsonify(r.to_dict())


@rotinas_bp.route('/<int:rid>/evidencias', methods=['POST'])
@jwt_required()
def upload_evidencia(rid):
    me = get_current_user()
    rotina = Rotina.query.get_or_404(rid)
    if not can_edit_rotina(me, rotina):
        return jsonify({'erro': 'Acesso negado'}), 403
    if rotina_vencida_pendente(rotina):
        return jsonify({'erro': 'Atividade vencida. Nao e possivel anexar evidencias apos o prazo.'}), 400

    arquivo = request.files.get('arquivo')
    if not arquivo or not arquivo.filename:
        return jsonify({'erro': 'Arquivo é obrigatório'}), 400
    if not allowed_file(arquivo.filename):
        return jsonify({'erro': 'Tipo de arquivo não permitido'}), 400

    nome_seguro = secure_filename(arquivo.filename) or 'arquivo'
    nome_final = f"{rotina.id}_{uuid.uuid4().hex}_{nome_seguro}"

    conteudo = arquivo.read()

    try:
        caminho = os.path.join(current_app.config['UPLOAD_FOLDER'], nome_final)
        with open(caminho, 'wb') as f:
            f.write(conteudo)
    except Exception as e:
        current_app.logger.warning(f"Não foi possível salvar arquivo no disco: {e}")

    evidencia = Evidencia(
        rotina_id=rotina.id,
        nome_arquivo=arquivo.filename,
        url=f"/uploads/{nome_final}",
        tipo=(arquivo.mimetype or 'arquivo')[:255],
        conteudo=conteudo,
    )
    db.session.add(evidencia)
    db.session.flush()
    add_rotina_history(rotina, me.id, 'anexo_evidencia', observacao=arquivo.filename, status_anterior=rotina.status, status_novo=rotina.status)
    log_audit(me.id, 'evidencia', evidencia.id, 'criar', {'rotina_id': rotina.id, 'arquivo': arquivo.filename})
    db.session.commit()
    return jsonify(evidencia.to_dict()), 201


@rotinas_bp.route('/evidencias/<int:eid>', methods=['DELETE'])
@jwt_required()
def deletar_evidencia(eid):
    me = get_current_user()
    evidencia = Evidencia.query.get_or_404(eid)
    rotina = Rotina.query.get_or_404(evidencia.rotina_id)
    if not can_edit_rotina(me, rotina):
        return jsonify({'erro': 'Acesso negado'}), 403

    if evidencia.url and evidencia.url.startswith('/uploads/'):
        caminho = os.path.join(current_app.config['UPLOAD_FOLDER'], evidencia.url.split('/uploads/', 1)[1])
        if os.path.exists(caminho):
            os.remove(caminho)

    nome = evidencia.nome_arquivo
    db.session.delete(evidencia)
    add_rotina_history(rotina, me.id, 'remocao_evidencia', observacao=nome, status_anterior=rotina.status, status_novo=rotina.status)
    log_audit(me.id, 'evidencia', eid, 'excluir', {'rotina_id': rotina.id, 'arquivo': nome})
    db.session.commit()
    return jsonify({'mensagem': 'Evidência removida'})


@rotinas_bp.route('/<int:rid>/historico', methods=['GET'])
@jwt_required()
def historico_rotina(rid):
    me = get_current_user()
    rotina = Rotina.query.get_or_404(rid)
    if not can_access_rotina(me, rotina):
        return jsonify({'erro': 'Acesso negado'}), 403

    historico = HistoricoRotina.query.filter_by(rotina_id=rid).order_by(HistoricoRotina.criado_em.desc()).all()
    return jsonify([h.to_dict() for h in historico])


@rotinas_bp.route('/audit-log', methods=['GET'])
@jwt_required()
def listar_auditoria():
    me = get_current_user()
    if me.perfil != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403

    limite = min(request.args.get('limit', 100, type=int), 500)
    registros = AuditLog.query.order_by(AuditLog.criado_em.desc()).limit(limite).all()
    return jsonify([r.to_dict() for r in registros])


@rotinas_bp.route('/minha-aderencia', methods=['GET'])
@jwt_required()
def minha_aderencia():
    me = get_current_user()
    periodo = request.args.get('periodo', 'semanal')
    data_ref = request.args.get('data_ref')
    referencia = date.fromisoformat(data_ref) if data_ref else date.today()
    if periodo == 'todas':
        inicio, fim = get_periodo('mensal', referencia)
        rotinas = Rotina.query.filter(
            Rotina.usuario_id == me.id,
            filtro_periodo_atual(Rotina, referencia)
        ).all()
    else:
        inicio, fim = get_periodo(periodo, referencia)
        rotinas = Rotina.query.filter(
            Rotina.usuario_id == me.id,
            Rotina.periodo_inicio >= inicio,
            Rotina.periodo_fim <= fim,
            Rotina.periodicidade == periodo
        ).all()

    total = len(rotinas)
    concluidas = sum(1 for r in rotinas if r.status == 'concluida' and r.status_aprovacao != 'reprovada')
    percentual = round((concluidas / total * 100), 1) if total else 0
    return jsonify({
        'periodo': periodo,
        'periodo_inicio': inicio.isoformat(),
        'periodo_fim': fim.isoformat(),
        'total': total,
        'concluidas': concluidas,
        'percentual_execucao': percentual
    })


def _export_csv(nome_arquivo, cabecalho, linhas):
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(cabecalho)
    writer.writerows(linhas)
    mem = io.BytesIO(buffer.getvalue().encode('utf-8-sig'))
    mem.seek(0)
    return send_file(mem, mimetype='text/csv', as_attachment=True, download_name=nome_arquivo)


@rotinas_bp.route('/export', methods=['GET'])
@jwt_required()
def exportar_rotinas():
    me = get_current_user()

    usuario_id = request.args.get('usuario_id', type=int)
    regional_id = request.args.get('regional_id', type=int)
    periodicidade = request.args.get('periodicidade')
    status = request.args.get('status')
    periodo = request.args.get('periodo', 'semanal')
    data_ref = request.args.get('data_ref')
    referencia = date.fromisoformat(data_ref) if data_ref else date.today()

    if periodo == 'todas':
        query = Rotina.query.join(Usuario, Rotina.usuario_id == Usuario.id).filter(
            filtro_periodo_atual(Rotina, referencia)
        )
    else:
        inicio, fim = get_periodo(periodo, referencia)
        query = Rotina.query.join(Usuario, Rotina.usuario_id == Usuario.id).filter(
            Rotina.periodo_inicio >= inicio,
            Rotina.periodo_fim <= fim,
            Rotina.periodicidade == periodo
        )

    if me.perfil == 'admin':
        if regional_id:
            query = query.filter(Usuario.regional_id == regional_id)
        if usuario_id:
            query = query.filter(Rotina.usuario_id == usuario_id)
    elif me.perfil == 'sr':
        query = query.filter(Usuario.regional_id == me.regional_id)
        if usuario_id:
            query = query.filter(Rotina.usuario_id == usuario_id)
    else:
        query = query.filter(Rotina.usuario_id == me.id)

    if periodicidade:
        query = query.filter(Rotina.periodicidade == periodicidade)
    if status:
        query = query.filter(Rotina.status == status)

    rotinas = query.order_by(Rotina.periodo_inicio.desc()).all()
    linhas = [[
        r.usuario_nome,
        r.atividade_nome,
        r.periodicidade,
        r.status,
        r.periodo_inicio.isoformat() if r.periodo_inicio else '',
        r.periodo_fim.isoformat() if r.periodo_fim else '',
        r.data_conclusao.isoformat() if r.data_conclusao else '',
        r.comentario or '',
        r.justificativa or '',
        r.acao_corretiva or '',
        len(r.evidencias)
    ] for r in rotinas]
    return _export_csv(
        f'rotinas_{periodo}.csv',
        ['Usuario', 'Atividade', 'Periodicidade', 'Status', 'Periodo Inicio', 'Periodo Fim', 'Conclusao', 'Comentario', 'Justificativa', 'Plano Acao', 'Qtde Evidencias'],
        linhas
    )


@rotinas_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    me = get_current_user()

    if me.perfil not in ['admin', 'sr']:
        return jsonify({'erro': 'Acesso negado'}), 403

    regional_id = request.args.get('regional_id', type=int)
    usuario_id = request.args.get('usuario_id', type=int)
    periodo = request.args.get('periodo', 'semanal')
    data_ref = request.args.get('data_ref')

    referencia = date.fromisoformat(data_ref) if data_ref else date.today()

    if periodo == 'todas':
        inicio, fim = get_periodo('mensal', referencia)
        query = Rotina.query.join(Usuario, Rotina.usuario_id == Usuario.id).filter(
            Usuario.status == 'ativo',
            filtro_periodo_atual(Rotina, referencia)
        )
    else:
        inicio, fim = get_periodo(periodo, referencia)
        query = Rotina.query.join(Usuario, Rotina.usuario_id == Usuario.id).filter(
            Rotina.periodo_inicio >= inicio,
            Rotina.periodo_fim <= fim,
            Rotina.periodicidade == periodo,
            Usuario.status == 'ativo'
        )

    if me.perfil == 'sr':
        query = query.filter(Usuario.regional_id == me.regional_id)
    elif regional_id:
        query = query.filter(Usuario.regional_id == regional_id)

    if usuario_id and me.perfil in ['admin', 'sr']:
        query = query.filter(Rotina.usuario_id == usuario_id)

    rotinas = query.all()
    total = len(rotinas)
    concluidas = sum(1 for r in rotinas if r.status == 'concluida' and r.status_aprovacao != 'reprovada')
    nao_realizadas = sum(1 for r in rotinas if r.status == 'nao_realizada')
    em_andamento = sum(1 for r in rotinas if r.status == 'em_andamento')
    nao_iniciadas = sum(1 for r in rotinas if r.status == 'nao_iniciada')

    percentual = round((concluidas / total * 100), 1) if total > 0 else 0

    # Por perfil
    por_perfil = {}
    for r in rotinas:
        p = r.atividade.perfil if r.atividade else 'N/A'
        if p not in por_perfil:
            por_perfil[p] = {'total': 0, 'concluidas': 0}
        por_perfil[p]['total'] += 1
        if r.status == 'concluida' and r.status_aprovacao != 'reprovada':
            por_perfil[p]['concluidas'] += 1

    for p in por_perfil:
        t = por_perfil[p]['total']
        c = por_perfil[p]['concluidas']
        por_perfil[p]['percentual'] = round(c / t * 100, 1) if t > 0 else 0

    usuarios_query = Usuario.query.filter_by(status='ativo')
    if me.perfil == 'sr':
        usuarios_query = usuarios_query.filter_by(regional_id=me.regional_id)
    elif regional_id:
        usuarios_query = usuarios_query.filter_by(regional_id=regional_id)
    if usuario_id:
        usuarios_query = usuarios_query.filter_by(id=usuario_id)

    # Por usuário (ranking)
    por_usuario = {
        u.id: {
            'nome': u.nome,
            'regional': u.regional.nome if u.regional else 'N/A',
            'total': 0,
            'concluidas': 0
        }
        for u in usuarios_query.order_by(Usuario.nome).all()
    }

    for r in rotinas:
        uid = r.usuario_id
        if uid not in por_usuario:
            por_usuario[uid] = {
                'nome': r.usuario.nome if r.usuario else 'N/A',
                'regional': r.usuario.regional.nome if r.usuario and r.usuario.regional else 'N/A',
                'total': 0,
                'concluidas': 0
            }
        por_usuario[uid]['total'] += 1
        if r.status == 'concluida' and r.status_aprovacao != 'reprovada':
            por_usuario[uid]['concluidas'] += 1

    ranking = []
    for uid, info in por_usuario.items():
        t = info['total']
        c = info['concluidas']
        ranking.append({
            'usuario_id': uid,
            'nome': info['nome'],
            'regional': info['regional'],
            'total': t,
            'concluidas': c,
            'percentual': round(c / t * 100, 1) if t > 0 else 0
        })
    ranking.sort(key=lambda x: x['percentual'], reverse=True)

    return jsonify({
        'periodo': periodo,
        'periodo_inicio': inicio.isoformat(),
        'periodo_fim': fim.isoformat(),
        'total': total,
        'concluidas': concluidas,
        'nao_realizadas': nao_realizadas,
        'em_andamento': em_andamento,
        'nao_iniciadas': nao_iniciadas,
        'percentual_execucao': percentual,
        'por_perfil': por_perfil,
        'ranking': ranking
    })


@rotinas_bp.route('/dashboard/export', methods=['GET'])
@jwt_required()
def exportar_dashboard():
    me = get_current_user()
    if me.perfil not in ['admin', 'sr']:
        return jsonify({'erro': 'Acesso negado'}), 403

    regional_id = request.args.get('regional_id', type=int)
    usuario_id = request.args.get('usuario_id', type=int)
    periodo = request.args.get('periodo', 'semanal')
    data_ref = request.args.get('data_ref')
    referencia = date.fromisoformat(data_ref) if data_ref else date.today()

    if periodo == 'todas':
        query = Rotina.query.join(Usuario, Rotina.usuario_id == Usuario.id).filter(
            Usuario.status == 'ativo',
            filtro_periodo_atual(Rotina, referencia)
        )
    else:
        inicio, fim = get_periodo(periodo, referencia)
        query = Rotina.query.join(Usuario, Rotina.usuario_id == Usuario.id).filter(
            Rotina.periodo_inicio >= inicio,
            Rotina.periodo_fim <= fim,
            Rotina.periodicidade == periodo,
            Usuario.status == 'ativo'
        )
    if me.perfil == 'sr':
        query = query.filter(Usuario.regional_id == me.regional_id)
    elif regional_id:
        query = query.filter(Usuario.regional_id == regional_id)
    if usuario_id:
        query = query.filter(Rotina.usuario_id == usuario_id)

    rotinas = query.all()
    linhas = [[
        r.usuario_nome,
        r.usuario.regional.nome if r.usuario and r.usuario.regional else '',
        r.atividade_nome,
        r.periodicidade,
        r.status,
        r.data_conclusao.isoformat() if r.data_conclusao else ''
    ] for r in rotinas]
    return _export_csv(
        f'dashboard_{periodo}.csv',
        ['Usuario', 'Regional', 'Atividade', 'Periodicidade', 'Status', 'Conclusao'],
        linhas
    )


@rotinas_bp.route('/pendencias', methods=['GET'])
@jwt_required()
def pendencias():
    me = get_current_user()

    query = Rotina.query.join(Usuario, Rotina.usuario_id == Usuario.id).join(AtividadeCatalogo).filter(
        Rotina.status.in_(['nao_iniciada', 'em_andamento']),
        AtividadeCatalogo.obrigatoria == True
    )

    if me.perfil == 'sr':
        query = query.filter(Usuario.regional_id == me.regional_id)
    elif me.perfil not in ['admin']:
        query = query.filter(Rotina.usuario_id == me.id)

    rotinas = [r for r in query.all() if rotina_vencida_pendente(r)]
    rotinas.sort(key=lambda r: r.prazo_limite or r.periodo_fim)
    return jsonify([r.to_dict() for r in rotinas])


@rotinas_bp.route('/<int:rid>/aprovar', methods=['POST'])
@jwt_required()
def aprovar_atividade(rid):
    me = get_current_user()
    rotina = Rotina.query.get_or_404(rid)
    
    # Verificar se o usuário tem permissão para aprovar
    # Superintendente aprova atividades da sua regional
    # Supervisor aprova atividades do seu superintendente
    # Admin aprova qualquer atividade
    
    if me.perfil == 'admin':
        # Admin pode aprovar qualquer coisa
        pass
    elif me.perfil == 'sr':
        if rotina.usuario_id == me.id:
            return jsonify({'erro': 'Você não pode aprovar suas próprias atividades'}), 403
        if rotina.usuario.regional_id != me.regional_id:
            return jsonify({'erro': 'Você só pode aprovar atividades de sua regional'}), 403
    else:
        return jsonify({'erro': 'Apenas Administrador e Superintendente podem aprovar atividades'}), 403
    
    # Verificar se a atividade está pendente de aprovação
    if rotina.status_aprovacao != 'pendente':
        return jsonify({'erro': f'Atividade já foi {rotina.status_aprovacao}'}), 400
    
    data = request.get_json() or {}

    # Atualizar status de aprovação
    rotina.status_aprovacao = 'aprovada'
    rotina.aprovador_id = me.id
    rotina.data_aprovacao = get_now_br()

    # Registrar no histórico de aprovações
    from backend.models import AprovacaoRotina
    aprovacao = AprovacaoRotina(
        rotina_id=rotina.id,
        aprovador_id=me.id,
        acao='aprovada',
        motivo=data.get('motivo'),
        duracao_revisao_segundos=data.get('duracao_revisao_segundos')
    )
    db.session.add(aprovacao)
    
    # Adicionar no histórico de rotinas
    add_rotina_history(
        rotina,
        me.id,
        'aprovacao_atividade',
        observacao=f'Atividade aprovada por {me.nome}',
        status_anterior=rotina.status,
        status_novo=rotina.status
    )
    
    log_audit(me.id, 'rotina_aprovacao', rotina.id, 'aprovar', {
        'rotina_id': rotina.id,
        'usuario_id': rotina.usuario_id,
        'status_aprovacao': 'aprovada'
    })
    
    db.session.commit()
    return jsonify(rotina.to_dict())


@rotinas_bp.route('/<int:rid>/reprovar', methods=['POST'])
@jwt_required()
def reprovar_atividade(rid):
    me = get_current_user()
    rotina = Rotina.query.get_or_404(rid)
    
    # Verificar se o usuário tem permissão para reprovar
    if me.perfil == 'admin':
        pass
    elif me.perfil == 'sr':
        if rotina.usuario_id == me.id:
            return jsonify({'erro': 'Você não pode reprovar suas próprias atividades'}), 403
        if rotina.usuario.regional_id != me.regional_id:
            return jsonify({'erro': 'Você só pode reprovar atividades de sua regional'}), 403
    else:
        return jsonify({'erro': 'Apenas Administrador e Superintendente podem reprovar atividades'}), 403
    
    # Verificar se a atividade está pendente de aprovação
    if rotina.status_aprovacao != 'pendente':
        return jsonify({'erro': f'Atividade já foi {rotina.status_aprovacao}'}), 400
    
    data = request.get_json()
    motivo = data.get('motivo')
    
    if not motivo:
        return jsonify({'erro': 'Motivo da reprovação é obrigatório'}), 400
    
    # Atualizar status de aprovação
    rotina.status_aprovacao = 'reprovada'
    rotina.aprovador_id = me.id
    rotina.data_aprovacao = get_now_br()
    rotina.motivo_reprovacao = motivo
    
    # Registrar no histórico de aprovações
    from backend.models import AprovacaoRotina
    aprovacao = AprovacaoRotina(
        rotina_id=rotina.id,
        aprovador_id=me.id,
        acao='reprovada',
        motivo=motivo,
        duracao_revisao_segundos=data.get('duracao_revisao_segundos')
    )
    db.session.add(aprovacao)
    
    # Adicionar no histórico de rotinas
    add_rotina_history(
        rotina,
        me.id,
        'reprovacao_atividade',
        observacao=f'Atividade reprovada por {me.nome}: {motivo}',
        status_anterior=rotina.status,
        status_novo=rotina.status
    )
    
    log_audit(me.id, 'rotina_aprovacao', rotina.id, 'reprovar', {
        'rotina_id': rotina.id,
        'usuario_id': rotina.usuario_id,
        'status_aprovacao': 'reprovada',
        'motivo': motivo
    })
    
    db.session.commit()
    return jsonify(rotina.to_dict())


@rotinas_bp.route('/<int:rid>/aprovacoes', methods=['GET'])
@jwt_required()
def listar_aprovacoes(rid):
    me = get_current_user()
    rotina = Rotina.query.get_or_404(rid)
    
    if not can_access_rotina(me, rotina):
        return jsonify({'erro': 'Acesso negado'}), 403
    
    from backend.models import AprovacaoRotina
    aprovacoes = AprovacaoRotina.query.filter_by(rotina_id=rid).order_by(AprovacaoRotina.criado_em.desc()).all()
    return jsonify([a.to_dict() for a in aprovacoes])


@rotinas_bp.route('/<int:rid>/reenviar', methods=['POST'])
@jwt_required()
def reenviar_para_aprovacao(rid):
    me = get_current_user()
    rotina = Rotina.query.get_or_404(rid)

    if rotina.usuario_id != me.id and me.perfil != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403

    if rotina.status_aprovacao != 'reprovada':
        return jsonify({'erro': 'Apenas atividades reprovadas podem ser reenviadas'}), 400

    rotina.status_aprovacao = 'pendente'
    rotina.aprovador_id = None
    rotina.data_aprovacao = None
    rotina.motivo_reprovacao = None

    add_rotina_history(
        rotina,
        me.id,
        'reenvio_para_aprovacao',
        observacao='Atividade reenviada para aprovação pelo colaborador',
        status_anterior=rotina.status,
        status_novo=rotina.status
    )

    log_audit(me.id, 'rotina_aprovacao', rotina.id, 'reenviar', {
        'rotina_id': rotina.id,
        'usuario_id': rotina.usuario_id,
    })

    db.session.commit()
    return jsonify(rotina.to_dict())


@rotinas_bp.route('/<int:rid>/formulario', methods=['GET'])
@jwt_required()
def obter_formulario(rid):
    me = get_current_user()
    r = Rotina.query.get_or_404(rid)
    if not can_access_rotina(me, r):
        return jsonify({'erro': 'Acesso negado'}), 403
    dados = {}
    if r.formulario_comercial:
        try:
            dados = json.loads(r.formulario_comercial)
        except Exception:
            dados = {}
    return jsonify({'formulario': dados, 'formulario_preenchido': r.formulario_preenchido or False})


@rotinas_bp.route('/<int:rid>/formulario', methods=['PUT'])
@jwt_required()
def salvar_formulario(rid):
    me = get_current_user()
    r = Rotina.query.get_or_404(rid)
    if not can_edit_rotina(me, r):
        return jsonify({'erro': 'Acesso negado'}), 403
    # Secao 1: o status nao deve impedir o preenchimento do relatorio.
    # Atividades com status 'nao_iniciada' ou 'nao_realizada' permanecem editaveis
    # mesmo apos o prazo; o bloqueio por vencimento so se aplica a 'em_andamento'.
    if rotina_vencida_pendente(r) and r.status not in ('nao_iniciada', 'nao_realizada'):
        return jsonify({'erro': 'Atividade vencida. Nao e possivel preencher relatorio apos o prazo.'}), 400

    data = request.get_json() or {}
    formulario = data.get('formulario', {})
    r.formulario_comercial = json.dumps(formulario, ensure_ascii=False)
    r.formulario_preenchido = True

    add_rotina_history(r, me.id, 'atualizacao_rotina',
                       observacao='Relatório Comercial preenchido',
                       status_anterior=r.status, status_novo=r.status)
    log_audit(me.id, 'rotina', r.id, 'formulario', {'rotina_id': r.id})
    db.session.commit()
    return jsonify({'mensagem': 'Relatório salvo com sucesso', 'formulario_preenchido': True})


@rotinas_bp.route('/relatorios-preenchimento', methods=['GET'])
@jwt_required()
def relatorios_preenchimento():
    me = get_current_user()
    if me.perfil != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403

    regional_id  = request.args.get('regional_id', type=int)
    usuario_id   = request.args.get('usuario_id', type=int)
    perfil_filtro = request.args.get('perfil')
    atividade_id = request.args.get('atividade_id', type=int)
    periodicidade = request.args.get('periodicidade')
    status       = request.args.get('status')
    data_inicio  = request.args.get('data_inicio')
    data_fim     = request.args.get('data_fim')
    busca        = request.args.get('busca', '').strip()

    query = (
        Rotina.query
        .join(Usuario, Rotina.usuario_id == Usuario.id)
        .join(AtividadeCatalogo, Rotina.atividade_id == AtividadeCatalogo.id)
        .filter(Rotina.formulario_preenchido == True)
    )

    if regional_id:
        query = query.filter(Usuario.regional_id == regional_id)
    if usuario_id:
        query = query.filter(Rotina.usuario_id == usuario_id)
    if perfil_filtro:
        query = query.filter(AtividadeCatalogo.perfil == perfil_filtro)
    if atividade_id:
        query = query.filter(Rotina.atividade_id == atividade_id)
    if periodicidade:
        query = query.filter(Rotina.periodicidade == periodicidade)
    if status:
        query = query.filter(Rotina.status == status)
    if data_inicio:
        query = query.filter(Rotina.periodo_inicio >= date.fromisoformat(data_inicio))
    if data_fim:
        query = query.filter(Rotina.periodo_fim <= date.fromisoformat(data_fim))
    if busca:
        from sqlalchemy import or_
        query = query.filter(or_(
            Usuario.nome.ilike(f'%{busca}%'),
            AtividadeCatalogo.nome.ilike(f'%{busca}%'),
        ))

    rotinas = query.order_by(Rotina.atualizado_em.desc()).all()
    result = []
    for r in rotinas:
        d = r.to_dict()
        try:
            d['formulario_data'] = json.loads(r.formulario_comercial) if r.formulario_comercial else {}
        except Exception:
            d['formulario_data'] = {}
        result.append(d)
    return jsonify(result)


@rotinas_bp.route('/relatorios-preenchimento/export', methods=['GET'])
@jwt_required()
def exportar_relatorios_preenchimento():
    me = get_current_user()
    if me.perfil != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403

    regional_id  = request.args.get('regional_id', type=int)
    usuario_id   = request.args.get('usuario_id', type=int)
    perfil_filtro = request.args.get('perfil')
    atividade_id = request.args.get('atividade_id', type=int)
    periodicidade = request.args.get('periodicidade')
    status       = request.args.get('status')
    data_inicio  = request.args.get('data_inicio')
    data_fim     = request.args.get('data_fim')
    busca        = request.args.get('busca', '').strip()

    query = (
        Rotina.query
        .join(Usuario, Rotina.usuario_id == Usuario.id)
        .join(AtividadeCatalogo, Rotina.atividade_id == AtividadeCatalogo.id)
        .filter(Rotina.formulario_preenchido == True)
    )
    if regional_id:
        query = query.filter(Usuario.regional_id == regional_id)
    if usuario_id:
        query = query.filter(Rotina.usuario_id == usuario_id)
    if perfil_filtro:
        query = query.filter(AtividadeCatalogo.perfil == perfil_filtro)
    if atividade_id:
        query = query.filter(Rotina.atividade_id == atividade_id)
    if periodicidade:
        query = query.filter(Rotina.periodicidade == periodicidade)
    if status:
        query = query.filter(Rotina.status == status)
    if data_inicio:
        query = query.filter(Rotina.periodo_inicio >= date.fromisoformat(data_inicio))
    if data_fim:
        query = query.filter(Rotina.periodo_fim <= date.fromisoformat(data_fim))
    if busca:
        from sqlalchemy import or_
        query = query.filter(or_(
            Usuario.nome.ilike(f'%{busca}%'),
            AtividadeCatalogo.nome.ilike(f'%{busca}%'),
        ))

    rotinas = query.order_by(Rotina.atualizado_em.desc()).all()

    cabecalho = [
        'Colaborador', 'Regional', 'Cargo', 'Atividade', 'Periodicidade',
        'Período Início', 'Período Fim', 'Status', 'Status Aprovação',
        'Categoria', 'Empreendimento', 'Data Execução', 'Hora Início', 'Hora Término',
        'Objetivo', 'Resumo da Execução', 'Principais Temas',
        'Leads - Resultado', 'Leads - Meta', 'Leads - Status',
        'Conversão - Resultado', 'Conversão - Meta', 'Conversão - Status',
        'Visitas - Resultado', 'Visitas - Meta', 'Visitas - Status',
        'Reservas - Resultado', 'Reservas - Meta', 'Reservas - Status',
        'Vendas - Resultado', 'Vendas - Meta', 'Vendas - Status',
        'Observação Evidências', 'Dificuldades', 'Motivo Desvio 1', 'Motivo Desvio 2',
        'Descrição da Causa', 'Necessita Apoio', 'Área de Apoio', 'Motivo Apoio',
        'Objetivo Atingido', 'Próximos Passos',
        'Qtde Evidências', 'Qtde Participantes', 'Qtde Ações no Plano',
        'Relatório Customizado',
    ]

    linhas = []
    for r in rotinas:
        try:
            f = json.loads(r.formulario_comercial) if r.formulario_comercial else {}
        except Exception:
            f = {}

        def ind(nome, campo):
            return f.get('resultados', {}).get(nome, {}).get(campo, '')

        participantes = f.get('participantes', [])
        plano = f.get('plano_acao', [])

        custom_keys = [k for k in f.keys() if k not in ['categoria', 'empreendimento', 'data_execucao', 'hora_inicio', 'hora_termino', 'objetivo', 'resumo_execucao', 'principais_temas', 'resultados', 'observacao_evidencias', 'dificuldades', 'motivo_desvio_1', 'motivo_desvio_2', 'descricao_causa', 'necessita_apoio', 'area_apoio', 'motivo_apoio', 'objetivo_atingido', 'proximos_passos', 'participantes', 'plano_acao']]
        custom_parts = []
        for k in custom_keys:
            val = f[k]
            if isinstance(val, list):
                list_parts = []
                for item in val:
                    if isinstance(item, dict):
                        item_str = ", ".join(f"{ik}: {iv}" for ik, iv in item.items() if iv)
                        if item_str:
                            list_parts.append(f"[{item_str}]")
                    else:
                        list_parts.append(str(item))
                custom_parts.append(f"{k}: " + "; ".join(list_parts))
            else:
                custom_parts.append(f"{k}: {val}")
        custom_summary = " | ".join(custom_parts)

        linhas.append([
            r.usuario.nome if r.usuario else '',
            r.usuario.regional.nome if r.usuario and r.usuario.regional else '',
            r.atividade.perfil if r.atividade else '',
            r.atividade.nome if r.atividade else '',
            r.periodicidade or '',
            r.periodo_inicio.isoformat() if r.periodo_inicio else '',
            r.periodo_fim.isoformat() if r.periodo_fim else '',
            r.status or '',
            r.status_aprovacao or '',
            f.get('categoria', ''),
            f.get('empreendimento', ''),
            f.get('data_execucao', ''),
            f.get('hora_inicio', ''),
            f.get('hora_termino', ''),
            f.get('objetivo', ''),
            f.get('resumo_execucao', ''),
            f.get('principais_temas', ''),
            ind('Leads','resultado_atual'), ind('Leads','meta'), ind('Leads','status'),
            ind('Conversão','resultado_atual'), ind('Conversão','meta'), ind('Conversão','status'),
            ind('Visitas','resultado_atual'), ind('Visitas','meta'), ind('Visitas','status'),
            ind('Reservas','resultado_atual'), ind('Reservas','meta'), ind('Reservas','status'),
            ind('Vendas','resultado_atual'), ind('Vendas','meta'), ind('Vendas','status'),
            f.get('observacao_evidencias', ''),
            f.get('dificuldades', ''),
            f.get('motivo_desvio_1', ''),
            f.get('motivo_desvio_2', ''),
            f.get('descricao_causa', ''),
            f.get('necessita_apoio', ''),
            f.get('area_apoio', ''),
            f.get('motivo_apoio', ''),
            f.get('objetivo_atingido', ''),
            f.get('proximos_passos', ''),
            len(r.evidencias),
            len([p for p in participantes if p.get('nome')]),
            len([a for a in plano if a.get('acao')]),
            custom_summary,
        ])

    return _export_csv('relatorios_preenchimento.csv', cabecalho, linhas)


@rotinas_bp.route('/metricas-aprovacao', methods=['GET'])
@jwt_required()
def metricas_aprovacao():
    me = get_current_user()
    if me.perfil != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403

    from backend.models import AprovacaoRotina
    limite = min(request.args.get('limit', 200, type=int), 500)
    aprovador_id = request.args.get('aprovador_id', type=int)

    query = AprovacaoRotina.query.order_by(AprovacaoRotina.criado_em.desc())
    if aprovador_id:
        query = query.filter_by(aprovador_id=aprovador_id)

    registros = query.limit(limite).all()

    # Agrupamento por aprovador
    por_aprovador = {}
    for a in registros:
        aid = a.aprovador_id
        if aid not in por_aprovador:
            por_aprovador[aid] = {
                'aprovador_id': aid,
                'aprovador_nome': a.aprovador.nome if a.aprovador else 'N/A',
                'total': 0,
                'aprovadas': 0,
                'reprovadas': 0,
                'com_tempo': 0,
                'soma_segundos': 0,
                'min_segundos': None,
                'max_segundos': None,
            }
        info = por_aprovador[aid]
        info['total'] += 1
        if a.acao == 'aprovada':
            info['aprovadas'] += 1
        else:
            info['reprovadas'] += 1
        if a.duracao_revisao_segundos is not None:
            info['com_tempo'] += 1
            info['soma_segundos'] += a.duracao_revisao_segundos
            if info['min_segundos'] is None or a.duracao_revisao_segundos < info['min_segundos']:
                info['min_segundos'] = a.duracao_revisao_segundos
            if info['max_segundos'] is None or a.duracao_revisao_segundos > info['max_segundos']:
                info['max_segundos'] = a.duracao_revisao_segundos

    for info in por_aprovador.values():
        ct = info['com_tempo']
        info['media_segundos'] = round(info['soma_segundos'] / ct) if ct > 0 else None

    return jsonify({
        'registros': [a.to_dict() for a in registros],
        'por_aprovador': sorted(por_aprovador.values(), key=lambda x: x['total'], reverse=True),
    })


@rotinas_bp.route('/para-aprovar', methods=['GET'])
@jwt_required()
def atividades_para_aprovar():
    me = get_current_user()
    # status_aprovacao=todas retorna pendentes+aprovadas+reprovadas; default=pendente
    filtro_status = request.args.get('status_aprovacao', 'pendente')

    from sqlalchemy import or_, and_

    if me.perfil == 'admin':
        query = Rotina.query.filter(Rotina.status == 'concluida')
        if filtro_status != 'todas':
            query = query.filter(Rotina.status_aprovacao == filtro_status)
        rotinas = query.order_by(Rotina.data_conclusao.desc()).all()
    elif me.perfil == 'sr':
        # SR vê atividades concluídas da sua regional (exceto as próprias, que só o supervisor aprova)
        query = Rotina.query.join(Usuario, Rotina.usuario_id == Usuario.id).filter(
            Usuario.regional_id == me.regional_id,
            Rotina.status == 'concluida',
            Rotina.usuario_id != me.id
        )
        if filtro_status != 'todas':
            query = query.filter(Rotina.status_aprovacao == filtro_status)
        rotinas = query.order_by(Rotina.data_conclusao.desc()).all()
    else:
        return jsonify({'erro': 'Apenas Administrador e Superintendente podem visualizar atividades para aprovação'}), 403

    return jsonify([r.to_dict() for r in rotinas])
