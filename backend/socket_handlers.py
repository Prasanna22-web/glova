from flask_socketio import emit
from models import db, SessionRecord
import json
import traceback


def register_socket_handlers(socketio):
    """Register all socket event handlers"""
    
    @socketio.on('session_event')
    def handle_session_event(payload):
        # payload expected: {user_id, timestamp, ear, mor, yaw, pitch, event_type}
        print('Received session_event:', payload)
        emit('ack', {'status': 'ok'})

    @socketio.on('session_end')
    def handle_session_end(payload):
        # payload expected: {user_id, metrics: [...], start_time, end_time}
        try:
            print('=== Session End Event ===')
            print('Payload:', payload)
            
            user_id = payload.get('user_id')
            metrics = payload.get('metrics') or []
            start_time_ms = payload.get('start_time')
            end_time_ms = payload.get('end_time')
            
            if not user_id:
                print('Error: user_id is missing or None')
                emit('error', {'msg': 'user_id is required'})
                return
            
            user_id = int(user_id)
            print(f'User ID: {user_id}, Metrics count: {len(metrics)}')
            
            # Convert millisecond timestamps to datetime if provided
            from datetime import datetime
            start_time = None
            end_time = None
            
            if start_time_ms:
                start_time = datetime.fromtimestamp(start_time_ms / 1000)
            if end_time_ms:
                end_time = datetime.fromtimestamp(end_time_ms / 1000)
            
            rec = SessionRecord(user_id=user_id, metrics_json=json.dumps(metrics), start_time=start_time, end_time=end_time)
            db.session.add(rec)
            db.session.commit()
            
            print(f'✓ Saved session ID: {rec.id} (duration: {(end_time - start_time).total_seconds() if start_time and end_time else "N/A"}s)')
            emit('saved', {'session_id': rec.id})
            
        except Exception as e:
            print(f'❌ Error saving session: {e}')
            print(traceback.format_exc())
            emit('error', {'msg': str(e)})

