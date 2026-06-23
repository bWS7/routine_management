from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.audit import log_audit, diff_payload
from backend.models import Empreendimento, Usuario
from backend.extensions import db

empreendimentos_bp = Blueprint('empreendimentos', __name__)


def get_current_user():
    uid = int(get_jwt_identity())
    return Usuario.query.get_or_404(uid)


@empreendimentos_bp.route('/', methods=['GET'])
@jwt_required()
def listar():
    ativo = request.args.get('ativo')
    regional_id = request.args.get('regional_id', type=int)
    query = Empreendimento.query
    if ativo is not None:
        query = query.filter_by(ativo=(ativo.lower() == 'true'))
    if regional_id:
        query = query.filter_by(regional_id=regional_id)
    empreendimentos = query.order_by(Empreendimento.nome).all()
    return jsonify([e.to_dict() for e in empreendimentos])


@empreendimentos_bp.route('/<int:eid>', methods=['GET'])
@jwt_required()
def obter(eid):
    e = Empreendimento.query.get_or_404(eid)
    return jsonify(e.to_dict())


@empreendimentos_bp.route('/', methods=['POST'])
@jwt_required()
def criar():
    me = get_current_user()
    if me.perfil != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403
    data = request.get_json()
    if not data.get('nome'):
        return jsonify({'erro': 'Informe o nome do empreendimento'}), 400
    e = Empreendimento(
        nome=data['nome'],
        descricao=data.get('descricao'),
        regional_id=data.get('regional_id') or None,
    )
    db.session.add(e)
    db.session.commit()
    log_audit(me.id, 'empreendimento', e.id, 'criar', e.to_dict())
    db.session.commit()
    return jsonify(e.to_dict()), 201


@empreendimentos_bp.route('/<int:eid>', methods=['PUT'])
@jwt_required()
def atualizar(eid):
    me = get_current_user()
    if me.perfil != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403
    e = Empreendimento.query.get_or_404(eid)
    before = e.to_dict()
    data = request.get_json()
    if 'nome' in data:
        e.nome = data['nome']
    if 'descricao' in data:
        e.descricao = data['descricao']
    if 'regional_id' in data:
        e.regional_id = data['regional_id'] or None
    if 'ativo' in data:
        e.ativo = data['ativo']
    after = e.to_dict()
    mudancas = diff_payload(before, after)
    if mudancas:
        log_audit(me.id, 'empreendimento', e.id, 'atualizar', mudancas)
    db.session.commit()
    return jsonify(e.to_dict())


@empreendimentos_bp.route('/<int:eid>', methods=['DELETE'])
@jwt_required()
def deletar(eid):
    me = get_current_user()
    if me.perfil != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403
    e = Empreendimento.query.get_or_404(eid)
    e.ativo = False
    log_audit(me.id, 'empreendimento', e.id, 'excluir', {'ativo': False, 'nome': e.nome})
    db.session.commit()
    return jsonify({'mensagem': 'Empreendimento inativado'})
