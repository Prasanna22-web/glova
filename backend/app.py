from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, SessionRecord
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'change-me'
CORS(app)

db.init_app(app)
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading')

with app.app_context():
    try:
        db.create_all()
        print('✓ Database initialized successfully - app.py:20')
    except Exception as e:
        print(f'❌ Database initialization error: {e} - app.py:22')

# Import and register socket handlers
from socket_handlers import register_socket_handlers
register_socket_handlers(socketio)


@app.route('/api/register', methods=['POST'])
def register():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'msg': 'missing'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'msg': 'exists'}), 400
    user = User(username=username, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return jsonify({'msg': 'ok', 'user': user.to_dict()})


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'msg': 'missing'}), 400
    u = User.query.filter_by(username=username).first()
    if not u or not check_password_hash(u.password_hash, password):
        return jsonify({'msg': 'invalid'}), 401
    return jsonify({'msg': 'ok', 'user': u.to_dict()})


@app.route('/api/sessions/<int:user_id>', methods=['GET'])
def get_sessions(user_id):
    recs = SessionRecord.query.filter_by(user_id=user_id).order_by(SessionRecord.start_time.desc()).all()
    return jsonify([r.to_dict() for r in recs])


@app.route('/api/sessions/<int:user_id>/<int:session_id>', methods=['GET'])
def get_session_detail(user_id, session_id):
    rec = SessionRecord.query.filter_by(id=session_id, user_id=user_id).first()
    if not rec:
        return jsonify({'msg': 'not found'}), 404
    return jsonify(rec.to_dict())


@app.route('/api/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    u = User.query.get(user_id)
    if not u:
        return jsonify({'msg': 'not found'}), 404
    return jsonify(u.to_dict())


@app.route('/api/user/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    u = User.query.get(user_id)
    if not u:
        return jsonify({'msg': 'not found'}), 404
    
    data = request.json or {}
    if 'full_name' in data:
        u.full_name = data['full_name']
    if 'email' in data:
        u.email = data['email']
    if 'course' in data:
        u.course = data['course']
    if 'bio' in data:
        u.bio = data['bio']
    if 'profile_picture' in data:
        u.profile_picture = data['profile_picture']
    
    db.session.commit()
    return jsonify({'msg': 'ok', 'user': u.to_dict()})


if __name__ == '__main__':
    # Use eventlet for production-like Socket.IO behavior
    socketio.run(app, host='0.0.0.0', port=5001)
