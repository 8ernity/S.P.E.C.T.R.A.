@echo off
title SPECTRA - Satellite Change Intelligence
echo ============================================================
echo   SPECTRA: Satellite Precision Earth Change Tracking
echo ============================================================
echo.
echo Launching Backend and Frontend services...
start "SPECTRA Backend" cmd /k "cd /d ""%~dp0backend"" && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
start "SPECTRA Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"
echo.
echo Services launched!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo.
pause
