# FocusGuard Backend

This backend provides a minimal scaffold for FocusGuard: Flask + Flask-SocketIO + SQLite.

Quick start (Windows, from workspace root):

```bash
python -m pip install -r backend/requirements.txt
python backend/app.py
```

Endpoints:
- `POST /api/register` {username,password}
- `POST /api/login` {username,password}
- `GET /api/sessions/<user_id>`

SocketIO events:
- `session_event` — lightweight telemetry events
- `session_end` — full session metrics (server saves to SQLite)
