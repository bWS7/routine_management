import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from backend.extensions import db, jwt, migrate
from backend.routes.auth import auth_bp
from backend.routes.usuarios import usuarios_bp
from backend.routes.regionais import regionais_bp
from backend.routes.atividades import atividades_bp
from backend.routes.rotinas import rotinas_bp


def create_app():
    app = Flask(__name__, static_folder='../frontend/static', static_url_path='/static')

    # Config
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-mude-em-producao')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-mude-em-producao')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False

    db_url = os.environ.get('DATABASE_URL', 'sqlite:///gestao_comercial.db')
    # Railway usa postgres://, SQLAlchemy precisa de postgresql://
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    CORS(app, origins='*', supports_credentials=True)

    # Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(usuarios_bp, url_prefix='/api/usuarios')
    app.register_blueprint(regionais_bp, url_prefix='/api/regionais')
    app.register_blueprint(atividades_bp, url_prefix='/api/atividades')
    app.register_blueprint(rotinas_bp, url_prefix='/api/rotinas')

    # Frontend routes
    @app.route('/')
    @app.route('/dashboard')
    @app.route('/usuarios')
    @app.route('/regionais')
    @app.route('/atividades')
    @app.route('/rotinas')
    @app.route('/perfil')
    def frontend():
        return send_from_directory('../frontend', 'index.html')

    @app.route('/imagens/<path:filename>')
    def imagens(filename):
        return send_from_directory('../imagens', filename)

    @app.route('/health')
    def health():
        return jsonify({'status': 'ok'})

    # Init DB and seed
    with app.app_context():
        db.create_all()
        _seed_initial_data()

    return app


def _seed_initial_data():
    from backend.models import Usuario, AtividadeCatalogo
    from backend.seed_data import ATIVIDADES_CATALOGO

    # Admin padrão
    if not Usuario.query.filter_by(email='admin@sistema.com').first():
        admin = Usuario(
            nome='Administrador',
            email='admin@sistema.com',
            perfil='admin',
            status='ativo'
        )
        admin.set_senha('admin123')
        db.session.add(admin)
        db.session.commit()

    # Catálogo de atividades
    if AtividadeCatalogo.query.count() == 0:
        for item in ATIVIDADES_CATALOGO:
            a = AtividadeCatalogo(**item)
            db.session.add(a)
        db.session.commit()


app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
