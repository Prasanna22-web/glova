@echo off
pushd %~dp0
if not exist .venv (
    python -m venv .venv
)
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
echo Starting backend server on http://localhost:5000
python app.py
popd
