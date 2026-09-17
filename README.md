<div align="center">

# 🎯 Glova

**Real-Time Focus & Attention Monitoring, Powered by Computer Vision**

A full-stack web application that uses live webcam-based face and eye analysis to help users track, visualize, and improve their focus during study or work sessions.

[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Backend-Flask-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-07405E?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

</div>

---

## 📖 Overview

**Glova** provides a practical, data-driven way to understand attention and engagement during focused work. By analyzing live webcam input for facial and eye-movement cues, the system detects attention and alertness in real time, streams that data to an interactive dashboard, and persists session history for long-term self-review.

The project demonstrates the integration of **computer vision**, **real-time bidirectional communication**, and **data visualization** into a single, cohesive productivity tool.

## ✨ Key Features

| Category | Capability |
|---|---|
| 🔐 **Authentication** | Secure user registration, login, and profile management |
| 👁️ **Live Monitoring** | Real-time focus tracking via webcam-based face and eye analysis |
| 📊 **Dashboard** | Live session metrics rendered as interactive charts |
| 🕓 **History** | Persistent session logs for reviewing past performance |
| ⚡ **Real-Time Sync** | Bi-directional updates between client and server via Socket.IO |
| 🧩 **REST API** | Clean backend API for session and user data |

## 🏗️ Architecture

```
┌──────────────────┐        WebSocket / REST        ┌──────────────────────┐
│   React Frontend  │ ◄─────────────────────────────► │   Flask Backend       │
│  (Dashboard, UI)  │                                 │ (API + Socket.IO)     │
└──────────────────┘                                 └──────────┬───────────┘
                                                                  │
                                                        ┌─────────▼──────────┐
                                                        │   SQLite Database   │
                                                        │ (Users & Sessions)  │
                                                        └─────────────────────┘
```

## 🛠️ Tech Stack

**Frontend**
- React
- JavaScript (ES6+)
- Chart.js — session data visualization
- Socket.IO Client — real-time updates

**Backend**
- Python
- Flask — application framework
- Flask-SocketIO — real-time server communication
- Flask-SQLAlchemy — ORM layer
- SQLite — lightweight relational database

## 📁 Project Structure

```
glova/
├── backend/
│   ├── app.py                # Flask app entry point
│   ├── models.py              # Database models
│   ├── socket_handlers.py     # Real-time event handlers
│   ├── requirements.txt       # Python dependencies
│   └── README.md
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
├── instance/                  # SQLite database instance
├── README.md
└── package-lock.json
```

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+ and npm
- A webcam-enabled device

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/glova.git
cd glova
```

### 2. Backend Setup
```bash
python -m pip install -r backend/requirements.txt
python backend/app.py
```
The backend server starts at **http://localhost:5001**

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
The frontend app starts at **http://localhost:3000**

## 💻 Usage

1. **Create an account** and log in to the application
2. **Grant webcam access** when prompted
3. **Start a monitoring session** from the dashboard
4. **Track focus status** in real time as metrics update live
5. **Review session statistics and history** at any point after the session ends

## 🎓 Outcome

Glova demonstrates how computer vision, real-time web communication, and data visualization can be combined into a practical, intelligent focus-tracking system — suitable for both academic demonstration and real-world productivity use cases.

## 🗺️ Roadmap

- [ ] Mobile-responsive dashboard
- [ ] Exportable session reports (PDF/CSV)
- [ ] Configurable focus/alertness thresholds
- [ ] Multi-session analytics and trend graphs

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Prasanna**

---

<div align="center">
<sub>Built with ❤️ using React, Flask, and Socket.IO</sub>
</div>
