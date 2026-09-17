# FocusGuard Frontend

Quick start (from workspace root):

```bash
cd frontend
npm install
npm start
```

This is a minimal React app that connects to the backend Socket.IO server at `http://localhost:5000` and emits Mediapipe FaceMesh-derived metrics (EAR/MOR). The primary UI pages are `Login` and `Home` (camera + session controls).
