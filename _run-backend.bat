@echo off
title SPECTRA Backend (FastAPI)
echo Starting SPECTRA Backend on http://localhost:8000...
cd /d "%~dp0backend"
call .venv\Scripts\activate.bat
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
pause
