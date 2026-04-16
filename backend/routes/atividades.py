from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import AtividadeCatalogo, Usuario
from backend.extensions import db

atividades_bp = Blueprint('atividades', __name__)


def get_current_user():
    uid = int(get_jwt_identity())
    return Usuario.query.get_or_404(uid)


@atividades_bp.route('/', methods=['GET'])
@jwt_required()
def listar():
    perfil = request.args.get('perfil')
    periodicidade = request.args.get('periodicidade')
    ativo = request.args.get('ativo')

    query = AtividadeCatalogo.query
    if perfil:
        query = query.filter_by(perfil=perfil)
    if periodicidade:
        query = query.filter_by(periodicidade=periodicidade)
    if ativo is not None:
        query = query.filter_by(ativo=(ativo.lower() == 'true'))

    atividades = query.order_by(AtividadeCatalogo.perfil, AtividadeCatalogo.ordem).all()
    return jsonify([a.to_dict() for a in atividades])


@atividades_bp.route('/<int:aid>', methods=['GET'])
@jwt_required()
def obter(aid):
    a = AtividadeCatalogo.query.get_or_404(aid)
    return jsonify(a.to_dict())


@atividades_bp.route('/', methods=['POST'])
@jwt_required()
def criar():
    me = get_current_user()
    if me.perfil != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403
    data = request.get_json()
    a = AtividadeCatalogo(
        nome=data['nome'],
        descricao=data.get('descricao'),
        periodicidade=data['periodicidade'],
        perfil=data['perfil'],
        obrigatoria=data.get('obrigatoria', True),
        tipo_evidencia=data.get('tipo_evidencia'),
        indicador=data.get('indicador'),
        prazo_padrao=data.get('prazo_padrao', 7),
        ordem=data.get('ordem', 0),
        ativo=data.get('ativo', True)
    )
    db.session.add(a)
    db.session.commit()
    return jsonify(a.to_dict()), 201


@atividades_bp.route('/<int:aid>', methods=['PUT'])
@jwt_required()
def atualizar(aid):
    me = get_current_user()
    if me.perfil != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403
    a = AtividadeCatalogo.query.get_or_404(aid)
    data = request.get_json()
    for campo in ['nome', 'descricao', 'periodicidade', 'perfil', 'obrigatoria',
                  'tipo_evidencia', 'indicador', 'prazo_padrao', 'ordem', 'ativo']:
        if campo in data:
            setattr(a, campo, data[campo])
    db.session.commit()
    return jsonify(a.to_dict())


@atividades_bp.route('/<int:aid>', methods=['DELETE'])
@jwt_required()
def deletar(aid):
    me = get_current_user()
    if me.perfil != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403
    a = AtividadeCatalogo.query.get_or_404(aid)
    a.ativo = False
    db.session.commit()
    return jsonify({'mensagem': 'Atividade inativada'})
